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
    document.getElementById('login-admin').style.display = 'none';

    // --- GERENCIAMENTO DE ESTADO DE AUTENTICAÇÃO (onAuthStateChange) ---
    supabase.auth.onAuthStateChange((event, session) => {
        const areaLogin = document.getElementById('login-admin');
        const areaPrincipal = document.querySelector('main');
        const barraTopo = document.getElementById('top-bar');
        const rodape = document.querySelector('footer');
        const navLateralEsquerda = document.getElementById('side-nav');
        const navLateralDireita = document.getElementById('side-nav-right'); // Acessibilidade
        const bottomNav = document.getElementById('mobile-tablet-bottom-nav'); // Nova navegação inferior
        // Elementos do botão de autenticação
        const authBtn = document.getElementById('auth-btn');
        const authIcon = document.getElementById('auth-icon');
        const authText = document.getElementById('auth-text');

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
                // Adiciona a classe 'is-active' para iniciar a animação de entrada (já em português)
                setTimeout(() => {
                    leftPane?.classList.add('is-active');
                    rightPane?.classList.add('is-active');
                }, 10); // Pequeno delay para garantir que a transição ocorra
            } else {
                // Remove a classe 'is-active' para a animação de saída (já em português)
                // Quando a tela de login é escondida
                leftPane?.classList.remove('is-active');
                rightPane?.classList.remove('is-active');
                // Esconde a tela de login e mostra o site após a animação (já em português)
                setTimeout(() => {
                    if (areaLogin) areaLogin.style.display = 'none';
                    if (areaPrincipal) areaPrincipal.style.display = 'block';
                    if (barraTopo) barraTopo.style.display = 'block';
                    if (rodape) rodape.style.display = 'block';
                    if (navLateralEsquerda) navLateralEsquerda.style.display = 'flex';
                    if (bottomNav) bottomNav.style.display = 'flex'; // Mostra a nova navegação inferior
                }, ehInstantaneo ? 0 : 600); // 600ms corresponde à duração da transição no CSS
            } // Fim da função alternarTelaLogin
        }; // Fim da função alternarTelaLogin

        // Se o usuário estiver logado, esconde a tela de login.
        if (estaLogado) {
            alternarTelaLogin(false, true); // Esconde instantaneamente ao carregar a página se já estiver logado (e mostra as navs apropriadas)
        }

        // Atualiza o botão de autenticação
        if (authBtn && authIcon && authText) {
            authIcon.textContent = estaLogado ? 'logout' : 'login';
            authText.textContent = estaLogado ? 'Sair' : 'Entrar';
            authBtn.onclick = (e) => { 
                e.preventDefault(); // Previne o comportamento padrão do link
                if (estaLogado) {
                    fazerLogout().then(() => {
                        // Após o logout, a tela de login deve aparecer
                        alternarTelaLogin(true); // Chama a função em português
                    });
                } else {
                    // Se não está logado, mostra a tela de login
                    alternarTelaLogin(true);
                }
            };
        }

        // --- LÓGICA PARA O BOTÃO "VOLTAR AO SITE" ---
        const backToSiteBtn = document.getElementById('back-to-site-btn');
        if (backToSiteBtn) {
            backToSiteBtn.onclick = (e) => {
                e.preventDefault();
                alternarTelaLogin(false); // Chama a função em português
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
