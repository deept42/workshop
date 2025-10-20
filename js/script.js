/**
 * @file Arquivo principal que inicializa todas as funcionalidades do site.
 * @description Importa e organiza a execução de todos os módulos de interatividade.
 */

import { configurarControlesAcessibilidade } from './acessibilidade.js';
import { atualizarLinkNavegacaoAtivo, configurarRecalculoIndicadorAoRedimensionar } from './animacoes.js';
import { configurarValidacaoFormulario, configurarAutocompletar, configurarMascaraTelefone, configurarAutocompletarComDadosSalvos } from './formulario.js';
import { configurarRolagemSuave, configurarNavegacaoMouseMeio, configurarMenuMobile, configurarBarraProgressoRolagem } from './navegacao.js';
import { configurarContagemRegressiva, configurarZoomImagem } from './ui.js';
import { configurarPlayersYoutube } from './video.js';

// Aguarda o carregamento completo do HTML antes de executar os scripts.
document.addEventListener('DOMContentLoaded', () => {

    const folderContainer = document.getElementById('folder-container');
    const panels = document.querySelectorAll('.folder-panel');
    let currentVisiblePanel = null;

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
        configurarControlesAcessibilidade();
    }
});
