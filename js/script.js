/**
 * @file Arquivo principal que inicializa todas as funcionalidades do site.
 * @description Importa e organiza a execução de todos os módulos de interatividade.
 */

import { configurarControlesAcessibilidade } from './acessibilidade.js';
import { atualizarLinkNavegacaoAtivo, configurarRecalculoIndicadorAoRedimensionar } from './animacoes.js';
import { configurarValidacaoFormulario, configurarAutocompletar, configurarMascaraTelefone, configurarAutocompletarComDadosSalvos } from './formulario.js';
import { configurarRolagemSuave, configurarNavegacaoMouseMeio, configurarMenuMobile, configurarBarraProgressoRolagem, configurarBotaoLogout } from './navegacao.js';
import { configurarContagemRegressiva, configurarZoomImagem } from './ui.js';
import { configurarLoginAdmin, fazerLogout } from './auth.js';
import { configurarPlayersYoutube } from './video.js';
import { supabase } from './supabaseClient.js';

// Aguarda o carregamento completo do HTML antes de executar os scripts.
document.addEventListener('DOMContentLoaded', () => {

    const folderContainer = document.getElementById('folder-container');
    const panels = document.querySelectorAll('.folder-panel');
    let currentVisiblePanel = null;

    // Garante que a área de login comece escondida
    document.getElementById('login-admin').style.display = 'none';

    // --- GERENCIAMENTO DE ESTADO DE AUTENTICAÇÃO (onAuthStateChange) ---
    supabase.auth.onAuthStateChange((event, session) => {
        const areaLogin = document.getElementById('login-admin');
        const areaPrincipal = document.querySelector('main');
        const barraTopo = document.getElementById('top-bar');
        const rodape = document.querySelector('footer');
        const navLateralEsquerda = document.getElementById('side-nav');
        const navLateralDireita = document.getElementById('side-nav-right');

        // Elementos do botão de autenticação
        const authBtn = document.getElementById('auth-btn');
        const authIcon = document.getElementById('auth-icon');
        const authText = document.getElementById('auth-text');

        const estaLogado = !!session;

        // Função para mostrar/esconder a tela de login com animação
        const toggleLoginScreen = (show, isInstant = false) => {
            const leftPane = document.querySelector('.login-pane-left');
            const rightPane = document.querySelector('.login-pane-right');

            if (show) {
                if (areaLogin) areaLogin.style.display = 'grid';
                if (areaPrincipal) areaPrincipal.style.display = 'none';
                if (barraTopo) barraTopo.style.display = 'none';
                if (rodape) rodape.style.display = 'none';
                if (navLateralEsquerda) navLateralEsquerda.style.display = 'none';
                // Adiciona a classe 'is-active' para iniciar a animação de entrada
                setTimeout(() => {
                    leftPane?.classList.add('is-active');
                    rightPane?.classList.add('is-active');
                }, 10); // Pequeno delay para garantir que a transição ocorra
            } else {
                // Remove a classe 'is-active' para a animação de saída
                leftPane?.classList.remove('is-active');
                rightPane?.classList.remove('is-active');
                // Esconde a tela de login e mostra o site após a animação
                setTimeout(() => {
                    if (areaLogin) areaLogin.style.display = 'none';
                    if (areaPrincipal) areaPrincipal.style.display = 'block';
                    if (barraTopo) barraTopo.style.display = 'block';
                    if (rodape) rodape.style.display = 'block';
                    if (navLateralEsquerda) navLateralEsquerda.style.display = 'flex';
                }, isInstant ? 0 : 600); // 600ms corresponde à duração da transição no CSS
            }
        };

        // Se o usuário estiver logado, esconde a tela de login.
        if (estaLogado) {
            toggleLoginScreen(false, true); // Esconde instantaneamente ao carregar a página se já estiver logado
        }

        // A barra de acessibilidade fica sempre visível
        if (navLateralDireita) navLateralDireita.style.display = 'flex';

        // Atualiza o botão de autenticação
        if (authBtn && authIcon && authText) {
            authIcon.textContent = estaLogado ? 'logout' : 'login';
            authText.textContent = estaLogado ? 'Sair' : 'Entrar';
            authBtn.onclick = (e) => { 
                e.preventDefault(); 
                if (estaLogado) {
                    fazerLogout().then(() => {
                        // Após o logout, a tela de login deve aparecer
                        toggleLoginScreen(true);
                    });
                } else {
                    // Se não está logado, mostra a tela de login
                    toggleLoginScreen(true);
                }
            };
        }

        // --- LÓGICA PARA O BOTÃO "VOLTAR AO SITE" ---
        const backToSiteBtn = document.getElementById('back-to-site-btn');
        if (backToSiteBtn) {
            backToSiteBtn.onclick = (e) => {
                e.preventDefault();
                toggleLoginScreen(false);
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
        configurarRecalculoIndicadorAoRedimensionar();

        // Formulário
        configurarValidacaoFormulario();
        configurarAutocompletar();
        configurarMascaraTelefone();
        configurarAutocompletarComDadosSalvos();

        // Componentes de UI
        configurarContagemRegressiva();
        configurarZoomImagem();
        configurarPlayersYoutube();
        configurarLoginAdmin();
        configurarBotaoLogout(fazerLogout);
        configurarControlesAcessibilidade();
    }
});
