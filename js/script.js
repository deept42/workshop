/**
 * @file Arquivo principal que inicializa todas as funcionalidades do site.
 * @description Importa e organiza a execução de todos os módulos de interatividade.
 */

import { configurarControlesAcessibilidade } from './acessibilidade.js';
import { atualizarLinkNavegacaoAtivo, configurarRecalculoIndicadorAoRedimensionar, configurarAnimacaoContadores } from './animacoes.js';
import { configurarValidacaoFormulario, configurarAutocompletar, configurarMascaraTelefone, configurarMascaraCPF, configurarMascaraCEP, configurarAutocompletarComDadosSalvos } from './formulario.js';
import { configurarRolagemSuave, configurarNavegacaoMouseMeio, configurarMenuMobile, configurarBarraProgressoRolagem } from './navegacao.js';
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
            'folder-container',
            'inicio',
            'sobre',
            'programacao',
            'palestrantes',
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
        const barraTopo = document.getElementById('top-bar');
        const rodape = document.querySelector('footer');
        const navLateralEsquerda = document.getElementById('side-nav');
        const navLateralDireita = document.getElementById('side-nav-right'); // Acessibilidade
        const bottomNav = document.getElementById('mobile-tablet-bottom-nav'); // Nova navegação inferior
        // Elementos do botão de autenticação (Desktop)
        const authBtn = document.getElementById('auth-btn');
        const authIcon = document.getElementById('auth-icon');
        const authText = document.getElementById('auth-text');
        // Elementos do botão de autenticação (Mobile)
        const authBtnMobile = document.getElementById('auth-btn-mobile');
        const authIconMobile = document.getElementById('auth-icon-mobile');
        const authTextMobile = document.getElementById('auth-text-mobile');

        const estaLogado = !!session;

        // Função para mostrar/esconder a tela de login com animação
        const alternarTelaLogin = (mostrar, ehInstantaneo = false) => {
            const leftPane = document.querySelector('.login-pane-left');
            const rightPane = document.querySelector('.login-pane-right');

            // Quando a tela de login é mostrada
            if (mostrar) {
                if (areaLogin) areaLogin.style.display = 'grid';
                if (areaPrincipal) areaPrincipal.style.display = 'none';
                if (barraTopo) barraTopo.style.display = 'none';
                if (rodape) rodape.style.display = 'none';
                if (navLateralEsquerda) navLateralEsquerda.style.display = 'none';
                if (bottomNav) bottomNav.style.display = 'none'; // Oculta a nova navegação inferior
                // Adiciona a classe 'is-active' para iniciar a animação de entrada
                setTimeout(() => {
                    leftPane?.classList.add('is-active');
                    rightPane?.classList.add('is-active');
                }, 10); // Pequeno delay para garantir que a transição ocorra
            } else {
                // Quando a tela de login é escondida
                leftPane?.classList.remove('is-active');
                rightPane?.classList.remove('is-active');
                // Esconde a tela de login e mostra o site após a animação
                setTimeout(() => {
                    if (areaLogin) areaLogin.style.display = 'none';
                    if (areaPrincipal) areaPrincipal.style.display = 'block';
                    if (barraTopo) barraTopo.style.display = 'block';
                    if (rodape) rodape.style.display = 'block';
                    if (navLateralEsquerda) navLateralEsquerda.style.display = ''; // Remove o estilo inline para que as classes do CSS (hidden lg:flex) voltem a funcionar
                    if (bottomNav) bottomNav.style.display = ''; // Remove o estilo inline para que as classes do CSS (lg:hidden) voltem a funcionar
                }, ehInstantaneo ? 0 : 600); // 600ms corresponde à duração da transição no CSS
            }
        };

        // Se o usuário estiver logado, esconde a tela de login.
        if (estaLogado) {
            alternarTelaLogin(false, true); // Esconde instantaneamente ao carregar a página se já estiver logado
        }

        // Função para configurar um botão de autenticação
        const configurarBotaoAuth = (btn, icon, text, logado, acaoLogout, acaoLogin) => {
            if (btn && icon && text) {
                icon.textContent = logado ? 'logout' : 'login';
                text.textContent = logado ? 'Sair' : 'Entrar';
                btn.onclick = (e) => { 
                    e.preventDefault();
                    if (logado) {
                        acaoLogout().then(() => alternarTelaLogin(true));
                    } else {
                        acaoLogin();
                    }
                };
            }
        }

        // Configura ambos os botões de autenticação (desktop e mobile)
        configurarBotaoAuth(authBtn, authIcon, authText, estaLogado, fazerLogout, () => alternarTelaLogin(true));
        configurarBotaoAuth(authBtnMobile, authIconMobile, authTextMobile, estaLogado, fazerLogout, () => alternarTelaLogin(true));

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
    if (folderContainer) {
        // Navegação e Animações
        configurarRolagemSuave();
        atualizarLinkNavegacaoAtivo();
        configurarMenuMobile();
        configurarNavegacaoMouseMeio();
        configurarBarraProgressoRolagem();
        configurarAnimacaoContadores();
        configurarRecalculoIndicadorAoRedimensionar();

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
});
