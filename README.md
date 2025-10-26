# Workshop: Municípios Mais Resilientes (WMRD-PR)

![Workshop WMRD-PR](https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaXhkOXJjaHg1YjE4aXI4M3hyc3g0MTE4NG04cHY1bmxjdWZ5N2lqdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ToQqmXCkJZG0MUlYJe/giphy.gif)

Este é o repositório oficial do site para o evento "Workshop: Municípios Mais Resilientes em Desastres", uma iniciativa do Corpo de Bombeiros Militar do Paraná. O projeto consiste em uma página pública para informações e inscrições, e um painel de administração completo para o gerenciamento do evento.

## ✨ Funcionalidades

O projeto é dividido em duas áreas principais: a página pública e o painel administrativo.

### Página Pública (`index.html`)

- **Design Responsivo:** Interface otimizada para desktops, tablets e celulares.
- **Contagem Regressiva:** Barra no topo com um contador em tempo real para a data do evento.
- **Vídeo de Fundo:** Seção de boas-vindas com um vídeo dinâmico em loop.
- **Navegação Fluida:**
  - Menu lateral elegante para desktops com indicador de seção ativa.
  - Barra de navegação inferior fixa e funcional para dispositivos móveis.
  - Rolagem suave entre as seções da página.
- **Formulário de Inscrição Multi-passo:**
  - Validação de campos em tempo real e ao submeter.
  - Máscaras para campos de CPF, Telefone e CEP.
  - Autocompletar para municípios do Paraná, facilitando o preenchimento.
  - **Preenchimento Automático:** Detecta e-mails já cadastrados e preenche os dados do usuário para agilizar novas inscrições.
  - Integração direta com o banco de dados **Supabase**.
- **Integração de Pagamento (Asaas):**
  - Após a inscrição, um modal oferece a opção de adquirir o certificado.
  - Ao aceitar, uma **Edge Function** do Supabase é chamada para gerar um link de pagamento via API do Asaas.
- **Confirmação por E-mail:** Envio automático de e-mail de confirmação com o código de inscrição após o cadastro, utilizando uma Edge Function.
- **Acessibilidade:** Controles para aumentar, diminuir e resetar o tamanho da fonte.
- **Interatividade:** Animações de entrada para elementos e efeito de zoom na imagem de palestrantes.

### Painel Administrativo (`admin.html`)

- **Acesso Seguro:** Rota protegida com sistema de login e senha via **Supabase Auth**.
- **Dashboard Interativo:**
  - **Cards de Métricas em Pilha:** Cards animados que rotacionam automaticamente ou com um clique, exibindo múltiplas métricas (Ex: Total de empresas, empresa com mais/menos inscritos).
  - **Gráficos Detalhados:** Visualizações (usando Chart.js) para participação por dia, top 5 municípios e top 5 empresas.
- **Gerenciamento de Inscritos:**
  - Tabela completa com todos os participantes.
  - Funcionalidades de **busca**, **filtro** por coluna e **ordenação**.
  - **Edição de Status de Pagamento:** Altere o status do certificado (Confirmado, Pendente, Não solicitado) diretamente na tabela.
  - **Sistema de Lixeira:** Mova inscritos para a lixeira com a opção de restaurar ou excluir permanentemente, evitando perdas acidentais.
- **Exportação de Dados:**
  - Exporte a lista de inscritos para **CSV**.
  - Gere um **PDF** profissional com a lista completa.
  - Exporte uma **Lista de Chamada (Checklist)** em PDF, pronta para impressão.
- **Ações em Massa Avançadas:**
  - Selecione múltiplos inscritos para mover para a lixeira, restaurar, excluir permanentemente ou exportar.
  - **Editar ou Duplicar** diretamente da barra de ações, sem precisar rolar a tabela.
- **Ferramentas de Produtividade:**
  - **Adição Manual:** Modal para adicionar novos inscritos diretamente pelo painel, com opção "Salvar e Novo" para agilizar cadastros em lote.
  - **Duplicação de Inscritos:** Crie um novo registro a partir de um existente, ideal para cadastrar pessoas da mesma empresa.
  - **Exclusão de Duplicados:** Ferramenta que identifica inscritos com o mesmo nome e move os registros mais antigos para a lixeira.
- **Tutorial Guiado Interativo:** Um tour completo que destaca e explica cada funcionalidade do painel, simulando cliques para abrir menus e modais.
- **Notificações do GitHub:** Um badge no cabeçalho informa sobre novas atualizações (commits) no repositório do projeto.

## 🚀 Tecnologias Utilizadas

- **Frontend:**
  - HTML5
  - CSS3 com **Tailwind CSS** para estilização rápida.
  - JavaScript (ES6+ com Módulos)
- **Backend e Banco de Dados:**
  - **Supabase:** Usado como um backend completo para:
    - **Database:** Armazenamento de todos os inscritos.
    - **Auth:** Sistema de autenticação para o painel de admin.
    - **Edge Functions (Deno/TypeScript):** Para envio de e-mails de confirmação e geração de cobranças via API externa (Asaas).
- **Bibliotecas JavaScript:**
  - **Chart.js:** Para a criação dos gráficos no dashboard.
  - **jsPDF** e **jsPDF-AutoTable:** Para a geração dos arquivos PDF.

## 📂 Estrutura do Projeto

```
/
├── 📄 index.html             # A página pública do evento.
├── 📄 admin.html             # O painel de administração.
├── 📄 README.md              # Este arquivo de documentação.
│
├── 📁 css/
│   └── 📄 style.css          # Estilos personalizados.
│
└── 📁 js/
    ├── 📄 script.js           # Script principal da página pública.
    ├── 📄 admin.js            # Script principal do painel de admin.
    ├── 📄 supabaseClient.js   # Configuração da conexão com o Supabase.
    ├── 📄 auth.js             # Lógica de login e logout.
    ├── 📄 formulario.js       # Validação e envio do formulário.
    ├── 📄 navegacao.js        # Funções de navegação e menus.
    ├── 📄 animacoes.js        # Animações de UI.
    ├── 📄 acessibilidade.js   # Controles de acessibilidade.
    ├── 📄 ui.js               # Componentes de UI (contador, zoom).
    └── 📄 video.js            # Controle dos players de vídeo.
```

## 🔧 Configuração e Instalação

Para rodar este projeto localmente, você precisará configurar o Supabase.

### 1. Configurar o Supabase

1.  Crie uma conta gratuita no supabase.com.
2.  Crie um novo projeto.
3.  No seu projeto Supabase, vá para **SQL Editor** e execute o seguinte código para criar a tabela `cadastro_workshop`:

    ```sql
    CREATE TABLE public.cadastro_workshop (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      nome_completo text NOT NULL,
      cargo_funcao text,
      cpf text,
      empresa text,
      email text NOT NULL,
      telefone text,
      municipio text,
      cep text,
      participa_dia_13 boolean DEFAULT false,
      participa_dia_14 boolean DEFAULT false,
      concorda_comunicacoes boolean DEFAULT true,
      quer_certificado boolean DEFAULT false,
      status_pagamento text DEFAULT 'nao_solicitado'::text,
      is_deleted boolean NOT NULL DEFAULT false,
      codigo_inscricao text,
      CONSTRAINT cadastro_workshop_pkey PRIMARY KEY (id),      
      CONSTRAINT cadastro_workshop_email_key UNIQUE (email),
      CONSTRAINT cadastro_workshop_cpf_key UNIQUE (cpf)
    );
    ```

4.  Vá para **Project Settings** > **API**. Copie a **URL do Projeto** e a chave **`anon` `public`**.

### 2. Configurar o Projeto Localmente

1.  Clone este repositório:
    ```bash
    git clone <url-do-seu-repositorio>
    ```
2.  Na pasta `js/`, crie um arquivo chamado `supabaseClient.js` (se ele não existir).
3.  Cole o seguinte código no arquivo, substituindo com as suas credenciais do Supabase:

    ```javascript
    import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

    const supabaseUrl = 'SUA_URL_DO_SUPABASE';
    const supabaseKey = 'SUA_CHAVE_ANON_PUBLIC';

    export const supabase = createClient(supabaseUrl, supabaseKey);
    ```

4.  Como o projeto usa Módulos JavaScript, você precisa de um servidor local para abri-lo. A forma mais fácil é usar a extensão **Live Server** no Visual Studio Code.

## 🚀 Publicação (Deploy)

O site é estático e pode ser publicado em qualquer serviço de hospedagem que suporte arquivos HTML, CSS e JS, como Netlify, Vercel ou GitHub Pages.

A forma mais recomendada é conectar seu repositório do GitHub a uma dessas plataformas para ter deploys automáticos a cada `git push` na sua branch principal.

---
*Documentação gerada por Gemini Code Assist.*