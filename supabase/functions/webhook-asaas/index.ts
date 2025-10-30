import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Não são mais necessárias chaves de API aqui, pois usaremos o externalReference.
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
      // Pega o CPF do cliente que pagou, enviado pelo Asaas.
      const cpfPagador = payment.customer.cpfCnpj;

      if (!cpfPagador) {
        throw new Error("Webhook de pagamento recebido, mas sem CPF do cliente.");
      }

      // 3. Cria um cliente Supabase com a role 'service_role' para poder escrever no DB.
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? '',
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ''
      );

      // Limpa o CPF para corresponder ao formato salvo no banco de dados (apenas números)
      const cpfLimpo = cpfPagador.replace(/\D/g, '');

      // 4. Busca o participante pelo CPF limpo
      const { data: participante, error: fetchError } = await supabaseAdmin
        .from("cadastro_workshop")
        .select("id, nome_completo, status_pagamento, cpf")
        .eq("cpf", cpfLimpo)
        .single();

      if (fetchError || !participante) {
        throw new Error(`Webhook recebido para CPF ${cpfLimpo}, mas nenhum participante correspondente foi encontrado. Erro: ${fetchError?.message}`);
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