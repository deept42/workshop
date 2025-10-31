/**
 * @file Arquivo principal que inicializa todas as funcionalidades do site.
 * @description Importa e organiza a execução de todos os módulos de interatividade.
 */

import { configurarControlesAcessibilidade } from './acessibilidade.js';
import { configurarAnimacaoContadores, atualizarLinkNavegacaoAtivo } from './animacoes.js';
import { configurarValidacaoFormulario, configurarAutocompletar, configurarMascaraTelefone, configurarMascaraCPF, configurarMascaraCEP, configurarAutocompletarComDadosSalvos } from './formulario.js';
import { configurarRolagemSuave, configurarBarraProgressoRolagem, configurarMenuMobile } from './navegacao.js';
import { configurarContagemRegressiva, configurarPlayerCustomizado, configurarModalPalestrante } from './ui.js';
import { configurarLoginAdmin, fazerLogout } from './auth.js';
import './notificacoes.js'; // Importa para registrar a função globalmente, se necessário
import { supabase } from './supabaseClient.js';

// Aguarda o carregamento completo do HTML antes de executar os scripts.
document.addEventListener('DOMContentLoaded', () => {

    /**
     * Função de Diagnóstico: Verifica se os elementos essenciais da UI existem.
     * Ajuda a encontrar erros de HTML ou IDs ausentes.
     */
    function rodarDiagnosticoInicial() {
        console.log("--- INICIANDO DIAGNÓSTICO DA INTERFACE ---");
        const elementosEssenciais = [
            'main-header',
            'folder-container',
            'inicio',
            'sobre',
            'programacao',
            'palestrantes',
            'informacoes',
            'patrocinadores',
            'inscricao'
        ];
        elementosEssenciais.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                console.log(`✅ Elemento #${id} encontrado.`);
            } else {
                console.error(`❌ ERRO CRÍTICO: Elemento #${id} NÃO foi encontrado. Verifique o HTML.`);
            }
        });
        console.log("--- DIAGNÓSTICO FINALIZADO ---");
    }

    rodarDiagnosticoInicial(); // Executa o diagnóstico assim que a página carrega

    const folderContainer = document.getElementById('folder-container');

    // --- GERENCIAMENTO DE ESTADO DE AUTENTICAÇÃO (onAuthStateChange) ---
    supabase.auth.onAuthStateChange((event, session) => {
        const areaLogin = document.getElementById('login-admin');
        const areaPrincipal = document.querySelector('main');
        const rodape = document.querySelector('footer');
        // Precisamos controlar o wrapper principal do header, não apenas o conteúdo interno.
        const headerWrapper = document.getElementById('header-wrapper');
        const ctaFlutuante = document.getElementById('inscricao-cta-flutuante');

        // Elementos do novo botão de login flutuante
        const logoutFabBtn = document.getElementById('logout-fab-btn');
        const loginFabBtn = document.getElementById('login-fab-btn');
        const loginFabIcon = document.getElementById('login-fab-icon');
        const loginFabText = document.getElementById('login-fab-text');

        const estaLogado = !!session;

        // Função para mostrar/esconder a tela de login com animação
        const alternarTelaLogin = (mostrar, ehInstantaneo = false) => {
            const leftPane = document.querySelector('.login-pane-left');
            const rightPane = document.querySelector('.login-pane-right');

            // Quando a tela de login é mostrada
            if (mostrar) {
                if (areaLogin) areaLogin.classList.remove('hidden'); // Ação correta: remove a classe que esconde
                if (areaPrincipal) areaPrincipal.style.display = 'none';
                if (rodape) rodape.style.display = 'none';                
                if (headerWrapper) headerWrapper.style.display = 'none'; // Esconde todo o header
                if (ctaFlutuante) ctaFlutuante.classList.add('hidden'); // Esconde o botão de inscrição
                if (loginFabBtn) loginFabBtn.classList.add('hidden'); // Esconde o próprio botão de login
                if (logoutFabBtn) logoutFabBtn.classList.add('hidden'); // Esconde o botão de logout
                // Adiciona a classe 'is-active' para iniciar a animação de entrada
                setTimeout(() => {
                    leftPane?.classList.add('is-active');
                    rightPane?.classList.add('is-active');
                }, 10); // Pequeno delay para garantir que a transição ocorra
            } else {
                // Quando a tela de login é escondida
                leftPane?.classList.remove('is-active');
                rightPane?.classList.remove('is-active');
                
                const mostrarConteudoPrincipal = () => {
                    if (areaLogin) areaLogin.classList.add('hidden'); // Ação correta: adiciona a classe para esconder
                    if (areaPrincipal) areaPrincipal.style.display = 'block';
                    if (rodape) rodape.style.display = 'block';                    
                    if (headerWrapper) headerWrapper.style.display = ''; // Mostra o header novamente (display: flex é o padrão do browser)
                    if (ctaFlutuante) ctaFlutuante.classList.remove('hidden'); // Mostra o botão de inscrição novamente
                    // A visibilidade dos botões de login/logout é controlada por configurarBotoesAuth
                    configurarBotoesAuth(estaLogado);
                };

                // Esconde a tela de login e mostra o site após a animação
                setTimeout(mostrarConteudoPrincipal, ehInstantaneo ? 0 : 500); // Duração da transição
            }
        };

        // Se o usuário estiver logado, esconde a tela de login.
        if (estaLogado) {
            alternarTelaLogin(false, true); // Esconde instantaneamente ao carregar a página se já estiver logado
        }

        // Função para configurar um botão de autenticação
        const configurarBotoesAuth = (logado) => {
            if (!loginFabBtn || !logoutFabBtn || !loginFabIcon || !loginFabText) return;

            if (logado) {
                // Estado LOGADO
                loginFabIcon.textContent = 'admin_panel_settings';
                loginFabText.textContent = 'Painel Admin';
                loginFabBtn.href = 'admin.html'; // Link direto para o painel
                logoutFabBtn.classList.remove('hidden'); // Mostra o botão de logout

                logoutFabBtn.onclick = () => fazerLogout();
            } else {
                // Estado DESLOGADO
                loginFabIcon.textContent = 'login';
                loginFabText.textContent = 'Área do Admin';
                loginFabBtn.href = '#'; // Ação de abrir modal
                logoutFabBtn.classList.add('hidden'); // Esconde o botão de logout
                loginFabBtn.onclick = (e) => { e.preventDefault(); alternarTelaLogin(true); };
            }
        };
        configurarBotoesAuth(estaLogado);

        // --- LÓGICA PARA O BOTÃO "VOLTAR AO SITE" ---
        const backToSiteBtn = document.getElementById('back-to-site-btn');
        if (backToSiteBtn) {
            backToSiteBtn.onclick = (e) => {
                e.preventDefault();
                alternarTelaLogin(false);
            };
        }
    });

    // --- INITIALIZATION ---
    if (document.getElementById('folder-container')) { // Verificação simplificada e corrigida
        // Navegação e Animações
        configurarRolagemSuave();
        configurarMenuMobile();
        configurarBarraProgressoRolagem();
        configurarAnimacaoContadores();
        atualizarLinkNavegacaoAtivo();

        // Formulário
        configurarValidacaoFormulario();
        configurarMascaraCPF();
        configurarMascaraTelefone();
        configurarAutocompletar();
        configurarMascaraCEP();
        configurarAutocompletarComDadosSalvos();

        // Componentes de UI
        configurarContagemRegressiva();
        configurarModalPalestrante();
        configurarPlayerCustomizado();

        // Outros
        configurarControlesAcessibilidade();
        configurarLoginAdmin();
    }

    // --- LÓGICA PARA HEADER FLUTUANTE AO ROLAR ---
    const headerWrapper = document.getElementById('header-wrapper');

    if (headerWrapper) {
        window.addEventListener('scroll', () => {
            // Adiciona a classe 'scrolled' quando o usuário rolar mais de 50px
            headerWrapper.classList.toggle('scrolled', window.scrollY > 50);
        });
    }
});

/**
 * Configura o efeito de "terremoto" e "queda" para a palavra "Desastres".
 */
function configurarEfeitoDesastre() {
    const container = document.getElementById('disaster-word');
    if (!container) return;

    const word = "Desastres";

    function prepararPalavra() {
        // 1. Limpa o contêiner e remove a classe 'active' para reiniciar
        container.innerHTML = '';
        container.classList.remove('active');

        // 2. Divide a palavra e cria um <span> para cada letra, sem definir a animação ainda
        word.split('').forEach((char, index) => {
            const letterSpan = document.createElement('span');
            letterSpan.textContent = char;
            letterSpan.classList.add('letter');
            
            // 3. Define um atraso em cascata para a queda de cada letra
            const delay = index * 0.08; // 0.08s de atraso entre cada letra
            letterSpan.style.animationDelay = `${delay}s`; // O delay é definido, mas a animação não é iniciada
            
            container.appendChild(letterSpan);
        });
    }

    function dispararEfeito() {
        // Primeiro, garante que a palavra esteja no estado inicial (com todas as letras visíveis)
        prepararPalavra();
        
        // 4. Força um "reflow" para o navegador registrar os novos elementos
        void container.offsetWidth;

        // 5. Adiciona a classe 'active' para iniciar as animações
        container.classList.add('active');
    }

    // 6. Adiciona o ouvinte de evento para o clique, que agora dispara o efeito
    container.addEventListener('click', dispararEfeito);

    // 7. Apenas prepara a palavra quando a página carrega, sem iniciar a animação
    prepararPalavra();
}


/**
 * Prepara o texto para a animação de fluxo de cores.
 * Envolve cada caractere do elemento com a classe '.anim-text-flow' em um <span>.
 */
function configurarAnimacaoTexto() {
    const elementosAnimados = document.querySelectorAll('.anim-text-flow');
    elementosAnimados.forEach(elemento => {
        // Pega o texto, remove espaços em branco das pontas e divide em caracteres
        const caracteres = elemento.textContent.trim().split('');
        // Substitui o conteúdo original por spans individuais para cada caractere
        elemento.innerHTML = caracteres.map(char => `<span>${char}</span>`).join('');
    });
}

// Garante que a função seja executada após o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    configurarAnimacaoTexto();
    configurarEfeitoDesastre();
});
