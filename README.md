# Workshop: Municípios Mais Resilientes (WMRD-PR)

Este é o repositório oficial do site para o evento "Workshop: Municípios Mais Resilientes em Desastres", uma iniciativa do Corpo de Bombeiros Militar do Paraná. O site serve como portal de informações, plataforma de inscrição e painel de gerenciamento para os administradores do evento.

## ✨ Funcionalidades

O projeto é dividido em duas áreas principais: a página pública e o painel administrativo.

### Página Pública (`index.html`)

- **Design Responsivo:** Layout otimizado para desktops, tablets e celulares.
- **Contagem Regressiva:** Barra no topo com um contador em tempo real para a data do evento.
- **Vídeo de Fundo:** Seção inicial com um vídeo dinâmico do YouTube.
- **Navegação Intuitiva:**
  - Menu lateral elegante para desktops.
  - Barra de navegação inferior fixa e funcional para tablets e celulares.
  - Rolagem suave entre as seções.
- **Formulário de Inscrição Inteligente:**
  - Validação de campos em tempo real.
  - Máscara para campo de telefone.
  - Autocompletar para municípios do Paraná.
  - Integração direta com o banco de dados **Supabase**.
  - Preenchimento automático de dados para e-mails já cadastrados.
- **Acessibilidade:** Controles para aumentar, diminuir e resetar o tamanho da fonte.
- **Interatividade:** Animações sutis de entrada e zoom na imagem de palestrantes.

### Painel Administrativo (`admin.html`)

- **Acesso Seguro:** Rota protegida com sistema de login e senha via **Supabase Auth**.
- **Dashboard de Métricas:**
  - Cards com dados chave: total de inscritos, municípios únicos, adesão a certificados, etc.
  - Gráficos visuais (usando Chart.js) para participação por dia e top 5 municípios.
- **Gerenciamento de Inscritos:**
  - Tabela completa com todos os participantes.
  - Funcionalidades de **busca**, **filtro** por coluna e **ordenação**.
  - Sistema de **Lixeira**: mova inscritos para a lixeira em vez de deletar permanentemente.
  - **Ações em Massa:** Selecione múltiplos inscritos para mover para a lixeira ou exportar.
- **Exportação de Dados:**
  - Exporte a lista de inscritos para **CSV**.
  - Gere um **PDF** profissional com a lista completa.
  - Exporte uma **Lista de Chamada (Checklist)** em PDF, pronta para impressão.
- **Adição Manual:** Modal para adicionar novos inscritos diretamente pelo painel.

## 🚀 Tecnologias Utilizadas

- **Frontend:**
  - HTML5
  - CSS3 com **Tailwind CSS** para estilização rápida.
  - JavaScript (ES6+ com módulos)
- **Backend e Banco de Dados:**
  - **Supabase:** Usado como um backend completo para:
    - **Database:** Armazenamento de todos os inscritos.
    - **Auth:** Sistema de autenticação para o painel de admin.
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
      empresa text,
      email text NOT NULL,
      telefone text,
      municipio text,
      participa_dia_13 boolean DEFAULT false,
      participa_dia_14 boolean DEFAULT false,
      concorda_comunicacoes boolean DEFAULT true,
      quer_certificado boolean DEFAULT false,
      status_pagamento text DEFAULT 'nao_solicitado'::text,
      is_deleted boolean NOT NULL DEFAULT false,
      CONSTRAINT cadastro_workshop_pkey PRIMARY KEY (id),
      CONSTRAINT cadastro_workshop_email_key UNIQUE (email)
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