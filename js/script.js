/**
 * @file Arquivo principal que inicializa todas as funcionalidades do site.
 * @description Este script importa e organiza a execução de todos os módulos de interatividade.
 */

// Importa todas as funções dos módulos separados.
import { configurarRolagemSuave, configurarNavegacaoMouseMeio, configurarMenuMobile, configurarBarraProgressoRolagem } from './funcoes/navegacao.js';
import { atualizarLinkNavegacaoAtivo, configurarRecalculoIndicadorAoRedimensionar } from './funcoes/animacoes.js';
import { configurarContagemRegressiva, configurarZoomImagem } from './funcoes/ui.js';
import { configurarValidacaoFormulario, configurarAutocompletar, configurarMascaraTelefone } from './funcoes/formulario.js';
import { configurarPlayersYoutube } from './funcoes/video.js';
import { configurarControlesAcessibilidade } from './funcoes/acessibilidade.js';

// Aguarda o carregamento completo do HTML antes de executar os scripts.
document.addEventListener('DOMContentLoaded', () => {

    // --- INITIALIZATION ---
    // Verifica se o container principal existe antes de rodar os scripts.
    const containerPrincipal = document.getElementById('folder-container');
    if (containerPrincipal) {
        // Navegação e Menus
        configurarRolagemSuave();
        configurarMenuMobile();
        configurarNavegacaoMouseMeio();
        configurarBarraProgressoRolagem();

        // Animações e Efeitos Visuais
        atualizarLinkNavegacaoAtivo();
        configurarRecalculoIndicadorAoRedimensionar();
        configurarZoomImagem();

        // Componentes de UI
        configurarContagemRegressiva();
        configurarPlayersYoutube();

        // Formulário
        configurarValidacaoFormulario();
        configurarAutocompletar();
        configurarMascaraTelefone();

        // Acessibilidade
        configurarControlesAcessibilidade();
    }
});
