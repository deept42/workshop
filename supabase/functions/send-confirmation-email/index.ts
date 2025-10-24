import { serve, ServerInit } from "https://deno.land/std@0.168.0/http/server.ts";
// Troca do Resend pelo Nodemailer para usar o SMTP da Hostinger
import nodemailer from "npm:nodemailer";

// Pega as credenciais SMTP dos segredos da Supabase
const SMTP_HOST = Deno.env.get("SMTP_HOST");
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "465", 10);
const SMTP_USER = Deno.env.get("SMTP_USER");
const SMTP_PASS = Deno.env.get("SMTP_PASS");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Trata a requisição OPTIONS (pre-flight) para CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Valida se todas as credenciais SMTP foram configuradas
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      throw new Error("As credenciais SMTP não estão configuradas corretamente nos segredos da Supabase.");
    }

    const { nome, email } = await req.json();
    if (!nome || !email) {
      throw new Error("Nome e e-mail são obrigatórios.");
    }

    // Cria o "transportador" do Nodemailer com as credenciais
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true, // `true` para a porta 465
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Envia o e-mail usando o transportador
    await transporter.sendMail({
      from: `"Workshop Municípios Resilientes" <${SMTP_USER}>`,
      to: [email],
      subject: "✅ Inscrição Confirmada: WORKSHOP Municípios Mais Resilientes",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Inter', Arial, sans-serif; }
            .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.05); }
            .header { background-color: #B30000; color: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 4px solid #FFC107; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 800; }
            .content { padding: 35px; color: #374151; line-height: 1.7; }
            .content h2 { color: #111827; margin-top: 0; font-size: 22px; font-weight: 700; }
            .button { display: inline-block; background-color: #B30000; color: #ffffff !important; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; transition: background-color 0.3s; }
            .button:hover { background-color: #8c0000; }
            .cta-banner { background-color: #1f2937; padding: 40px; text-align: center; border-radius: 8px; margin: 30px 0; }
            .cta-banner h3 { color: #ffffff; margin-top: 0; font-size: 20px; }
            .cta-banner p { color: #e5e7eb; }
            .topics ul { list-style-type: none; padding: 0; }
            .topics li { background-color: #1f2937; color: #ffffff; font-weight: bold; margin-bottom: 8px; padding: 12px 15px; border-radius: 4px; }
            .topics li small { display: block; font-weight: normal; opacity: 0.9; margin-top: 4px; font-size: 0.9em; }
            .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .sponsor-logo { max-width: 100px; height: auto; max-height: 45px; object-fit: contain; }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>Sua Vaga está Confirmada!</h1>
            </div>
            <div class="content">
              <h2 style="font-weight: 800;">Olá, ${nome}!</h2>
              <p>É com grande satisfação que confirmamos sua inscrição para o <strong>WORKSHOP: Municípios Mais Resilientes em Desastres</strong>. Prepare-se para dois dias de muito aprendizado e networking.</p>
              
              <h3 style="color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 30px; margin-bottom: 15px;">Informações Essenciais:</h3>
              <p><strong>Data:</strong> 13 e 14 de novembro de 2025<br><strong>Local:</strong> ISULPAR, Paranaguá - PR</p>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                   <td align="center" style="padding: 25px 0;">
                     <a href="https://www.google.com/calendar/render?action=TEMPLATE&text=WORKSHOP%3A+Munic%C3%ADpios+Mais+Resilientes+em+Desastres&dates=20251113T110000Z/20251114T210000Z&location=ISULPAR+-+Instituto+Superior+do+Litoral+do+Paran%C3%A1" target="_blank" class="button" style="margin: 5px;">Agendar Evento</a>
                     <a href="https://www.google.com/maps/dir/?api=1&destination=ISULPAR+-+Instituto+Superior+do+Litoral+do+Paraná" target="_blank" class="button" style="margin: 5px;">Ver Rota no Mapa</a>
                  </td>
                </tr>
              </table>

              <!-- Banner CTA para o site -->
              <div class="cta-banner">
                <h3>Conheça mais sobre o Evento</h3>
                <p>Assista ao vídeo de apresentação e conheça os palestrantes em nosso site oficial.</p>
                <a href="https://deept42.github.io/workshop/#sobre" target="_blank" class="button" style="margin-top: 15px; background-color: #FFC107; color: #1f2937 !important;">Visitar Site</a>
              </div>

              <div class="topics" style="margin-top: 30px;">
                 <h3 style="color: #111827; font-weight: 700;">Principais Tópicos da Programação:</h3>
                <ul>
                  <li>Cidades Resilientes e Gerenciamento de Desastres<small>Estratégias e políticas públicas para um futuro mais seguro.</small></li>
                  <li>Movimentação de Massas na Serra do Mar<small>Análise de riscos, monitoramento e planos de contingência.</small></li>
                  <li>Planos de Auxílio Mútuo (PAM) e Produtos Perigosos<small>Integração e resposta a emergências industriais e portuárias.</small></li>
                  <li>Prevenção de Afogamentos e Eventos Marítimos<small>Técnicas de salvamento, segurança aquática e resposta a incidentes.</small></li>
                </ul>
              </div>
              <p style="margin-top: 30px;">Estamos ansiosos para recebê-lo!</p>
              <p>Atenciosamente,<br><strong style="color: #111827;">Corpo de Bombeiros do Paraná</strong></p>
            </div>
            <div class="footer">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 15px;">
                    <img src="https://web.celepar.pr.gov.br/drupal/images/sesp/bombeiros/brasao_bombeiros_90x90.png" alt="Brasão Corpo de Bombeiros" style="height: 50px; width: auto;">
                    <p style="font-size: 14px; color: #6b7280; font-weight: bold; margin: 10px 0 0 0;">Corpo de Bombeiros do Paraná</p>
                  </td>
                </tr>
              </table>
              <p style="font-size: 12px; color: #9ca3af; margin: 15px 0 0 0;">Você recebeu este e-mail porque se inscreveu no WORKSHOP Municípios Mais Resilientes.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return new Response(JSON.stringify({ message: "E-mail enviado com sucesso!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
