# ✅ Checklist de Tarefas Pendentes

Este arquivo serve como um guia para as próximas implementações e ajustes no projeto.

---

### 🚀 Integração com Pagamento (Asaas)

O objetivo é automatizar a confirmação do pagamento do certificado. Quando um participante paga o boleto no Asaas, o status no painel de administração deve mudar de "Pendente" para "Confirmado" automaticamente.

#### ☐ **Passo 1: Configurar o Ambiente de Testes (Sandbox)**
- [ ] Criar uma conta no ambiente de **Sandbox do Asaas** (`sandbox.asaas.com`).
- [x] No painel do Sandbox, obter a **Chave de API (API Key)** de testes (para outras integrações).
- [x] No seu terminal, dentro da pasta do projeto, salvar o **Token de Webhook** como um "secret" no Supabase.
  ```bash
  # Crie um token secreto no Asaas (ex: "meu-segredo-super-secreto-123") e use-o aqui:
  supabase secrets set ASAAS_SANDBOX_API_KEY="SEU_TOKEN_SECRETO_DO_WEBHOOK"
  ```

#### ☐ **Passo 2: Adicionar o Campo CPF (a "chave" da integração)**
O CPF será o elo entre o participante no seu sistema e o pagador no Asaas.

- [x] **Banco de Dados:** Adicionar a coluna `cpf` na sua tabela `cadastro_workshop`.
  ```sql
  ALTER TABLE public.cadastro_workshop ADD COLUMN cpf TEXT;
  -- Opcional, mas recomendado: Adicionar uma restrição de unicidade
  ALTER TABLE public.cadastro_workshop ADD CONSTRAINT cadastro_workshop_cpf_key UNIQUE (cpf);
  ```
- [x] **Formulário de Inscrição (`index.html`):** Adicionar o campo "CPF" no formulário.
- [x] **Lógica do Formulário (`formulario.js`):**
    - [x] Adicionar uma máscara para formatar o CPF (ex: `123.456.789-00`).
    - [x] Adicionar uma função para validar o CPF.
    - [x] Enviar o CPF junto com os outros dados na inscrição.
- [x] **Painel de Administração (`admin.html` e `admin.js`):**
    - [x] Adicionar a coluna "CPF" na tabela de inscritos.
    - [x] Incluir o campo "CPF" nos modais de "Adicionar" e "Editar" inscrito.

#### ☑️ **Passo 3: Ajustar a Lógica do Webhook**
A Edge Function `webhook-asaas` precisa ser modificada para usar o CPF.

- [x] **Modificar `supabase/functions/webhook-asaas/index.ts`:**
    - [x] A função receberá o webhook do Asaas, que conterá o CPF do pagador.
    - [x] Em vez de procurar por `externalReference`, a função agora busca na tabela `cadastro_workshop` pelo participante que possui aquele `cpf`.
    - [x] Uma vez encontrado o participante, a função atualiza o `status_pagamento` dele para `pago`.

#### ☐ **Passo 4: Deploy e Configuração Final**
- [x] Fazer o deploy da Edge Function `webhook-asaas` para o Supabase.
  ```bash
  supabase functions deploy webhook-asaas --no-verify-jwt
  ```
- [ ] No painel do **Sandbox do Asaas**, ir em `Integrações > Webhooks`.
- [ ] Criar um novo webhook, colando a URL da sua Edge Function.
- [ ] Marcar para receber notificações de **"Recebimento de Cobrança"**.
- [ ] Realizar um pagamento de teste no Sandbox e verificar se o status do participante muda para "Confirmado" no seu painel de administração.
- [ ] Após validar tudo no Sandbox, repetir o processo de configuração do webhook no ambiente de **produção** do Asaas.
