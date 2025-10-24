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
      from: `"Confirmação WMRD-PR" <${SMTP_USER}>`,
      to: [email],
      subject: "✅ Inscrição Confirmada: WORKSHOP Municípios Mais Resilientes",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet">
          <style>
            body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Inter', Arial, sans-serif; }
            .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.07); }
            .header { background-color: #062E51; color: #ffffff; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 800; }
            .content { padding: 35px; color: #374151; line-height: 1.7; }
            .content h2 { color: #062E51; margin-top: 0; font-size: 22px; font-weight: 700; }
            .button { display: inline-block; background-color: #E63946; color: #ffffff !important; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; transition: background-color 0.3s; }
            .button:hover { background-color: #c9323d; }
            .cta-banner { background-image: linear-gradient(rgba(6, 46, 81, 0.8), rgba(6, 46, 81, 0.8)), url('https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'); background-size: cover; background-position: center; padding: 40px; text-align: center; border-radius: 8px; margin: 30px 0; }
            .cta-banner h3 { color: #ffffff; margin-top: 0; font-size: 20px; }
            .cta-banner p { color: #e5e7eb; }
            .topics ul { list-style-type: none; padding: 0; }
            .topics li { background-color: #f9fafb; margin-bottom: 8px; padding: 12px 15px; border-left: 4px solid #E63946; border-radius: 4px; }
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
              
              <h3 style="color: #062E51; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 30px; margin-bottom: 15px;">Informações Essenciais:</h3>
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
                <a href="https://deept42.github.io/workshop/#sobre" target="_blank" class="button" style="margin-top: 15px; background-color: #ffffff; color: #062E51 !important;">Visitar Site</a>
              </div>

              <div class="topics" style="margin-top: 30px;">
                 <h3 style="color: #062E51; font-weight: 700;">Principais Tópicos da Programação:</h3>
                <ul>
                  <li>Cidades Resilientes e Gerenciamento de Desastres</li>
                  <li>Movimentação de Massas na Serra do Mar</li>
                  <li>Planos de Auxílio Mútuo (PAM) e Produtos Perigosos</li>
                  <li>Prevenção de Afogamentos e Eventos Marítimos</li>
                </ul>
              </div>
              <p style="margin-top: 30px;">Estamos ansiosos para recebê-lo!</p>
              <p>Atenciosamente,<br><strong style="color: #062E51;">Equipe de Organização do WMRD-PR</strong></p>
            </div>
            <div class="footer">
               <img src="https://web.celepar.pr.gov.br/drupal/images/sesp/bombeiros/brasao_bombeiros_90x90.png" alt="Logo Corpo de Bombeiros" style="height: 50px; width: auto; margin-bottom: 20px;">
               <p style="font-size: 14px; color: #6b7280; margin: 0 0 20px 0;">Realização e Apoio:</p>
               
               <!-- Tabela para alinhar os logos dos patrocinadores -->
               <table border="0" cellpadding="10" cellspacing="0" width="100%" style="max-width: 450px; margin: 0 auto;">
                 <tr>
                   <td align="center" valign="middle"><img src="https://www.defesacivil.pr.gov.br/sites/defesa-civil/arquivos_restritos/files/imagem/2019-05/1769_Defesa_Civil__PR.PNG" alt="Logo Defesa Civil Paraná" class="sponsor-logo"></td>
                   <td align="center" valign="middle"><img src="https://web.celepar.pr.gov.br/drupal/images/seil/portos/logo_portos_300x86.png" alt="Logo Portos do Paraná" class="sponsor-logo"></td>
                   <td align="center" valign="middle"><img src="https://portal.isulpar.edu.br/wp-content/uploads/2024/10/logo-texto-1024x378.png" alt="Logo ISULPAR" class="sponsor-logo"></td>
                 </tr>
                 <tr>
                   <td align="center" valign="middle"><img src="https://maximizados.com.br/_next/image?url=%2Fimages%2FLogo.png&w=128&q=75" alt="Logo Maximizados" class="sponsor-logo" style="filter: brightness(0);"></td>
                   <td align="center" valign="middle"><img src="https://talentosbrasil.com.br/img/logotipo/logotipo.png" alt="Logo Talentos Brasil" class="sponsor-logo"></td>
                   <td align="center" valign="middle"></td> <!-- Célula vazia para manter o alinhamento -->
                 </tr>
               </table>

               <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">Você recebeu este e-mail porque se inscreveu no WORKSHOP Municípios Mais Resilientes.</p>
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
