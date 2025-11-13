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
import { configurarCarrosselPalestrantes } from './speakers-carousel.js';
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
    const bannerInscricao = document.getElementById('inscricao-banner');
    const bannerWrapper = document.getElementById('inscricao-banner-wrapper');
    const bannerTitle = bannerInscricao?.querySelector('.banner-title');
    const bannerCountdown = bannerInscricao?.querySelector('.banner-countdown');
    const bannerActionText = bannerInscricao?.querySelector('.banner-action-text');
    const body = document.body;

    if (bannerTitle && !bannerTitle.dataset.baseText) {
        bannerTitle.dataset.baseText = bannerTitle.textContent.trim();
    }
    if (bannerActionText && !bannerActionText.dataset.originalText) {
        bannerActionText.dataset.originalText = bannerActionText.textContent.trim();
    }

    let collapsedTickerInterval = null;
    let collapsedTickerIndex = -1;

    const shouldRunTicker = () =>
        bannerInscricao &&
        bannerInscricao.classList.contains('inscricao-banner-collapsed') &&
        !bannerInscricao.classList.contains('inscricao-banner-confirmado') &&
        !bannerInscricao.classList.contains('hidden') &&
        !(bannerWrapper && bannerWrapper.classList.contains('hidden')) &&
        !body.classList.contains('banner-hidden');

    const getCollapsedStates = () => {
        const baseTitle = bannerTitle?.dataset.baseText || 'Evento Imperdível';
        const countdownTimerEl = document.getElementById('countdown-timer');
        const countdownText = countdownTimerEl ? countdownTimerEl.textContent.replace(/\s+/g, ' ').trim() : '';
        const countdownState = countdownText ? `Começa em ${countdownText}` : 'Começa em breve';
        const actionState = bannerActionText?.dataset.originalText || 'Vagas se esgotando';
        return [baseTitle, countdownState, actionState];
    };

    const animateBannerTitle = (newText) => {
        if (!bannerTitle) return;
        if (bannerTitle.textContent === newText) return;
        bannerTitle.classList.remove('ticker-show');
        bannerTitle.classList.add('ticker-hide');
        setTimeout(() => {
            if (!bannerTitle) return;
            bannerTitle.textContent = newText;
            bannerTitle.classList.remove('ticker-hide');
            bannerTitle.classList.add('ticker-show');
            setTimeout(() => bannerTitle?.classList.remove('ticker-show'), 280);
        }, 160);
    };

    const advanceCollapsedState = () => {
        const states = getCollapsedStates();
        if (!states.length) return;
        collapsedTickerIndex = (collapsedTickerIndex + 1) % states.length;
        animateBannerTitle(states[collapsedTickerIndex]);
    };

    const startCollapsedTicker = () => {
        if (!shouldRunTicker() || collapsedTickerInterval) return;
        collapsedTickerIndex = -1;
        advanceCollapsedState();
        collapsedTickerInterval = window.setInterval(advanceCollapsedState, 3200);
    };

    const stopCollapsedTicker = (restore = true) => {
        if (collapsedTickerInterval) {
            clearInterval(collapsedTickerInterval);
            collapsedTickerInterval = null;
        }
        if (restore && bannerTitle && bannerTitle.dataset.baseText && !bannerInscricao?.classList.contains('inscricao-banner-confirmado')) {
            bannerTitle.classList.remove('ticker-hide', 'ticker-show');
            bannerTitle.textContent = bannerTitle.dataset.baseText;
        }
    };

    if (bannerInscricao) {
        bannerInscricao.addEventListener('mouseenter', () => {
            stopCollapsedTicker();
        });
        bannerInscricao.addEventListener('mouseleave', () => {
            if (shouldRunTicker()) {
                startCollapsedTicker();
            }
        });
    }

    const atualizarEstadoBanner = () => {
        if (!bannerInscricao) return;

        if (bannerInscricao.classList.contains('hidden') || bannerWrapper?.classList.contains('hidden')) {
            body.classList.add('banner-hidden');
            body.classList.remove('banner-collapsed');
            return;
        } else {
            body.classList.remove('banner-hidden');
        }

        const deveColapsar = window.scrollY > 160 && !bannerInscricao.classList.contains('inscricao-banner-confirmado');
        if (deveColapsar) {
            if (!bannerInscricao.classList.contains('inscricao-banner-collapsed')) {
                bannerInscricao.classList.add('inscricao-banner-collapsed');
            }
            bannerWrapper?.classList.add('inscricao-banner-wrapper--collapsed');
            body.classList.add('banner-collapsed');
            startCollapsedTicker();
        } else {
            if (bannerInscricao.classList.contains('inscricao-banner-collapsed')) {
                bannerInscricao.classList.remove('inscricao-banner-collapsed');
            }
            bannerWrapper?.classList.remove('inscricao-banner-wrapper--collapsed');
            body.classList.remove('banner-collapsed');
            stopCollapsedTicker();
        }
    };

    atualizarEstadoBanner();
    window.addEventListener('scroll', atualizarEstadoBanner);
    window.__inscricaoBannerControls = {
        stopTicker: stopCollapsedTicker,
        startTicker: startCollapsedTicker,
        refreshStates: atualizarEstadoBanner
    };

    // --- GERENCIAMENTO DE ESTADO DE AUTENTICAÇÃO (onAuthStateChange) ---
    supabase.auth.onAuthStateChange((event, session) => {
        const areaLogin = document.getElementById('login-admin');
        const areaPrincipal = document.querySelector('main');
        const rodape = document.querySelector('footer');
        // Precisamos controlar o wrapper principal do header, não apenas o conteúdo interno.
        const headerWrapper = document.getElementById('header-wrapper');

        // Elementos do novo botão de login flutuante
        const desktopAdminBtn = document.getElementById('nav-admin-btn');
        const desktopLogoutBtn = document.getElementById('nav-logout-btn');
        const mobileAdminBtn = document.getElementById('mobile-admin-btn');
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

        const estaLogado = !!session;

        const alternarTelaLogin = (mostrar, ehInstantaneo = false) => {
            const leftPane = document.querySelector('.login-pane-left');
            const rightPane = document.querySelector('.login-pane-right');

            if (mostrar) {
                if (areaLogin) areaLogin.classList.remove('hidden');
                if (areaPrincipal) areaPrincipal.style.display = 'none';
                if (rodape) rodape.style.display = 'none';
                if (headerWrapper) headerWrapper.style.display = 'none';
                if (bannerInscricao) {
                    bannerInscricao.classList.add('hidden');
                    stopCollapsedTicker(false);
                }
                if (bannerWrapper) {
                    bannerWrapper.classList.add('hidden');
                    bannerWrapper.classList.remove('inscricao-banner-wrapper--collapsed');
                }
                body.classList.add('banner-hidden');
                body.classList.remove('banner-collapsed');
                if (typeof window.__closeMobileMenu === 'function') {
                    window.__closeMobileMenu();
                }
                body.classList.add('login-open');
                setTimeout(() => {
                    leftPane?.classList.add('is-active');
                    rightPane?.classList.add('is-active');
                }, 10);
            } else {
                leftPane?.classList.remove('is-active');
                rightPane?.classList.remove('is-active');

                const mostrarConteudoPrincipal = () => {
                    if (areaLogin) areaLogin.classList.add('hidden');
                    if (areaPrincipal) areaPrincipal.style.display = 'block';
                    if (rodape) rodape.style.display = 'block';
                    if (headerWrapper) headerWrapper.style.display = '';
                    if (bannerInscricao) {
                        bannerInscricao.classList.remove('hidden');
                    }
                    if (bannerWrapper) {
                        bannerWrapper.classList.remove('hidden');
                    }
                    body.classList.remove('banner-hidden');
                    if (typeof window.__closeMobileMenu === 'function') {
                        window.__closeMobileMenu();
                    }
                    body.classList.remove('login-open');
                    atualizarEstadoBanner();
                    configurarBotoesAuth(estaLogado);
                };

                setTimeout(mostrarConteudoPrincipal, ehInstantaneo ? 0 : 500);
            }
        };

        if (estaLogado) {
            alternarTelaLogin(false, true);
        }

        const configurarBotoesAuth = (logado) => {
            const configurarBotaoAdmin = (botao, isMobile = false) => {
                if (!botao) return;
                botao.classList.remove('nav-btn--primary', 'nav-btn--outline', 'nav-btn--surface');
                botao.onclick = null;

                if (logado) {
                    botao.textContent = 'Painel Admin';
                    botao.classList.add('nav-btn--outline');
                    if (isMobile) {
                        botao.classList.add('nav-btn--surface');
                    }
                    botao.onclick = () => {
                        window.location.href = 'admin.html';
                    };
                } else {
                    botao.textContent = 'Área do Admin';
                    botao.classList.add('nav-btn--primary');
                    botao.onclick = (event) => {
                        event.preventDefault();
                        if (typeof window.__closeMobileMenu === 'function') {
                            window.__closeMobileMenu();
                        }
                        alternarTelaLogin(true);
                    };
                }
            };

            const configurarBotaoLogout = (botao, isMobile = false) => {
                if (!botao) return;
                botao.onclick = null;
                if (isMobile) {
                    botao.classList.add('nav-btn--surface');
                }

                if (logado) {
                    botao.classList.remove('hidden');
                    botao.onclick = (event) => {
                        event.preventDefault();
                        if (typeof window.__closeMobileMenu === 'function') {
                            window.__closeMobileMenu();
                        }
                        fazerLogout();
                    };
                } else {
                    botao.classList.add('hidden');
                }
            };

            configurarBotaoAdmin(desktopAdminBtn, false);
            configurarBotaoAdmin(mobileAdminBtn, true);
            configurarBotaoLogout(desktopLogoutBtn, false);
            configurarBotaoLogout(mobileLogoutBtn, true);
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

        const loginCloseBtn = document.getElementById('login-close-btn');
        if (loginCloseBtn) {
            loginCloseBtn.onclick = (e) => {
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
        configurarCarrosselPalestrantes();

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
    // configurarEfeitoDesastre(); // Removido - easter egg não é mais necessário
});
