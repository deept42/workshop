import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Pega as chaves de API do Asaas dos segredos do Supabase.
const ASAAS_API_KEY_SANDBOX = Deno.env.get("ASAAS_SANDBOX_API_KEY"); // Chave para ambiente de testes
const ASAAS_API_KEY_PROD = Deno.env.get("ASAAS_API_KEY_PROD");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { id, nome, email, cpf, telefone, municipio, cep } = await req.json();

    if (!id || !nome || !email || !cpf || !telefone || !municipio || !cep) {
      throw new Error("Dados do inscrito incompletos para gerar a cobrança.");
    }

    // Determina qual chave de API e URL base do Asaas usar. Prioriza a produção.
    const asaasApiKey = ASAAS_API_KEY_PROD || ASAAS_API_KEY_SANDBOX;
    const asaasBaseUrl = ASAAS_API_KEY_PROD ? "https://api.asaas.com/api/v3" : "https://sandbox.asaas.com/api/v3";

    if (!asaasApiKey) {
      throw new Error("Chave de API do Asaas não configurada para o ambiente.");
    }

    // 1. Buscar ou Criar Cliente no Asaas
    let customerId;
    try {
      const searchCustomerResponse = await fetch(`${asaasBaseUrl}/customers?cpfCnpj=${cpf.replace(/\D/g, '')}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "access_token": asaasApiKey,
        },
      });

      const searchCustomerData = await searchCustomerResponse.json();

      if (searchCustomerData.data && searchCustomerData.data.length > 0) {
        // Cliente encontrado, vamos ATUALIZAR seus dados para garantir consistência
        const existingCustomerId = searchCustomerData.data[0].id;
        console.log(`Cliente Asaas encontrado (${existingCustomerId}). Atualizando dados...`);
        await fetch(`${asaasBaseUrl}/customers/${existingCustomerId}`, {
          method: "POST", // A API do Asaas usa POST para atualizar
          headers: {
            "Content-Type": "application/json",
            "access_token": asaasApiKey,
          },
          body: JSON.stringify({
            // Atualiza apenas os campos que podem mudar
            name: nome,
            email: email,
            phone: telefone.replace(/\D/g, ''),
          }),
        });
        customerId = existingCustomerId;
      } else {
        // Se não encontrou, cria um novo cliente com dados mais completos
        const createCustomerResponse = await fetch(`${asaasBaseUrl}/customers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "access_token": asaasApiKey,
          },
          body: JSON.stringify({
            name: nome,
            email: email,
            cpfCnpj: cpf.replace(/\D/g, ''),
            phone: telefone.replace(/\D/g, ''),
            mobilePhone: telefone.replace(/\D/g, ''),
            address: "Rua do Workshop",
            addressNumber: "123",
            complement: "Sala 1",
            province: "Centro",
            city: municipio,
            state: "PR", // Adicionando o estado
            postalCode: cep.replace(/\D/g, ''),
            externalReference: id,
          }),
        });

        const createCustomerData = await createCustomerResponse.json();
        if (createCustomerData.id) {
          customerId = createCustomerData.id;
          console.log(`Cliente Asaas criado para CPF ${cpf}: ${customerId}`);
        } else {
          // Log mais detalhado do erro vindo do Asaas
          const errorDetail = createCustomerData.errors ? JSON.stringify(createCustomerData.errors) : 'Resposta inesperada da API.';
          throw new Error(`Erro ao criar cliente no Asaas: ${errorDetail}`);
        }
      }
    } catch (customerError) {
      console.error("Erro na etapa de cliente Asaas:", customerError);
      throw new Error("Falha ao buscar ou criar cliente no Asaas.");
    }

    // 2. Criar Cobrança
    try {
      const createChargeResponse = await fetch(`${asaasBaseUrl}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": asaasApiKey,
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: "UNDEFINED", // Permite que o cliente escolha (Boleto, Pix, Cartão)
          value: 20.00, // Novo valor do certificado
          dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0], // Vencimento em 7 dias
          description: `Certificado de participação - Workshop WMRD-PR`,
          externalReference: id,
        }),
      });

      const chargeData = await createChargeResponse.json();

      if (chargeData.invoiceUrl) {
        return new Response(JSON.stringify({ invoiceUrl: chargeData.invoiceUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        // Log mais detalhado do erro vindo do Asaas
        const errorDetail = chargeData.errors ? JSON.stringify(chargeData.errors) : 'Resposta inesperada da API.';
        throw new Error(`Erro ao criar cobrança no Asaas: ${errorDetail}`);
      }
    } catch (chargeError) {
      console.error("Erro na etapa de cobrança Asaas:", chargeError);
      throw new Error("Falha ao criar cobrança no Asaas.");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao gerar boleto.";
    console.error("Erro na Edge Function create-asaas-charge:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});