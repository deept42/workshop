import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Pega as chaves de API do Asaas para poder consultar os dados do cliente.
const ASAAS_API_KEY_SANDBOX = Deno.env.get("ASAAS_SANDBOX_API_KEY");
const ASAAS_API_KEY_PROD = Deno.env.get("ASAAS_API_KEY_PROD");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-webhook-token",
};

serve(async (req: Request) => {
  // Responde imediatamente a requisições OPTIONS (pre-flight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // 2. Lógica do Webhook: Processa apenas eventos de pagamento confirmado
    if (payload.event === "PAYMENT_CONFIRMED" || payload.event === "PAYMENT_RECEIVED") {
      const payment = payload.payment;
      const customerId = payment.customer; // O webhook envia apenas o ID do cliente.

      if (!customerId) {
        throw new Error("ID do cliente não encontrado no payload do webhook.");
      }

      // Determina qual chave de API e URL base do Asaas usar. Prioriza a produção.
      const asaasApiKey = ASAAS_API_KEY_PROD || ASAAS_API_KEY_SANDBOX;
      const asaasBaseUrl = ASAAS_API_KEY_PROD ? "https://api.asaas.com/api/v3" : "https://sandbox.asaas.com/api/v3";

      if (!asaasApiKey) {
        throw new Error("Chave de API do Asaas não configurada para a função de webhook.");
      }

      // Usa o ID do cliente para buscar os dados completos dele na API do Asaas.
      const customerResponse = await fetch(`${asaasBaseUrl}/customers/${customerId}`, {
        method: "GET",
        headers: { "access_token": asaasApiKey },
      });

      const customerData = await customerResponse.json();
      const customerCpf = customerData.cpfCnpj;

      if (!customerCpf) {
        console.warn("Webhook de pagamento recebido, mas sem CPF do cliente no payload.", payment);
        throw new Error("CPF do cliente não encontrado no payload do webhook.");
      }

      // Limpa o CPF para corresponder ao formato do banco de dados (apenas números)
      const cpfLimpo = customerCpf.replace(/\D/g, '');

      // 3. Cria um cliente Supabase com a role 'service_role' para poder escrever no DB.
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? '',
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ''
      );

      // 4. Busca o participante pelo CPF
      const { data: participante, error: fetchError } = await supabaseAdmin
        .from("cadastro_workshop")
        .select("id, nome_completo, status_pagamento")
        .eq("cpf", cpfLimpo)
        .single();

      if (fetchError || !participante) {
        throw new Error(`Webhook recebido, mas nenhum participante encontrado com o CPF: ${cpfLimpo}. Erro: ${fetchError?.message}`);
      }

      // 5. Verificação de Idempotência: Atualiza o status apenas se ele ainda não for 'pago'
      if (participante.status_pagamento !== "pago") {
        const { error: updateError } = await supabaseAdmin
          .from("cadastro_workshop")
          .update({ status_pagamento: "pago" })
          .eq("id", participante.id);

        if (updateError) throw updateError;

        console.log(`Pagamento confirmado para "${participante.nome_completo}" (ID: ${participante.id}). Status atualizado para 'pago'.`);
      } else {
        console.log(`Pagamento para "${participante.nome_completo}" (ID: ${participante.id}) já estava confirmado. Nenhuma ação necessária (Idempotência).`);
      }
    }

    // Resposta de Sucesso para o Asaas
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido no webhook.";
    console.error("Erro ao processar webhook do Asaas:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});