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
        const headerPrincipal = document.getElementById('main-header');

        // Elementos do botão de autenticação (Desktop e Mobile)
        const authBtn = document.getElementById('auth-btn');
        const authIcon = document.getElementById('auth-icon');
        const authText = document.getElementById('auth-text');
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
                if (headerPrincipal) headerPrincipal.style.display = 'none';
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
                    if (areaLogin) areaLogin.style.display = 'none';
                    if (areaPrincipal) areaPrincipal.style.display = 'block';
                    if (barraTopo) barraTopo.style.display = 'flex'; // Usa 'flex' para alinhar corretamente
                    if (rodape) rodape.style.display = 'block';
                    if (headerPrincipal) headerPrincipal.style.display = ''; // Reseta para o padrão
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
        const configurarBotaoAuth = (btn, icon, text, logado, acaoLogout, acaoLogin) => {
            if (btn && icon && text) {
                icon.textContent = logado ? 'logout' : 'login';
                text.textContent = logado ? 'Sair' : 'Área do Admin';
                btn.onclick = (e) => { 
                    e.preventDefault();
                    if (logado) {
                        acaoLogout().then(() => alternarTelaLogin(true));
                    } else {
                        acaoLogin();
                    }
                };
            }
        };

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

    // --- LÓGICA PARA HEADER FLUTUANTE ---
    const header = document.getElementById('main-header');
    const topBar = document.getElementById('top-bar');
    const floatingNav = document.getElementById('floating-nav-bottom');

    if (header && topBar && floatingNav) {
        window.addEventListener('scroll', () => {
            // Adiciona/remove classes para mostrar/esconder os elementos com base na rolagem
            if (window.scrollY > 10) {
                header.classList.add('hidden-on-scroll'); // Esconde apenas o header principal
                floatingNav.classList.add('visible');
            } else {
                header.classList.remove('hidden-on-scroll'); // Mostra apenas o header principal
                floatingNav.classList.remove('visible');
            }
        });
    }
});
