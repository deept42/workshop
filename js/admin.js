/**
 * @file Gerencia a página do painel administrativo.
 * @description Protege a página, busca e exibe a lista de inscritos, e gerencia o logout.
 */

import { supabase } from './supabaseClient.js';
import { mostrarNotificacao } from './notificacoes.js';
import {
    fetchInscritos, addInscrito, updateInscrito, updateInscritosBatch,
    deleteInscritosPermanently, fetchInscritoById
} from './api.js';
 
// --- MÓDULO DE ESTADO E RENDERIZAÇÃO ---
const estado = {
    inscritos: [],
    mostrandoLixeira: false,
    filtroColuna: 'all',
    filtroTermo: '',
    colunaOrdenacao: 'created_at',
    direcaoOrdenacao: 'desc',
    paginaAtual: 1,
    itensPorPagina: 10,
    setInscritos(novosInscritos) {
        this.inscritos = novosInscritos;
        // Reseta para a primeira página quando os dados mudam
        this.paginaAtual = 1;
    }
};
/**
 * Função principal que inicializa o painel de administração.
 */
async function inicializarPainelAdministrativo() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        alert('Acesso negado. Por favor, faça o login como administrador.');
        window.location.replace('index.html');
        return;
    }

    // Busca o nome do usuário dos metadados ou usa o e-mail como fallback
    const adminEmailEl = document.getElementById('admin-email');
    if (adminEmailEl) adminEmailEl.textContent = session.user.email;

    /**
     * Função central para carregar dados e renderizar toda a UI.
     */
    async function carregarERenderizar() {
        try {
            const data = await fetchInscritos();
            estado.setInscritos(data);
            renderizarUICompleta();
        } catch (error) {
            mostrarNotificacao(error.message, 'erro');
        }
    }

    // Configura todos os listeners de eventos que só precisam ser configurados uma vez.
    function configurarListenersGlobais() {
        configurarFiltroDeBusca();
        configurarOrdenacaoTabela();
        configurarAcoesTabela();
        configurarAcoesEmMassa();
        configurarExportacoes();
        configurarExclusaoDuplicados();
        configurarModalAdicionarInscrito();
        configurarModalEditarInscrito();
        configurarNotificacoesDeCommit();
        configurarBotaoGraficos();
        configurarMenuFlutuante();
        configurarTutorialGuiado();
        configurarToggleLixeira();

        // Listener central para recarregar dados após ações bem-sucedidas
        document.body.addEventListener('dadosAlterados', carregarERenderizar);
    }

    // Configurar o Botão de Logout
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            // O onAuthStateChange na página principal cuidará do resto,
            // mas garantimos o redirecionamento.
            window.location.replace('index.html');
        });
    }

    // --- PONTO DE ENTRADA ---
    configurarListenersGlobais();
    await carregarERenderizar();
}

/**
 * Atualiza todas as partes da UI que dependem dos dados dos inscritos.
 */
function renderizarUICompleta() {
    const inscritosAtivos = estado.inscritos.filter(i => !i.is_deleted);
    const inscritosLixeira = estado.inscritos.filter(i => i.is_deleted);

    // Renderiza a tabela com os dados filtrados e ordenados conforme o estado atual
    const dadosFiltradosOrdenados = getDadosFiltradosEOrdenados();
    renderizarTabela(dadosFiltradosOrdenados);

    // Renderiza as métricas e gráficos com base nos inscritos ativos
    renderizarMetricas(inscritosAtivos);
    criarGraficos(inscritosAtivos);

    // Atualiza o contador da lixeira
    const trashCountBadge = document.getElementById('trash-count-badge');
    if (trashCountBadge) {
        const count = inscritosLixeira.length;
        trashCountBadge.textContent = count;
        trashCountBadge.style.display = count > 0 ? 'flex' : 'none';
    }

    // Esconde a barra de ações em massa
    const bulkActionsBar = document.getElementById('bulk-actions-bar');
    if (bulkActionsBar) bulkActionsBar.classList.add('hidden');
}

/**
 * Renderiza os controles de paginação abaixo da tabela
 */
function renderizarControlesPaginacao(totalItens, totalPaginas) {
    // Remove controles de paginação existentes
    const paginacaoExistente = document.getElementById('paginacao-controles');
    if (paginacaoExistente) {
        paginacaoExistente.remove();
    }
    
    // Se não há itens, não mostra paginação
    if (totalItens === 0) {
        return;
    }
    
    // Encontra o container da tabela
    const tabelaContainer = document.querySelector('.overflow-x-auto');
    if (!tabelaContainer || !tabelaContainer.parentElement) return;
    
    // Cria o container de paginação
    const paginacaoContainer = document.createElement('div');
    paginacaoContainer.id = 'paginacao-controles';
    paginacaoContainer.className = 'flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200';
    
    // Informações da paginação
    const inicio = (estado.paginaAtual - 1) * estado.itensPorPagina + 1;
    const fim = Math.min(estado.paginaAtual * estado.itensPorPagina, totalItens);
    const infoPagina = document.createElement('div');
    infoPagina.className = 'text-sm text-gray-600';
    infoPagina.innerHTML = `Mostrando <span class="font-semibold">${inicio}</span> a <span class="font-semibold">${fim}</span> de <span class="font-semibold">${totalItens}</span> inscrito(s)`;
    
    // Controles de navegação
    const controlesNav = document.createElement('div');
    controlesNav.className = 'flex items-center gap-2';
    
    // Botão Primeira Página
    const btnPrimeira = criarBotaoPaginacao('first_page', 'Primeira página', estado.paginaAtual === 1);
    btnPrimeira.addEventListener('click', () => {
        estado.paginaAtual = 1;
        renderizarUICompleta();
    });
    
    // Botão Página Anterior
    const btnAnterior = criarBotaoPaginacao('chevron_left', 'Página anterior', estado.paginaAtual === 1);
    btnAnterior.addEventListener('click', () => {
        if (estado.paginaAtual > 1) {
            estado.paginaAtual--;
            renderizarUICompleta();
        }
    });
    
    // Indicador de página atual
    const indicadorPagina = document.createElement('div');
    indicadorPagina.className = 'flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-300';
    indicadorPagina.innerHTML = `
        <span class="text-sm text-gray-700">Página</span>
        <input type="number" id="pagina-input" min="1" max="${totalPaginas}" value="${estado.paginaAtual}" 
               class="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-[#062E51] focus:outline-none">
        <span class="text-sm text-gray-700">de ${totalPaginas}</span>
    `;
    
    // Event listener para o input de página
    const paginaInput = indicadorPagina.querySelector('#pagina-input');
    paginaInput.addEventListener('change', (e) => {
        const novaPagina = parseInt(e.target.value);
        if (novaPagina >= 1 && novaPagina <= totalPaginas) {
            estado.paginaAtual = novaPagina;
            renderizarUICompleta();
        } else {
            e.target.value = estado.paginaAtual;
        }
    });
    
    // Botão Próxima Página
    const btnProxima = criarBotaoPaginacao('chevron_right', 'Próxima página', estado.paginaAtual === totalPaginas);
    btnProxima.addEventListener('click', () => {
        if (estado.paginaAtual < totalPaginas) {
            estado.paginaAtual++;
            renderizarUICompleta();
        }
    });
    
    // Botão Última Página
    const btnUltima = criarBotaoPaginacao('last_page', 'Última página', estado.paginaAtual === totalPaginas);
    btnUltima.addEventListener('click', () => {
        estado.paginaAtual = totalPaginas;
        renderizarUICompleta();
    });
    
    controlesNav.appendChild(btnPrimeira);
    controlesNav.appendChild(btnAnterior);
    controlesNav.appendChild(indicadorPagina);
    controlesNav.appendChild(btnProxima);
    controlesNav.appendChild(btnUltima);
    
    paginacaoContainer.appendChild(infoPagina);
    paginacaoContainer.appendChild(controlesNav);
    
    // Insere após a tabela
    tabelaContainer.parentElement.insertBefore(paginacaoContainer, tabelaContainer.nextSibling);
}

/**
 * Cria um botão de paginação
 */
function criarBotaoPaginacao(icone, titulo, desabilitado) {
    const btn = document.createElement('button');
    btn.className = `p-2 rounded-lg transition-colors ${
        desabilitado 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-[#062E51]'
    }`;
    btn.title = titulo;
    btn.disabled = desabilitado;
    btn.innerHTML = `<span class="material-symbols-outlined text-xl">${icone}</span>`;
    return btn;
}

function configurarToggleLixeira() {
    const toggleSwitch = document.getElementById('view-toggle-switch');
    const labelAtivos = document.getElementById('toggle-label-ativos');
    const labelLixeira = document.getElementById('toggle-label-lixeira');

    if (!toggleSwitch || !labelAtivos || !labelLixeira) return;

    const alternarVisualizacao = () => {
        estado.mostrandoLixeira = !estado.mostrandoLixeira;
        estado.paginaAtual = 1; // Reseta para a primeira página ao alternar visualização

        const thumb = document.getElementById('toggle-thumb');
        toggleSwitch.classList.toggle('bg-red-600', estado.mostrandoLixeira);
        toggleSwitch.classList.toggle('bg-green-600', !estado.mostrandoLixeira);
        thumb.classList.toggle('translate-x-5', estado.mostrandoLixeira);
        thumb.classList.toggle('translate-x-0', !estado.mostrandoLixeira);

        labelAtivos.classList.toggle('text-green-700', !estado.mostrandoLixeira);
        labelAtivos.classList.toggle('text-gray-400', estado.mostrandoLixeira);
        labelLixeira.classList.toggle('text-red-600', estado.mostrandoLixeira);
        labelLixeira.classList.toggle('text-gray-400', !estado.mostrandoLixeira);

        renderizarUICompleta();
    };

    [toggleSwitch, labelAtivos, labelLixeira].forEach(el => {
        el.classList.add('cursor-pointer');
        el.addEventListener('click', alternarVisualizacao);
    });
}

function renderizarMetricas(inscritosAtivos) {
    // Os cards agora são criados uma vez e apenas seus dados são atualizados
    document.dispatchEvent(new CustomEvent('atualizarCards', { detail: { inscritos: inscritosAtivos } }));
}

/**
 * Configura o botão para mostrar/ocultar a seção de gráficos.
 */
function configurarBotaoGraficos() {
    const toggleBtn = document.getElementById('toggle-charts-btn');
    const chartsSection = document.getElementById('charts-section');
    const toggleIcon = document.getElementById('toggle-charts-icon');
    const toggleText = document.getElementById('toggle-charts-text');

    if (!toggleBtn || !chartsSection || !toggleIcon || !toggleText) return;

    toggleBtn.addEventListener('click', () => {
        const isHidden = chartsSection.classList.toggle('hidden');

        if (isHidden) {
            toggleIcon.textContent = 'expand_more';
            toggleText.textContent = 'Mostrar Gráficos';
        } else {
            toggleIcon.textContent = 'expand_less';
            toggleText.textContent = 'Ocultar Gráficos';
            // Rola suavemente para a seção de gráficos quando ela é aberta
            chartsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

/**
 * Gera o HTML para uma única linha da tabela de inscritos.
 * @param {object} inscrito - O objeto do inscrito.
 * @returns {string} O HTML da tag <tr>.
 */
function gerarHtmlLinha(inscrito) {
    // Cria os marcadores coloridos para os dias de participação
    let diasHtml = '';
    if (inscrito.participa_dia_13 && inscrito.participa_dia_14) {
        diasHtml = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-500 text-white">Ambos</span>`;
    } else if (inscrito.participa_dia_13) {
        diasHtml = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-500 text-white">Dia 13</span>`;
    } else if (inscrito.participa_dia_14) {
        diasHtml = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-500 text-white">Dia 14</span>`;
    } else {
        diasHtml = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-400 text-white">Nenhum</span>`;
    }

    const botaoAcao = estado.mostrandoLixeira
        ? `<div class="flex gap-2">
               <button class="btn-restaurar text-gray-500 hover:text-green-600 transition-colors" data-id="${inscrito.id}" data-nome="${inscrito.nome_completo}" title="Restaurar inscrito">
                   <span class="material-symbols-outlined">restore_from_trash</span>
               </button>
               <button class="btn-deletar-permanente text-gray-500 hover:text-red-600 transition-colors" data-id="${inscrito.id}" data-nome="${inscrito.nome_completo}" title="Excluir permanentemente">
                   <span class="material-symbols-outlined">delete_forever</span>
               </button>
           </div>`
        : `<button class="btn-mover-lixeira text-gray-500 hover:text-red-600 transition-colors" data-id="${inscrito.id}" data-nome="${inscrito.nome_completo}" title="Mover para a lixeira">
               <span class="material-symbols-outlined">delete</span>
           </button>
           <button class="btn-editar text-gray-500 hover:text-blue-600 transition-colors" data-id="${inscrito.id}" title="Editar inscrito">
                <span class="material-symbols-outlined">edit</span>
           </button>
           <button class="btn-duplicar text-gray-500 hover:text-amber-600 transition-colors" data-id="${inscrito.id}" title="Duplicar inscrito">
                <span class="material-symbols-outlined">content_copy</span>
           </button>
           <button class="btn-certificado-individual ${inscrito.status_pagamento === 'pago' && inscrito.quer_certificado ? 'text-gray-500 hover:text-emerald-600 cursor-pointer' : 'text-gray-300 opacity-50 cursor-not-allowed pointer-events-none'} transition-colors" 
                   data-id="${inscrito.id}" 
                   data-nome="${inscrito.nome_completo}"
                   data-status="${inscrito.status_pagamento}"
                   data-quer-certificado="${inscrito.quer_certificado}"
                   title="${inscrito.status_pagamento === 'pago' && inscrito.quer_certificado ? 'Gerar Certificado' : 'Certificado não confirmado'}">
                <span class="material-symbols-outlined">workspace_premium</span>
           </button>`;

    // Lógica para formatar o nome com a tag "Cópia"
    let nomeHtml;
    const nomeCompletoFormatado = formatarParaTitulo(inscrito.nome_completo);
    const copiaRegex = /^(Cópia \d+ - )(.+)/i;
    const match = nomeCompletoFormatado.match(copiaRegex);

    if (match) {
        const tagText = match[1].replace(' -', '').trim(); // "Cópia 1"
        const nomeOriginal = match[2];
        nomeHtml = `<div class="flex items-center gap-2">
                        <span>${nomeOriginal}</span>
                        <span class="px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-md bg-amber-100 text-amber-800">${tagText}</span>
                    </div>`;
    } else {
        nomeHtml = `<span>${nomeCompletoFormatado}</span>`;
    }

    const dataInscricao = new Date(inscrito.created_at).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // Lógica para o status do certificado
    let statusClass = '';
    let statusText = '';

    if (inscrito.quer_certificado) { // Se o usuário quer o certificado
        if (inscrito.status_pagamento === 'pago') {
            statusClass = 'bg-green-100 text-green-800';
            statusText = 'Confirmado';
        } else if (inscrito.status_pagamento === 'pendente') {
            statusClass = 'bg-yellow-100 text-yellow-800';
            statusText = 'Pendente';
        } else {
            // Caso genérico para 'quer_certificado' mas sem status definido
            statusClass = 'bg-blue-100 text-blue-800';
            statusText = 'Solicitado';
        }
    } else {
        statusClass = 'bg-gray-100 text-gray-600';
        statusText = 'Não solicitado';
    }

    const certificadoHtml = `
        <div class="relative inline-block text-left">
            <button type="button" class="btn-status-certificado px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition-transform hover:scale-105 ${statusClass}" data-id="${inscrito.id}">
                ${statusText}
                <span class="material-symbols-outlined text-sm ml-1">arrow_drop_down</span>
            </button>
            <div class="menu-status-certificado origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden z-10">
                <div class="py-1" role="none">
                    <a href="#" class="item-menu-status text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-status="pago">Marcar como Confirmado</a>
                    <a href="#" class="item-menu-status text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-status="pendente">Marcar como Pendente</a>
                    <a href="#" class="item-menu-status text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-status="nao_solicitado">Marcar como Não Solicitado</a>
                </div>
            </div>
        </div>
    `;

    // Formata o CPF para exibição
    const formatarCPF = (cpf) => {
        if (!cpf) return '';
        const cpfLimpo = cpf.replace(/\D/g, '');
        return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    return `<tr data-id="${inscrito.id}">
        <td class="text-center"><input type="checkbox" class="row-checkbox h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" data-id="${inscrito.id}"></td>
        <td class="whitespace-nowrap font-medium">${nomeHtml}</td>
        <td class="whitespace-nowrap font-mono text-sm text-gray-600">${inscrito.codigo_inscricao || 'N/A'}</td>
        <td class="whitespace-nowrap">${formatarParaTitulo(inscrito.cargo_funcao) || ''}</td>
        <td class="whitespace-nowrap">${formatarCPF(inscrito.cpf)}</td>
        <td class="whitespace-nowrap">${inscrito.email}</td>
        <td class="whitespace-nowrap">${inscrito.telefone}</td>
        <td class="whitespace-nowrap">${formatarParaTitulo(inscrito.empresa)}</td>
        <td class="whitespace-nowrap">${formatarParaTitulo(inscrito.municipio)}</td>
        <td class="whitespace-nowrap">${inscrito.cep || ''}</td>
        <td class="whitespace-nowrap">${diasHtml}</td>
        <td class="whitespace-nowrap">${certificadoHtml}</td>
        <td class="whitespace-nowrap text-sm text-gray-600">${dataInscricao}</td>
        <td class="whitespace-nowrap flex items-center gap-2">${botaoAcao}</td>
    </tr>`;
}

/**
 * Renderiza os dados dos inscritos na tabela HTML.
 * @param {Array} inscritos - A lista de objetos de inscritos a serem exibidos.
 * @param {boolean} naLixeira - Flag para saber se a visualização é da lixeira.
*/
function renderizarTabela(inscritos) {
    const corpoTabela = document.getElementById('lista-inscritos');
    if (!corpoTabela) return;
    
    // Salva a posição de scroll antes de renderizar
    const tabelaContainer = document.querySelector('.overflow-x-auto');
    const scrollLeft = tabelaContainer ? tabelaContainer.scrollLeft : 0;
    const scrollTop = tabelaContainer ? tabelaContainer.scrollTop : 0;
    
    // Usa diretamente os dados filtrados e ordenados que são passados para a função.
    if (inscritos.length === 0) {
        const mensagemVazio = estado.mostrandoLixeira
            ? 'Lixeira vazia. Missão cumprida! ✅' 
            : 'Nenhum inscrito encontrado. Parece que estamos sozinhos por aqui. 🦗';
        corpoTabela.innerHTML = `<tr><td colspan="14" class="px-6 py-4 text-center text-gray-500">${mensagemVazio}</td></tr>`;
        renderizarControlesPaginacao(0, 0);
        return;
    }
    
    // Calcula a paginação
    const totalItens = inscritos.length;
    const totalPaginas = Math.ceil(totalItens / estado.itensPorPagina);
    
    // Garante que a página atual não exceda o total de páginas
    if (estado.paginaAtual > totalPaginas && totalPaginas > 0) {
        estado.paginaAtual = totalPaginas;
    }
    
    // Calcula os índices para a página atual
    const inicio = (estado.paginaAtual - 1) * estado.itensPorPagina;
    const fim = inicio + estado.itensPorPagina;
    const inscritosPagina = inscritos.slice(inicio, fim);
    
    // Renderiza apenas os itens da página atual
    corpoTabela.innerHTML = inscritosPagina.map(i => gerarHtmlLinha(i)).join('');

    // Renderiza os controles de paginação
    renderizarControlesPaginacao(totalItens, totalPaginas);

    // Após renderizar, reconfigura a seleção para garantir que os listeners estejam nos novos elementos
    configurarSelecaoEmMassa();
    
    // Restaura a posição de scroll após renderizar
    if (tabelaContainer) {
        // Usa requestAnimationFrame duplo para garantir que o DOM foi completamente atualizado
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                tabelaContainer.scrollLeft = scrollLeft;
                tabelaContainer.scrollTop = scrollTop;
            });
        });
    }
}

function obterValorCampoFiltro(inscrito, coluna) {
    switch (coluna) {
        case 'nome':
            return inscrito.nome_completo || inscrito.nome || '';
        case 'cargo':
            return inscrito.cargo_funcao || '';
        case 'empresa':
            return inscrito.empresa || '';
        case 'municipio':
            return inscrito.municipio || '';
        case 'email':
            return inscrito.email || '';
        case 'cpf':
            return inscrito.cpf || '';
        case 'cep':
            return inscrito.cep || '';
        case 'created_at':
            return inscrito.created_at
                ? new Date(inscrito.created_at).toLocaleString('pt-BR')
                : '';
        case 'certificado': {
            if (!inscrito.quer_certificado) {
                return 'não solicitado';
            }
            const status = inscrito.status_pagamento || '';
            if (status === 'pago') return 'confirmado';
            if (status === 'pendente') return 'pendente';
            return status || 'não informado';
        }
        case 'dias': {
            const dia13 = inscrito.participa_dia_13;
            const dia14 = inscrito.participa_dia_14;
            if (dia13 && dia14) return '13, 14, ambos, 13 e 14';
            if (dia13) return '13, dia 13';
            if (dia14) return '14, dia 14';
            return 'nenhum, nenhum dia';
        }
        default:
            return inscrito[coluna] ?? '';
    }
}

function getDadosFiltradosEOrdenados() {
    const {
        inscritos, mostrandoLixeira, filtroColuna, filtroTermo,
        colunaOrdenacao, direcaoOrdenacao
    } = estado;

    const dadosVisiveis = mostrandoLixeira
        ? inscritos.filter(i => i.is_deleted)
        : inscritos.filter(i => !i.is_deleted);

    // Filtragem
    const dadosFiltrados = dadosVisiveis.filter(inscrito => {
        if (!filtroTermo) return true;
        const termo = filtroTermo.toLowerCase();

        if (filtroColuna === 'all') {
            const valoresExtras = [
                obterValorCampoFiltro(inscrito, 'nome'),
                obterValorCampoFiltro(inscrito, 'cargo'),
                obterValorCampoFiltro(inscrito, 'empresa'),
                obterValorCampoFiltro(inscrito, 'municipio'),
                obterValorCampoFiltro(inscrito, 'dias'),
                obterValorCampoFiltro(inscrito, 'certificado'),
                obterValorCampoFiltro(inscrito, 'created_at')
            ];

            const valoresParaProcurar = [
                ...Object.values(inscrito),
                ...valoresExtras
            ];

            return valoresParaProcurar.some(val =>
                String(val ?? '').toLowerCase().includes(termo)
            );
        } else {
            const valorCampo = obterValorCampoFiltro(inscrito, filtroColuna);
            return String(valorCampo).toLowerCase().includes(termo);
        }
    });

    // Ordenação
    return dadosFiltrados.sort((a, b) => {
        let valorA = a[colunaOrdenacao];
        let valorB = b[colunaOrdenacao];

        // Tratamento para valores nulos ou indefinidos
        if (valorA == null) return 1;
        if (valorB == null) return -1;

        let comparacao = 0;
        if (typeof valorA === 'string') {
            comparacao = valorA.localeCompare(valorB, 'pt-BR', { sensitivity: 'base' });
        } else if (typeof valorA === 'number' || typeof valorA === 'boolean' || valorA instanceof Date) {
            if (valorA < valorB) comparacao = -1;
            if (valorA > valorB) comparacao = 1;
        }

        return direcaoOrdenacao === 'asc' ? comparacao : -comparacao;
    });
}


/**
 * Configura o campo de busca para filtrar a tabela de inscritos.
 */
function configurarFiltroDeBusca() {
    const seletorColuna = document.getElementById('filtro-coluna');
    const filtroInput = document.getElementById('filtro-busca');

    if (!seletorColuna || !filtroInput) return;

    const executarFiltro = () => {
        estado.filtroColuna = seletorColuna.value;
        estado.filtroTermo = filtroInput.value;
        estado.paginaAtual = 1; // Reseta para a primeira página ao filtrar
        renderizarUICompleta();
    };

    filtroInput.addEventListener('input', executarFiltro);
    seletorColuna.addEventListener('change', executarFiltro);
}

/**
 * Adiciona a funcionalidade de ordenação à tabela ao clicar nos cabeçalhos.
 */
function configurarOrdenacaoTabela() {
    const headers = document.querySelectorAll('.admin-table th[data-column]');
    let colunaOrdenadaAtual = 'nome_completo';
    let direcaoOrdenacaoAtual = 'asc';

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const colunaSelecionada = header.dataset.column;

            if (colunaSelecionada === estado.colunaOrdenacao) {
                estado.direcaoOrdenacao = estado.direcaoOrdenacao === 'asc' ? 'desc' : 'asc';
            } else {
                estado.colunaOrdenacao = colunaSelecionada;
                estado.direcaoOrdenacao = 'asc';
            }
            
            estado.paginaAtual = 1; // Reseta para a primeira página ao ordenar

            renderizarUICompleta();

            // Atualiza os ícones de seta nos cabeçalhos
            atualizarIconesOrdenacao(headers, estado.colunaOrdenacao, estado.direcaoOrdenacao);
        });
    });
}

/**
 * Configura os botões e a lógica da barra de ações em massa.
 * @param {Function} callbackSucesso - Função a ser chamada após uma ação bem-sucedida.
 */
function configurarAcoesEmMassa() {
    const bulkMoveBtn = document.getElementById('bulk-move-to-trash-btn');
    const bulkRestoreBtn = document.getElementById('bulk-restore-btn');
    const bulkDeletePermanentBtn = document.getElementById('bulk-delete-permanent-btn');
    const bulkEditBtn = document.getElementById('bulk-edit-btn');
    const bulkDuplicateBtn = document.getElementById('bulk-duplicate-btn');

    if (bulkMoveBtn) {
        bulkMoveBtn.addEventListener('click', async () => {
            const idsParaMover = obterIdsSelecionados();
            if (idsParaMover.length === 0) return;

            const confirmado = await mostrarModalConfirmacao(
                `Mover ${idsParaMover.length} Itens`,
                `Você tem certeza que deseja mover os ${idsParaMover.length} itens selecionados para a lixeira?`,
                `Sim, mover`
            );

            if (confirmado) {
                try {
                    await updateInscritosBatch(idsParaMover, { is_deleted: true });
                    mostrarNotificacao(`${idsParaMover.length} iten(s) movido(s) para a lixeira.`, 'sucesso');
                    document.body.dispatchEvent(new CustomEvent('dadosAlterados'));
                } catch (error) {
                    mostrarNotificacao(error.message, 'erro');
                }
            }
        });
    }

    // Ação: Restaurar em massa da lixeira
    if (bulkRestoreBtn) {
        bulkRestoreBtn.addEventListener('click', async () => {
            const idsParaRestaurar = obterIdsSelecionados();
            if (idsParaRestaurar.length === 0) return;

            // Não precisa de confirmação para restaurar
            try {
                await updateInscritosBatch(idsParaRestaurar, { is_deleted: false });
                mostrarNotificacao(`${idsParaRestaurar.length} iten(s) restaurado(s) com sucesso.`, 'sucesso');
                document.body.dispatchEvent(new CustomEvent('dadosAlterados'));
            } catch (error) {
                mostrarNotificacao(error.message, 'erro');
            }
        });
    }

    // Ação: Excluir permanentemente em massa
    if (bulkDeletePermanentBtn) {
        bulkDeletePermanentBtn.addEventListener('click', async () => {
            const idsParaDeletar = obterIdsSelecionados();
            if (idsParaDeletar.length === 0) return;

            const confirmado = await mostrarModalConfirmacao(
                `Excluir ${idsParaDeletar.length} Itens Permanentemente`,
                `ATENÇÃO: Você tem certeza que deseja excluir permanentemente os ${idsParaDeletar.length} itens selecionados? Esta ação não pode ser desfeita.`,
                `Sim, excluir permanentemente`
            );

            if (confirmado) {
                try {
                    await deleteInscritosPermanently(idsParaDeletar);
                    mostrarNotificacao(`${idsParaDeletar.length} iten(s) excluído(s) permanentemente.`, 'sucesso');
                    document.body.dispatchEvent(new CustomEvent('dadosAlterados'));
                } catch (error) {
                    mostrarNotificacao(error.message, 'erro');
                }
            }
        });
    }

    // Ação: Editar o item selecionado (só funciona se 1 item for selecionado)
    if (bulkEditBtn) {
        bulkEditBtn.addEventListener('click', async () => {
            const idsSelecionados = obterIdsSelecionados();
            if (idsSelecionados.length !== 1) return;

            const { data, error } = await fetchInscritoById(idsSelecionados[0]);
            if (error) {
                mostrarNotificacao('Erro ao buscar dados do inscrito para edição.', 'erro');
            } else {
                abrirModalEdicao(data);
            }
        });
    }

    // Ação: Duplicar o(s) item(ns) selecionado(s)
    if (bulkDuplicateBtn) {
        bulkDuplicateBtn.addEventListener('click', async () => {
            const idsSelecionados = obterIdsSelecionados();
            if (idsSelecionados.length === 0) return;

            for (const id of idsSelecionados) {
                await iniciarDuplicacao(id);
            }
        });
    }
}

/**
 * Retorna os IDs dos checkboxes selecionados na tabela.
 * @returns {string[]}
 */
function obterIdsSelecionados() {
    const selecionados = document.querySelectorAll('.row-checkbox:checked');
    return Array.from(selecionados).map(cb => cb.dataset.id);
}

/**
 * Retorna as linhas da tabela que devem ser usadas para exportação.
 * @returns {Element[]} Uma lista de elementos <tr>.
 */
function obterLinhasParaExportacao() {
    const selecionados = document.querySelectorAll('.row-checkbox:checked');
    
    if (selecionados.length > 0) {
        // Se há seleção, retorna as linhas pai dos checkboxes selecionados
        return Array.from(selecionados).map(checkbox => checkbox.closest('tr'));
    } else {
        // Se não há seleção, retorna todas as linhas visíveis
        return Array.from(document.querySelectorAll('#lista-inscritos tr')).filter(
            linha => linha.style.display !== 'none'
        );
    }
}

/**
 * Configura a lógica para seleção em massa de itens na tabela.
 */
function configurarSelecaoEmMassa() {
    const bulkActionsBar = document.getElementById('bulk-actions-bar');
    const bulkActionsCount = document.getElementById('bulk-actions-count');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    
    const btnsAtivos = document.querySelectorAll('.bulk-action-ativos');
    const btnsLixeira = document.querySelectorAll('.bulk-action-lixeira');
    const bulkEditBtn = document.getElementById('bulk-edit-btn');
    const bulkDuplicateBtn = document.getElementById('bulk-duplicate-btn');

    if (!selectAllCheckbox || !bulkActionsBar || !bulkActionsCount) return;

    // Função para atualizar a barra de ações em massa
    const atualizarBarraDeAcoes = () => {
        const rowCheckboxes = document.querySelectorAll('.row-checkbox'); // Busca os checkboxes atuais
        const selecionados = document.querySelectorAll('.row-checkbox:checked');
        const totalSelecionado = selecionados.length;
        const totalVisivel = Array.from(document.querySelectorAll('#lista-inscritos tr')).filter(linha => linha.style.display !== 'none').length;

        if (totalSelecionado > 0) {
            bulkActionsBar.classList.remove('hidden');
            bulkActionsCount.textContent = `${totalSelecionado} item(s) selecionado(s)`;
        } else {
            bulkActionsBar.classList.add('hidden');
        }

        // Alterna a visibilidade dos botões de ação com base na visualização
        btnsAtivos.forEach(btn => btn.classList.toggle('hidden', estado.mostrandoLixeira));
        btnsLixeira.forEach(btn => btn.classList.toggle('hidden', !estado.mostrandoLixeira));

        // Lógica de visibilidade para os novos botões
        if (bulkEditBtn) bulkEditBtn.classList.toggle('hidden', estado.mostrandoLixeira || totalSelecionado !== 1);
        if (bulkDuplicateBtn) bulkDuplicateBtn.classList.toggle('hidden', estado.mostrandoLixeira || totalSelecionado === 0);

        // Se não houver linhas visíveis (ex: filtro não encontrou nada), desmarca o "selecionar tudo"
        if (totalVisivel === 0) {
            selectAllCheckbox.checked = false;
        }

        // Atualiza o estado do checkbox "selecionar tudo"
        selectAllCheckbox.checked = totalVisivel > 0 && totalSelecionado === totalVisivel;
        selectAllCheckbox.indeterminate = totalSelecionado > 0 && totalSelecionado < totalVisivel;
    };

    // Clona o checkbox "selecionar tudo" para remover listeners antigos e evitar duplicação
    const newSelectAllCheckbox = selectAllCheckbox.cloneNode(true);
    selectAllCheckbox.parentNode.replaceChild(newSelectAllCheckbox, selectAllCheckbox);

    // Adiciona o evento ao novo checkbox
    newSelectAllCheckbox.addEventListener('change', () => {
        // Se o checkbox estiver no estado indeterminado, o primeiro clique deve selecionar todos.
        // Caso contrário, ele alterna normalmente.
        const deveSelecionarTodos = newSelectAllCheckbox.indeterminate || newSelectAllCheckbox.checked;

        const currentRowCheckboxes = document.querySelectorAll('.row-checkbox');
        currentRowCheckboxes.forEach(checkbox => {
             // Seleciona apenas as linhas visíveis
             if (checkbox.closest('tr').style.display !== 'none') {
                checkbox.checked = deveSelecionarTodos;
            }
        });
        // Garante que o estado visual do checkbox principal seja atualizado corretamente após a ação.
        newSelectAllCheckbox.checked = deveSelecionarTodos;
        newSelectAllCheckbox.indeterminate = false;
        atualizarBarraDeAcoes(); // Atualiza a barra após a ação
    });

    // Evento para os checkboxes de cada linha
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    rowCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', atualizarBarraDeAcoes);
    });

    // Inicializa a barra de ações
    atualizarBarraDeAcoes();
}

/**
 * Configura os ouvintes de eventos para as ações da tabela (ex: deletar).
 */
function configurarAcoesTabela() {
    const corpoTabela = document.getElementById('lista-inscritos');
    if (!corpoTabela) return;

    corpoTabela.addEventListener('click', async (e) => {
        // Verifica se o clique foi no botão ou no ícone dentro dele
        let targetButton = e.target.closest('.btn-mover-lixeira, .btn-restaurar, .btn-deletar-permanente, .btn-editar, .btn-duplicar, .btn-certificado-individual');
        
        // Se não encontrou e clicou em um ícone, tenta encontrar o botão pai
        if (!targetButton) {
            // Verifica se clicou no ícone (span) dentro do botão de certificado
            if (e.target.tagName === 'SPAN' && e.target.closest('.btn-certificado-individual')) {
                targetButton = e.target.closest('.btn-certificado-individual');
            }
            // Ou se o parent é o botão
            else if (e.target.parentElement?.classList.contains('btn-certificado-individual')) {
                targetButton = e.target.parentElement;
            }
            // Ou se está dentro de um botão de certificado em qualquer nível
            else if (e.target.closest('.btn-certificado-individual')) {
                targetButton = e.target.closest('.btn-certificado-individual');
            }
        }
        
        if (!targetButton) return;

        // Tenta pegar o ID do botão ou da linha da tabela
        let inscritoId = targetButton.dataset.id;
        let inscritoNome = targetButton.dataset.nome;
        
        // Se não encontrou o ID no botão, tenta pegar da linha da tabela
        if (!inscritoId) {
            const linha = targetButton.closest('tr');
            if (linha) {
                inscritoId = linha.dataset.id;
            }
        }
        
        // Verifica se o ID foi capturado corretamente
        if (!inscritoId) {
            console.error('ID do inscrito não encontrado!', {
                targetButton,
                dataset: targetButton.dataset,
                classes: targetButton.className,
                elementoClicado: e.target,
                linha: targetButton.closest('tr')
            });
            mostrarNotificacao('Erro: ID do inscrito não encontrado.', 'erro');
            return;
        }
        
        if (targetButton.classList.contains('btn-mover-lixeira')) {
            // Abre o modal de confirmação para mover para a lixeira
            const confirmado = await mostrarModalConfirmacao(
                `Mover para a Lixeira`,
                `Você tem certeza que deseja mover "${inscritoNome}" para a lixeira?`,
                `Sim, mover`
            );

            if (confirmado) {
                await handleUpdateStatus(inscritoId, true);
            }
        } else if (targetButton.classList.contains('btn-restaurar')) {
            // Restaurando da lixeira (não precisa de confirmação)
            await handleUpdateStatus(inscritoId, false);
        } else if (targetButton.classList.contains('btn-deletar-permanente')) {
            // Abre o modal de confirmação para exclusão permanente
            const confirmado = await mostrarModalConfirmacao(
                `Excluir Permanentemente`,
                `ATENÇÃO: Você está prestes a excluir permanentemente "${inscritoNome}". Esta ação não pode ser desfeita.`,
                `Sim, excluir permanentemente`
            );

            if (confirmado) {
                const sucesso = await deletarInscritoPermanentemente(inscritoId);
            }
        } else if (targetButton.classList.contains('btn-editar')) {
            const { data, error } = await fetchInscritoById(inscritoId);
            if (error) {
                mostrarNotificacao('Erro ao buscar dados do inscrito para edição.', 'erro');
            } else {
                abrirModalEdicao(data);
            }
        } else if (targetButton.classList.contains('btn-duplicar')) {
            await iniciarDuplicacao(inscritoId);
        } else if (targetButton.classList.contains('btn-certificado-individual')) {
            console.log('Botão de certificado clicado!', {
                inscritoId,
                status: targetButton.dataset.status,
                querCertificado: targetButton.dataset.querCertificado,
                classes: targetButton.className
            });
            
            // Verifica se o botão está visualmente desabilitado (tem pointer-events-none)
            if (targetButton.classList.contains('pointer-events-none')) {
                console.log('Botão desabilitado visualmente, não pode gerar certificado');
                mostrarNotificacao('Apenas inscritos com certificado confirmado podem gerar o PDF.', 'erro');
                return;
            }
            
            const status = targetButton.dataset.status;
            const querCertificado = targetButton.dataset.querCertificado === 'true';
            
            console.log('Status do certificado:', { status, querCertificado });
            
            if (status === 'pago' && querCertificado) {
                console.log('Buscando inscrito no estado...', {
                    inscritoId,
                    tipoInscritoId: typeof inscritoId,
                    totalInscritos: estado.inscritos.length,
                    primeirosIds: estado.inscritos.slice(0, 3).map(i => ({ id: i.id, tipo: typeof i.id }))
                });
                
                // Tenta encontrar o inscrito comparando como string e como número
                const inscrito = estado.inscritos.find(i => {
                    const matchString = String(i.id) === String(inscritoId);
                    const matchNumber = Number(i.id) === Number(inscritoId);
                    return matchString || matchNumber;
                });
                
                console.log('Resultado da busca:', {
                    encontrado: !!inscrito,
                    inscrito: inscrito ? { id: inscrito.id, nome: inscrito.nome_completo } : null
                });
                
                if (inscrito) {
                    try {
                        console.log('Iniciando geração do certificado...');
                        await gerarCertificadoIndividual(inscrito);
                        console.log('Certificado gerado com sucesso!');
                    } catch (error) {
                        console.error('Erro ao gerar certificado:', error);
                        mostrarNotificacao(`Erro ao gerar certificado: ${error.message}`, 'erro');
                    }
                } else {
                    console.error('Inscrito não encontrado no estado', {
                        buscado: inscritoId,
                        idsDisponiveis: estado.inscritos.map(i => i.id).slice(0, 10)
                    });
                    mostrarNotificacao('Inscrito não encontrado. Tente recarregar a página.', 'erro');
                }
            } else {
                console.log('Status não permite gerar certificado:', { status, querCertificado });
                mostrarNotificacao('Apenas inscritos com certificado confirmado podem gerar o PDF.', 'erro');
            }
        }
    });

    // Lógica para o menu de status do certificado
    corpoTabela.addEventListener('click', async (e) => {
        const target = e.target;

        // Se clicar no botão principal, abre/fecha o menu
        if (target.closest('.btn-status-certificado')) {
            e.preventDefault();
            const menu = target.closest('.relative').querySelector('.menu-status-certificado');
            // Fecha todos os outros menus abertos
            document.querySelectorAll('.menu-status-certificado').forEach(m => {
                if (m !== menu) m.classList.add('hidden');
            });
            menu.classList.toggle('hidden');
        }

        // Se clicar em um item do menu, atualiza o status
        if (target.classList.contains('item-menu-status')) {
            e.preventDefault();
            const menu = target.closest('.menu-status-certificado');
            const id = menu.closest('.relative').querySelector('.btn-status-certificado').dataset.id;
            const novoStatus = target.dataset.status;

            const sucesso = await atualizarStatusCertificado(id, novoStatus);
            if (sucesso) {
                document.body.dispatchEvent(new CustomEvent('dadosAlterados'));
                renderizarUICompleta(); // Re-renderiza para atualizar o botão de certificado
            }
            menu.classList.add('hidden'); // Fecha o menu após a ação
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-status-certificado')) {
            document.querySelectorAll('.menu-status-certificado').forEach(m => m.classList.add('hidden'));
        }
    });
}

async function handleUpdateStatus(id, isDeleted) {
    try {
        await updateInscrito(id, { is_deleted: isDeleted });
        const mensagem = isDeleted
            ? 'Inscrito movido para a lixeira com sucesso.'
            : 'Inscrito restaurado com sucesso.';
        mostrarNotificacao(mensagem, 'sucesso');
        document.body.dispatchEvent(new CustomEvent('dadosAlterados'));
    } catch (error) {
        mostrarNotificacao(error.message, 'erro');
    }
}
/**
 * Atualiza o status do certificado de um inscrito no banco de dados.
 * @param {string} id - O ID do inscrito.
 * @param {'pago' | 'pendente' | 'nao_solicitado'} novoStatus - O novo status.
 * @returns {Promise<boolean>} Retorna true se a operação for bem-sucedida.
 */
async function atualizarStatusCertificado(id, novoStatus) {
    let dadosParaAtualizar = {};

    if (novoStatus === 'pago') {
        dadosParaAtualizar = { quer_certificado: true, status_pagamento: 'pago' };
    } else if (novoStatus === 'pendente') {
        dadosParaAtualizar = { quer_certificado: true, status_pagamento: 'pendente' };
    } else { // nao_solicitado
        dadosParaAtualizar = { quer_certificado: false, status_pagamento: 'nao_solicitado' };
    }

    try {
        await updateInscrito(id, dadosParaAtualizar);
    } catch (error) {
        mostrarNotificacao(error.message, 'erro');
        console.error('Erro ao atualizar status do certificado:', error.message);
        return false;
    }
    mostrarNotificacao('Status do certificado atualizado com sucesso!', 'sucesso');
    return true;
}

async function deletarInscritoPermanentemente(id) {
    try {
        await deleteInscritosPermanently([id]);
        mostrarNotificacao('Inscrito excluído permanentemente.', 'sucesso');
        document.body.dispatchEvent(new CustomEvent('dadosAlterados'));
    } catch (error) {
        mostrarNotificacao(error.message, 'erro');
    }
}

/**
 * Duplica um inscrito, criando um novo registro com dados semelhantes.
 * @param {string} id - O ID do inscrito a ser duplicado.
 */
async function iniciarDuplicacao(id) {
    // 1. Busca os dados do inscrito original
    const { data: original, error: fetchError } = await fetchInscritoById(id);

    if (fetchError) {
        mostrarNotificacao('Erro ao buscar dados para duplicação.', 'erro');
        console.error('Erro na busca para duplicar:', fetchError);
        return;
    }

    // 2. Prepara o novo objeto, modificando nome e e-mail para evitar conflitos
    const novoInscrito = { ...original };
    delete novoInscrito.id; // Remove o ID antigo
    delete novoInscrito.created_at; // Deixa o Supabase gerar um novo timestamp

    // Ao duplicar, o campo de nome virá em branco para ser preenchido.
    // Todos os outros dados são mantidos.
    novoInscrito.nome_completo = '';
    novoInscrito.email = ''; // Limpa o e-mail para evitar conflitos de unicidade, já que e-mails devem ser únicos
    novoInscrito.cpf = ''; // Limpa o CPF para evitar conflitos de unicidade
    // Mantém o e-mail original para o usuário editar.

    // 3. Abre o modal de "Adicionar" com os dados pré-preenchidos
    abrirModalAdicionarComDados(novoInscrito);
}

/**
 * Exibe um modal para confirmar a exclusão de um inscrito.
 * @param {string} nomeInscrito - O nome do inscrito a ser exibido no modal.
 */
function mostrarModalConfirmacao(titulo, mensagem, textoBotaoConfirmar) {
    return new Promise(resolve => {
        const modal = document.getElementById('delete-confirm-modal');
        const titleEl = modal.querySelector('h3');
        const messageEl = document.getElementById('delete-confirm-message');
        const confirmBtn = document.getElementById('delete-btn-confirm');
        const cancelBtn = document.getElementById('delete-btn-cancel');

        titleEl.textContent = titulo;
        messageEl.textContent = mensagem;
        confirmBtn.textContent = textoBotaoConfirmar;
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        confirmBtn.onclick = () => { modal.classList.add('hidden'); resolve(true); };
        cancelBtn.onclick = () => { modal.classList.add('hidden'); resolve(false); };
    });
}

/**
 * Exibe um modal de sucesso genérico com título e mensagem personalizáveis.
 * @param {string} titulo - O título do modal.
 * @param {string} mensagem - A mensagem do modal.
 */
async function mostrarModalSucesso(titulo, mensagem) {
    const modal = document.getElementById('success-modal');
    const tituloEl = document.getElementById('success-modal-title');
    const mensagemEl = document.getElementById('success-modal-message');
    const botaoFechar = document.getElementById('success-btn-close');

    if (!modal || !tituloEl || !mensagemEl || !botaoFechar) return;

    tituloEl.textContent = titulo;
    mensagemEl.textContent = mensagem;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const fecharModal = () => {
        modal.classList.add('hidden');
    };

    // Garante que o listener de clique seja sempre novo
    const novoBotaoFechar = botaoFechar.cloneNode(true);
    botaoFechar.parentNode.replaceChild(novoBotaoFechar, botaoFechar);
    novoBotaoFechar.onclick = fecharModal;
}

/**
 * Exibe um modal de erro com uma mensagem personalizada.
 * @param {string} mensagem - A mensagem de erro a ser exibida.
 */
async function mostrarModalErro(mensagem) {
    const modal = document.getElementById('error-modal');
    const mensagemEl = document.getElementById('error-modal-message');
    const botaoFechar = document.getElementById('error-btn-close');

    if (!modal || !mensagemEl || !botaoFechar) return;

    mensagemEl.textContent = mensagem;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const fecharModal = () => {
        modal.classList.add('hidden');
    };

    // Garante que o listener de clique seja sempre novo
    const novoBotaoFechar = botaoFechar.cloneNode(true);
    botaoFechar.parentNode.replaceChild(novoBotaoFechar, botaoFechar);
    novoBotaoFechar.onclick = fecharModal;
}


/**
 * Atualiza os ícones nos cabeçalhos da tabela para indicar a coluna e direção da ordenação.
 * @param {NodeListOf<Element>} headers - Todos os elementos de cabeçalho da tabela.
 * @param {string} colunaAtiva - A coluna que está atualmente ordenada.
 * @param {string} direcao - A direção da ordenação ('asc' ou 'desc').
 */
function atualizarIconesOrdenacao(headers, colunaAtiva, direcao) {
    headers.forEach(header => {
        const icon = header.querySelector('.material-symbols-outlined');
        if (icon) {
            if (header.dataset.column === colunaAtiva) {
                icon.textContent = direcao === 'asc' ? 'arrow_upward' : 'arrow_downward';
                icon.style.opacity = '1';
            } else {
                icon.textContent = 'unfold_more';
                icon.style.opacity = '0.5';
            }
        }
    });
}

/**
 * Cria e gerencia um card interativo com múltiplas visualizações.
 * @param {string} wrapperId - O ID do elemento que envolve os cards.
 * @param {Array<object>} views - Um array de objetos, cada um definindo uma visualização do card.
 *        Ex: [{ cardId: '...', valueId: '...', calculate: (inscritos) => ... }]
 */
function criarCardInterativo(wrapperId, views) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    const cards = views.map(v => document.getElementById(v.cardId));
    const valueElements = views.map(v => document.getElementById(v.valueId));
    const indicators = wrapper.querySelectorAll('.indicator-dot');
    const progressBar = wrapper.querySelector('.card-progress-bar');

    if (cards.some(c => !c) || valueElements.some(v => !v) || !progressBar) {
        console.warn(`Card interativo "${wrapperId}" não pôde ser inicializado: elementos ausentes.`);
        return;
    }

    let estadoAtual = 0;
    let isAnimating = false;
    let autoRotateTimeout;
    const autoRotateDelay = 10000; // 10 segundos

    // Função para atualizar os valores de todos os cards de uma vez
    function atualizarValores(inscritos) {
        views.forEach((view, index) => {
            const valor = view.calculate(inscritos);
            valueElements[index].textContent = valor;
        });
    }

    // Funções de controle da UI
    const atualizarIndicadores = () => {
        indicators.forEach((dot, index) => dot.classList.toggle('active', index === estadoAtual));
    };

    const resetProgressBar = () => {
        progressBar.style.transition = 'width 0s';
        progressBar.style.width = '0%';
        void progressBar.offsetWidth;
    };

    const startProgressBar = () => {
        progressBar.style.transition = `width ${autoRotateDelay / 1000}s linear`;
        progressBar.style.width = '100%';
    };

    const avancarCard = () => {
        if (isAnimating) return;
        isAnimating = true;
        clearTimeout(autoRotateTimeout);
        resetProgressBar();

        const cardAnterior = cards[estadoAtual];
        const proximoCardVisivel = cards[(estadoAtual + 2) % cards.length];
        estadoAtual = (estadoAtual + 1) % cards.length;

        cardAnterior.classList.replace('is-front', 'is-hidden');
        cards[estadoAtual].classList.replace('is-back', 'is-front');
        proximoCardVisivel.classList.replace('is-hidden', 'is-back');

        setTimeout(() => {
            atualizarIndicadores();
            startProgressBar();
            autoRotateTimeout = setTimeout(avancarCard, autoRotateDelay);
            isAnimating = false;
        }, 500);
    };

    wrapper.addEventListener('click', avancarCard);
    atualizarIndicadores();
    startProgressBar();
    autoRotateTimeout = setTimeout(avancarCard, autoRotateDelay);

    // Ouve o evento para atualizar os dados quando a UI principal for renderizada
    document.addEventListener('atualizarCards', (e) => {
        atualizarValores(e.detail.inscritos);
    });
}

/**
 * Configura o card interativo de Municípios.
 * @param {Array} inscritos - A lista de objetos de inscritos.
 */
function configurarCardMunicipiosInterativo(inscritos) {
    const wrapper = document.getElementById('card-municipios-wrapper');
    const cards = [
        document.getElementById('card-municipios-total'),
        document.getElementById('card-municipios-mais-inscritos'),
        document.getElementById('card-municipios-menos-inscritos')
    ];
    const valores = [
        document.getElementById('card-municipios-total-valor'),
        document.getElementById('card-municipios-mais-inscritos-valor'),
        document.getElementById('card-municipios-menos-inscritos-valor')
    ];
    const indicators = wrapper ? wrapper.querySelectorAll('.indicator-dot') : [];

    if (!wrapper || cards.some(c => !c) || valores.some(v => !v) || indicators.length === 0) return;
    
    let isAnimating = false;
    let estadoAtual = 0; // 0: Total, 1: Mais inscritos, 2: Menos inscritos
    let autoRotateTimeout;
    const progressBar = wrapper.querySelector('.card-progress-bar');
    const autoRotateDelay = 10000;

    const preencherDados = () => {
        const municipiosUnicos = new Set(inscritos.map(i => i.municipio).filter(Boolean));
        valores[0].textContent = municipiosUnicos.size; // Total de Municípios Diferentes

        const contagemMunicipios = inscritos.reduce((acc, { municipio }) => {
            if (municipio) acc[municipio] = (acc[municipio] || 0) + 1;
            return acc;
        }, {});

        const sortedMunicipios = Object.entries(contagemMunicipios).sort(([,a],[,b]) => b-a);

        // Município com mais inscritos
        const maisInscritos = sortedMunicipios.length > 0 ? sortedMunicipios[0][0] : 'N/A';
        valores[1].textContent = maisInscritos;

        // Município com menos inscritos
        const menosInscritos = sortedMunicipios.length > 0 ? sortedMunicipios[sortedMunicipios.length - 1][0] : 'N/A';
        valores[2].textContent = menosInscritos;
    };

    const atualizarIndicadores = () => {
        indicators.forEach((dot, index) => {
            dot.classList.toggle('active', index === estadoAtual);
        });
    };

    const resetProgressBar = () => {
        progressBar.style.transition = 'width 0s';
        progressBar.style.width = '0%';
        void progressBar.offsetWidth;
    };

    const startProgressBar = () => {
        progressBar.style.transition = `width ${autoRotateDelay / 1000}s linear`;
        progressBar.style.width = '100%';
    };

    const avancarCard = () => {
        if (isAnimating) return;
        isAnimating = true;
        clearTimeout(autoRotateTimeout);
        resetProgressBar();

        const cardAnterior = cards[estadoAtual];
        const numCards = cards.length;
        const proximoCardVisivel = cards[(estadoAtual + 2) % cards.length];
        estadoAtual = (estadoAtual + 1) % cards.length;

        cardAnterior.classList.replace('is-front', 'is-hidden');
        cards[estadoAtual].classList.replace('is-back', 'is-front');
        proximoCardVisivel.classList.replace('is-hidden', 'is-back');

        setTimeout(() => {
            atualizarIndicadores();
            startProgressBar();
            autoRotateTimeout = setTimeout(avancarCard, autoRotateDelay);
            isAnimating = false;
        }, 500);
    };

    wrapper.addEventListener('click', avancarCard);
    preencherDados();
    atualizarIndicadores();
    startProgressBar();
    autoRotateTimeout = setTimeout(avancarCard, autoRotateDelay);
}

function configurarCardCertificadoInterativo(inscritos) {
    const wrapper = document.getElementById('card-adesao-wrapper');
    const cards = [
        document.getElementById('card-adesao-percent'),
        document.getElementById('card-adesao-count'),
        document.getElementById('card-adesao-receita'),
        document.getElementById('card-adesao-receita-paga')
    ];
    const valores = [
        document.getElementById('card-certificado-percent-valor'),
        document.getElementById('card-certificado-count-valor'),
        document.getElementById('card-certificado-receita-valor'),
        document.getElementById('card-certificado-receita-paga-valor')
    ];
    const indicators = wrapper ? wrapper.querySelectorAll('.indicator-dot') : [];

    if (!wrapper || cards.some(c => !c) || valores.some(v => !v) || indicators.length === 0) return;

    let isAnimating = false;
    let estadoAtual = 0; // 0: Percentual, 1: Contagem, 2: Receita Pendente, 3: Receita Confirmada
    let autoRotateTimeout; // Variável para controlar o setTimeout
    const progressBar = wrapper.querySelector('.card-progress-bar');
    const autoRotateDelay = 10000; // 10 segundos

    // Função para preencher os dados nos dois cards
    const preencherDados = () => {
        const totalInscritos = inscritos.length;
        const comCertificado = inscritos.filter(i => i.quer_certificado).length;
        const pendentes = inscritos.filter(i => i.quer_certificado && i.status_pagamento === 'pendente').length;
        const pagos = inscritos.filter(i => i.status_pagamento === 'pago').length;
        const receitaPendente = pendentes * 20.00;
        const receitaPaga = pagos * 20.00;
        const taxa = totalInscritos > 0 ? (comCertificado / totalInscritos) * 100 : 0;

        valores[0].textContent = `${taxa.toFixed(0)}%`;
        valores[1].textContent = comCertificado;
        valores[2].textContent = `R$ ${receitaPendente.toFixed(2).replace('.', ',')}`;
        valores[3].textContent = `R$ ${receitaPaga.toFixed(2).replace('.', ',')}`;
    };

    const atualizarIndicadores = () => {
        indicators.forEach((dot, index) => dot.classList.toggle('active', index === estadoAtual));
    };

    const resetProgressBar = () => {
        progressBar.style.transition = 'width 0s'; // Remove a transição para resetar instantaneamente
        progressBar.style.width = '0%';
        // Força o navegador a aplicar a mudança antes de reativar a transição
        void progressBar.offsetWidth; 
    };

    const startProgressBar = () => {
        progressBar.style.transition = `width ${autoRotateDelay / 1000}s linear`;
        progressBar.style.width = '100%';
    };

    const avancarCard = () => {
        if (isAnimating) return; // Impede cliques múltiplos durante a animação
        isAnimating = true;
        clearTimeout(autoRotateTimeout); // Cancela a rotação automática anterior
        resetProgressBar();
        
        const cardAnterior = cards[estadoAtual];
        const proximoCardVisivel = cards[(estadoAtual + 2) % cards.length];
        estadoAtual = (estadoAtual + 1) % cards.length;

        cardAnterior.classList.replace('is-front', 'is-hidden');
        cards[estadoAtual].classList.replace('is-back', 'is-front');
        proximoCardVisivel.classList.replace('is-hidden', 'is-back');

        setTimeout(() => {
            atualizarIndicadores();
            startProgressBar(); // Inicia a barra de progresso no novo card
            autoRotateTimeout = setTimeout(avancarCard, autoRotateDelay); // Agenda a próxima rotação
            isAnimating = false;
        }, 500); // Duração da transição no CSS
    };

    // Adiciona o listener de clique no wrapper
    wrapper.addEventListener('click', avancarCard);

    // Inicializa o card com o primeiro estado
    preencherDados();
    atualizarIndicadores();
    startProgressBar();
    autoRotateTimeout = setTimeout(avancarCard, autoRotateDelay);
}

/**
 * Configura o card interativo que alterna a visualização de participantes por dia.
 * @param {Array} inscritos - A lista de objetos de inscritos.
 */
function configurarCardParticipantesInterativo(inscritos) {
    const wrapper = document.getElementById('card-participantes-wrapper');
    const cards = [
        document.getElementById('card-participantes-total'),
        document.getElementById('card-participantes-dia13'),
        document.getElementById('card-participantes-dia14'),
        document.getElementById('card-participantes-ambos')
    ];
    const valores = [
        document.getElementById('card-participantes-total-valor'),
        document.getElementById('card-participantes-dia13-valor'),
        document.getElementById('card-participantes-dia14-valor'),
        document.getElementById('card-participantes-ambos-valor')
    ];
    const indicators = wrapper ? wrapper.querySelectorAll('.indicator-dot') : [];

    if (!wrapper || cards.some(c => !c) || valores.some(v => !v) || indicators.length === 0) return;
    
    let isAnimating = false;
    let estadoAtual = 0; // 0: Total, 1: Dia 13, 2: Dia 14, 3: Ambos
    let autoRotateTimeout; // Variável para controlar o setTimeout
    const progressBar = wrapper.querySelector('.card-progress-bar');
    const autoRotateDelay = 10000; // 10 segundos

    // Função para preencher os dados nos dois cards
    const preencherDados = () => {
        valores[0].textContent = inscritos.length; // Total
        valores[1].textContent = inscritos.filter(i => i.participa_dia_13).length; // Dia 13
        valores[2].textContent = inscritos.filter(i => i.participa_dia_14).length; // Dia 14
        valores[3].textContent = inscritos.filter(i => i.participa_dia_13 && i.participa_dia_14).length; // Ambos
    };

    const atualizarIndicadores = () => {
        indicators.forEach((dot, index) => {
            dot.classList.toggle('active', index === estadoAtual);
        });
    };

    const resetProgressBar = () => {
        progressBar.style.transition = 'width 0s';
        progressBar.style.width = '0%';
        void progressBar.offsetWidth;
    };

    const startProgressBar = () => {
        progressBar.style.transition = `width ${autoRotateDelay / 1000}s linear`;
        progressBar.style.width = '100%';
    };

    const avancarCard = () => {
        if (isAnimating) return; // Impede cliques múltiplos durante a animação
        isAnimating = true;
        clearTimeout(autoRotateTimeout); // Cancela a rotação automática anterior
        resetProgressBar();

        const cardAnterior = cards[estadoAtual];
        const proximoCardVisivel = cards[(estadoAtual + 2) % cards.length];

        estadoAtual = (estadoAtual + 1) % cards.length;

        cardAnterior.classList.replace('is-front', 'is-hidden');
        cards[estadoAtual].classList.replace('is-back', 'is-front');
        proximoCardVisivel.classList.replace('is-hidden', 'is-back');

        setTimeout(() => {
            atualizarIndicadores();
            startProgressBar(); // Inicia a barra de progresso no novo card
            autoRotateTimeout = setTimeout(avancarCard, autoRotateDelay); // Agenda a próxima rotação
            isAnimating = false;
        }, 500); // Duração da transição no CSS
    };

    // Adiciona o listener de clique no wrapper
    wrapper.addEventListener('click', avancarCard);

    // Inicializa os cards com os dados
    preencherDados();
    atualizarIndicadores();
    startProgressBar();
    autoRotateTimeout = setTimeout(avancarCard, autoRotateDelay);
}

/**
 * Configura o botão para exportar os dados da tabela para um arquivo CSV.
 * Exporta apenas as linhas visíveis (respeitando o filtro).
 */
function configurarExportacoes() {
    const exportBtn = document.getElementById('export-csv-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const exportChecklistBtn = document.getElementById('export-checklist-btn');
    const gerarCertificadosBtn = document.getElementById('gerar-certificados-btn');
    const bulkCsvBtn = document.getElementById('bulk-export-csv-btn');
    const bulkPdfBtn = document.getElementById('bulk-export-pdf-btn');
    const bulkChecklistBtn = document.getElementById('bulk-export-checklist-btn');

    const getDadosParaExportar = () => {
        const selecionados = obterIdsSelecionados();
        if (selecionados.length > 0) {
            return estado.inscritos.filter(i => selecionados.includes(i.id));
        }
        return getDadosFiltradosEOrdenados();
    };

    exportBtn?.addEventListener('click', () => gerarCSV(getDadosFiltradosEOrdenados()));
    exportPdfBtn?.addEventListener('click', () => gerarPDF(getDadosFiltradosEOrdenados()));
    exportChecklistBtn?.addEventListener('click', () => gerarChecklist(getDadosFiltradosEOrdenados()));
    gerarCertificadosBtn?.addEventListener('click', () => gerarCertificados());

    bulkCsvBtn?.addEventListener('click', () => gerarCSV(getDadosParaExportar()));
    bulkPdfBtn?.addEventListener('click', () => gerarPDF(getDadosParaExportar()));
    bulkChecklistBtn?.addEventListener('click', () => gerarChecklist(getDadosParaExportar()));
}

/**
 * Gera e baixa um arquivo CSV com base nas linhas da tabela fornecidas.
 * @param {Element[]} linhasTabela 
 */
function gerarCSV(dados) {
        let csvContent = "";

        // Cabeçalho do CSV
        const headers = ["Nome Completo", "Código", "E-mail", "CPF", "Telefone", "Empresa", "Município", "Dias", "Certificado"];
        csvContent += headers.join(";") + "\r\n";

        dados.forEach(inscrito => {
            const dias = `${inscrito.participa_dia_13 ? '13' : ''}${inscrito.participa_dia_13 && inscrito.participa_dia_14 ? ', ' : ''}${inscrito.participa_dia_14 ? '14' : ''}`;
            const certificado = inscrito.status_pagamento;

            const linha = [
                inscrito.nome_completo,
                inscrito.codigo_inscricao,
                inscrito.email,
                inscrito.cpf,
                inscrito.telefone,
                inscrito.empresa,
                inscrito.municipio,
                dias,
                certificado
            ].map(dado => `"${String(dado || '').replace(/"/g, '""')}"`);

            csvContent += linha.join(";") + "\r\n";
        });

        // Cria o link para download
        // Adiciona o BOM (\uFEFF) para garantir a compatibilidade com Excel
        const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\uFEFF' + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        
        // Define o nome do arquivo
        const dataAtual = new Date().toISOString().slice(0, 10);
        link.setAttribute("download", `inscritos_WORKSHOP_${dataAtual}.csv`);
        
        // Adiciona o link ao corpo, clica e remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
}

/**
 * Gera e baixa um arquivo PDF com a lista de inscritos.
 * @param {Array} dados - Array de objetos de inscritos.
 */
function gerarPDF(dados) {
    const { jsPDF } = window.jspdf; // Acessa o jsPDF do objeto global
        const doc = new jsPDF();
        const dataAtual = new Date().toLocaleDateString('pt-BR');

        // Define o cabeçalho do documento
        doc.setFontSize(18);
        doc.setTextColor('#062E51'); // Azul escuro
        doc.text("Lista de Inscritos - WORKSHOP", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${dataAtual}`, 14, 28);

        // Prepara os dados para a autoTable
        const head = [["Nome Completo", "E-mail", "Telefone", "Empresa", "Município", "Dias"]];
        const body = [];

        dados.forEach(inscrito => {
            const dias = `${inscrito.participa_dia_13 ? '13' : ''}${inscrito.participa_dia_13 && inscrito.participa_dia_14 ? ', ' : ''}${inscrito.participa_dia_14 ? '14' : ''}`;
            const dadosLinha = [
                inscrito.nome_completo,
                inscrito.email,
                inscrito.telefone,
                inscrito.empresa,
                inscrito.municipio,
                dias
            ];
            body.push(dadosLinha);
        });

        doc.autoTable({
            head: head,
            body: body,
            startY: 30,
            theme: 'grid',
            headStyles: {
                fillColor: [6, 46, 81], // Cor #062E51 em RGB
                textColor: [255, 255, 255]
            },
            styles: { fontSize: 8 },
            didDrawPage: function (data) {
                // Rodapé
                const str = "Desenvolvido por Maximizados";
                doc.setFontSize(10);
                doc.setTextColor(150); // Cor cinza

                // Pega as dimensões da página
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                doc.text(str, data.settings.margin.left, pageHeight - 10);
            }
        });

        doc.save(`inscritos_WORKSHOP_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Gera e baixa um arquivo PDF formatado como lista de chamada.
 * @param {Array} dados - Array de objetos de inscritos.
 */
function gerarChecklist(dados) {
    const { jsPDF } = window.jspdf; // Acessa o jsPDF do objeto global
        const doc = new jsPDF();
        const dataAtual = new Date().toLocaleDateString('pt-BR');

        // Define o cabeçalho do documento
        doc.setFontSize(18);
        doc.setTextColor('#062E51');
        doc.text("Lista de Chamada - WORKSHOP", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${dataAtual}`, 14, 28);

        // Prepara os dados para a autoTable
        const head = [['#', 'Código', 'Nome Completo', 'Empresa / Instituição', 'Assinatura']];
        const body = [];

        let contador = 1;
        dados.forEach(inscrito => {
            const nome = inscrito.nome_completo || 'N/A';
            const codigo = inscrito.codigo_inscricao || 'N/A';
            const empresa = inscrito.empresa || 'N/A';
            
            body.push([contador, codigo, nome, empresa, '']); // Adiciona o código e a coluna de assinatura
            contador++;
        });

        doc.autoTable({
            head: head,
            body: body,
            startY: 35,
            theme: 'grid',
            headStyles: {
                fillColor: [6, 46, 81], // Cor #062E51 em RGB
                textColor: [255, 255, 255]
            },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                4: { cellWidth: 50 }, // Aumenta a largura da coluna "Assinatura" (agora é a 5ª coluna)
            },
            didDrawPage: function (data) {
                // Rodapé
                const str = "Desenvolvido por Maximizados";
                doc.setFontSize(10);
                doc.setTextColor(150); // Cor cinza
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                doc.text(str, data.settings.margin.left, pageHeight - 10);
            }
        });

        doc.save(`lista_chamada_WORKSHOP_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Função auxiliar para gerar um certificado individual
 * @param {Object} inscrito - Objeto do inscrito
 */
async function gerarCertificadoIndividual(inscrito) {
    try {
        mostrarNotificacao(`Gerando certificado para ${inscrito.nome_completo}...`, 'sucesso');
        await gerarCertificadoPDF(inscrito);
        mostrarNotificacao(`Certificado gerado com sucesso!`, 'sucesso');
    } catch (error) {
        console.error('Erro ao gerar certificado individual:', error);
        mostrarNotificacao(`Erro ao gerar certificado: ${error.message}`, 'erro');
        throw error;
    }
}

/**
 * Função auxiliar para gerar o PDF do certificado
 * @param {Object} inscrito - Objeto do inscrito
 */
async function gerarCertificadoPDF(inscrito) {
    console.log('Iniciando geração do PDF do certificado...');
    
    if (!window.jspdf) {
        console.error('jsPDF não está disponível!');
        throw new Error('jsPDF não está carregado. Verifique se a biblioteca está incluída.');
    }
    
    console.log('jsPDF encontrado, criando documento...');
    const { jsPDF } = window.jspdf;
    
    // URL da imagem do certificado
    const certificadoTemplateUrl = 'https://i.ibb.co/qYRSjfXh/Certificado-Workshop-Palestrantes.png';

    // Carrega a imagem com timeout e melhor tratamento de erro
    const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        
        const timeout = setTimeout(() => {
            reject(new Error('Timeout ao carregar a imagem do certificado. Verifique sua conexão.'));
        }, 10000); // 10 segundos de timeout
        
        image.onload = () => {
            clearTimeout(timeout);
            resolve(image);
        };
        
        image.onerror = (error) => {
            clearTimeout(timeout);
            console.error('Erro ao carregar imagem:', error);
            reject(new Error('Erro ao carregar a imagem do certificado. Pode ser um problema de CORS ou a imagem não está disponível.'));
        };
        
        image.src = certificadoTemplateUrl;
    });

    // Dimensões do PDF (em mm) - A4 landscape
    const pdfWidth = 297;
    const pdfHeight = 210;
    
    // Calcula escala para ajustar a imagem ao PDF mantendo proporção
    // Converte pixels para mm: 1 pixel ≈ 0.264583 mm (a 96 DPI)
    const pxToMm = 0.264583;
    const imgWidthMm = img.width * pxToMm;
    const imgHeightMm = img.height * pxToMm;
    
    const imgAspectRatio = imgWidthMm / imgHeightMm;
    const pdfAspectRatio = pdfWidth / pdfHeight;
    
    let finalWidth, finalHeight, offsetX, offsetY;
    
    if (imgAspectRatio > pdfAspectRatio) {
        // Imagem é mais larga - ajusta pela largura
        finalWidth = pdfWidth;
        finalHeight = pdfWidth / imgAspectRatio;
        offsetX = 0;
        offsetY = (pdfHeight - finalHeight) / 2;
    } else {
        // Imagem é mais alta - ajusta pela altura
        finalHeight = pdfHeight;
        finalWidth = pdfHeight * imgAspectRatio;
        offsetX = (pdfWidth - finalWidth) / 2;
        offsetY = 0;
    }

    // Aguarda o carregamento de todas as fontes
    await document.fonts.ready;
    
    // Tenta verificar se a fonte Charm está disponível de várias formas
    let fonteCarregada = false;
    
    // Verifica com diferentes tamanhos e estilos
    const verificacoes = [
        document.fonts.check('14px Charm'),
        document.fonts.check('16px Charm'),
        document.fonts.check('24px Charm'),
        document.fonts.check('bold 14px Charm'),
        document.fonts.check('bold 24px Charm')
    ];
    
    fonteCarregada = verificacoes.some(check => check === true);
    
    // Se ainda não encontrou, aguarda mais um pouco e tenta novamente
    if (!fonteCarregada) {
        await new Promise(resolve => setTimeout(resolve, 500));
        fonteCarregada = document.fonts.check('14px Charm') || 
                        document.fonts.check('16px Charm') || 
                        document.fonts.check('24px Charm');
    }
    
    if (!fonteCarregada) {
        console.warn('Fonte Charm não está disponível, usando serif padrão');
    } else {
        console.log('Fonte Charm verificada e disponível');
    }

    // Função para renderizar texto com fonte Charm em canvas
    async function renderizarTextoComFonte(texto, fontSize, isBold = false, maxWidth = null) {
        if (!texto || texto.trim() === '') {
            console.warn('Texto vazio passado para renderizarTextoComFonte');
            texto = ' '; // Espaço para evitar erro
        }
        
        const canvas = document.createElement('canvas');
        // Adiciona willReadFrequently para melhor performance
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        const dpr = 3; // Alta resolução para melhor qualidade
        
        // Tenta usar Charm, se não estiver disponível usa serif padrão
        // Verifica com diferentes variações da fonte
        const fonteDisponivel = document.fonts.check(`${fontSize}px Charm`) || 
                               document.fonts.check(`${isBold ? 'bold' : 'normal'} ${fontSize}px Charm`) ||
                               document.fonts.check('14px Charm') || 
                               document.fonts.check('16px Charm') || 
                               document.fonts.check('24px Charm');
        const fonteUsar = fonteDisponivel ? 'Charm' : 'serif';
        
        if (fonteUsar === 'Charm') {
            console.log(`Usando fonte Charm para: "${texto.substring(0, 30)}..."`);
        } else {
            console.log(`Usando fonte serif padrão para: "${texto.substring(0, 30)}..."`);
        }
        
        // Calcula dimensões do canvas primeiro (usa fonte temporária para medir)
        let canvasWidth, canvasHeight;
        
        // Configura a fonte primeiro para medir o texto
        ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSize * dpr}px '${fonteUsar}', serif`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        if (maxWidth) {
            canvasWidth = maxWidth * dpr;
            canvasHeight = 1000 * dpr; // Altura generosa para múltiplas linhas
        } else {
            // Para texto sem maxWidth, calcula o tamanho necessário
            // Cria um canvas temporário para medir
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.font = `${isBold ? 'bold' : 'normal'} ${fontSize}px '${fonteUsar}', serif`;
            const medida = tempCtx.measureText(texto);
            canvasWidth = Math.ceil(medida.width * dpr * 1.5); // 50% de margem
            canvasHeight = Math.ceil(fontSize * 3 * dpr); // Altura generosa
        }
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Reconfigura o contexto após definir as dimensões do canvas
        ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSize * dpr}px '${fonteUsar}', serif`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Configura o fundo transparente
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        console.log(`Renderizando com fonte: ${fonteUsar}, tamanho: ${fontSize}px, texto: "${texto.substring(0, 30)}..."`);
        
        if (maxWidth) {
            const palavras = texto.split(' ');
            const linhas = [];
            let linhaAtual = '';
            
            // Converte maxWidth de mm para pixels na escala do canvas
            const maxWidthPx = maxWidth * dpr * 3.779527559; // 1mm = 3.779527559 pixels (a 96 DPI)
            
            palavras.forEach(palavra => {
                const teste = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
                const medida = ctx.measureText(teste);
                
                if (medida.width > maxWidthPx && linhaAtual) {
                    linhas.push(linhaAtual);
                    linhaAtual = palavra;
                } else {
                    linhaAtual = teste;
                }
            });
            
            if (linhaAtual) linhas.push(linhaAtual);
            
            const lineHeight = fontSize * dpr * 1.6;
            linhas.forEach((linha, index) => {
                ctx.fillText(linha, 0, index * lineHeight);
            });
            
            const alturaTotal = (linhas.length * fontSize * 1.6);
            return { canvas, linhas: linhas.length, altura: alturaTotal, largura: maxWidth };
        } else {
            // Renderiza o texto na escala alta
            // Primeiro mede o texto para calcular dimensões
            const medida = ctx.measureText(texto);
            
            // Altura calculada em pixels normais (não na escala alta)
            const alturaCalculada = fontSize * 1.5;
            
            // Calcula a posição X para centralizar horizontalmente no canvas
            const xOffset = (canvasWidth / dpr - medida.width / dpr) / 2;
            
            // Calcula a posição Y para centralizar verticalmente no canvas
            const yOffset = (canvasHeight / dpr - alturaCalculada) / 2;
            
            // Desenha o texto centralizado no canvas
            ctx.fillText(texto, xOffset * dpr, yOffset * dpr);
            
            // Aguarda um frame para garantir renderização
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            // Retorna dimensões em pixels normais (dividido por dpr)
            // Isso será convertido para mm depois
            const larguraNormal = medida.width / dpr;
            return { canvas, linhas: 1, altura: alturaCalculada, largura: larguraNormal };
        }
    }

    // Cria o documento PDF
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    // Adiciona a imagem de fundo
    doc.addImage(
        certificadoTemplateUrl,
        'PNG',
        offsetX,
        offsetY,
        finalWidth,
        finalHeight
    );

    // Obtém a data atual formatada
    const hoje = new Date();
    const dia = hoje.getDate();
    const mes = hoje.toLocaleDateString('pt-BR', { month: 'long' });
    const ano = hoje.getFullYear();
    const dataFormatada = `${dia} de ${mes} de ${ano}`;

    // Renderiza os textos com fonte Charm
    // Conversão de pixels para mm: 1px ≈ 0.264583mm (a 96 DPI)
    // O texto já está em pixels normais (dividido por dpr na função renderizarTextoComFonte)
    const pxToMmText = (px) => px * 0.264583;

    // Limpa o nome do participante (remove tags HTML e formatação)
    const nomeLimpo = inscrito.nome_completo
        .replace(/<[^>]*>/g, '') // Remove tags HTML
        .replace(/Cópia \d+ - /i, '') // Remove prefixo "Cópia X - "
        .trim();
    
    console.log('Nome do participante:', { original: inscrito.nome_completo, limpo: nomeLimpo });

    // Ajusta as posições baseadas no layout do certificado
    // Usa posições fixas em mm baseadas no layout do certificado
    // A imagem do certificado tem aproximadamente 362x257 pixels (proporção ~1.41)
    // Para A4 landscape (297x210mm), ajustamos proporcionalmente
    
    // Nome do participante - em negrito/maior, centralizado
    // Tamanho da fonte: 36px + 10% = 39.6px (arredondado para 40px)
    console.log('Renderizando nome:', nomeLimpo);
    const textoNome = await renderizarTextoComFonte(nomeLimpo, 40, true); // 10% maior que 36
    
    // Usa as dimensões do canvas em mm (canvas está em alta resolução dpr=3)
    const canvasNomeWidthMm = pxToMmText(textoNome.canvas.width / 3); // dpr = 3
    const canvasNomeHeightMm = pxToMmText(textoNome.canvas.height / 3);
    
    // Centraliza horizontalmente - centraliza o canvas inteiro (o texto já está centralizado dentro do canvas)
    const xPos = pdfWidth / 2 - canvasNomeWidthMm / 2;
    
    // Centraliza verticalmente - calcula a posição Y para centralizar no meio do PDF
    const yNome = (pdfHeight / 2) - (canvasNomeHeightMm / 2);
    
    console.log('Posicionamento do nome (centralizado):', {
        xPos: xPos,
        yPos: yNome,
        larguraTextoMm: pxToMmText(textoNome.largura),
        canvasWidthMm: canvasNomeWidthMm,
        canvasHeightMm: canvasNomeHeightMm,
        pdfWidth: pdfWidth,
        pdfHeight: pdfHeight,
        centroX: pdfWidth / 2,
        centroY: pdfHeight / 2
    });
    
    // Adiciona o nome ao PDF, sempre centralizado horizontalmente e verticalmente
    // O texto já está centralizado dentro do canvas, então centralizamos o canvas inteiro
    doc.addImage(textoNome.canvas.toDataURL('image/png'), 'PNG', 
        xPos, yNome, canvasNomeWidthMm, canvasNomeHeightMm);

    // Salva o PDF
    try {
        const nomeArquivo = `Certificado_${inscrito.nome_completo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        doc.save(nomeArquivo);
        console.log('PDF gerado com sucesso:', nomeArquivo);
    } catch (error) {
        console.error('Erro ao salvar PDF:', error);
        throw new Error('Erro ao salvar o arquivo PDF. Verifique se o navegador permite downloads.');
    }
}

/**
 * Gera certificados em PDF para todos os inscritos com status CONFIRMADO (pago).
 * Usa a imagem do certificado como template e adiciona o texto personalizado com fonte Charm.
 */
async function gerarCertificados() {
    // Filtra apenas inscritos com certificado confirmado (status_pagamento = 'pago')
    const inscritosConfirmados = estado.inscritos.filter(
        inscrito => inscrito.status_pagamento === 'pago' && inscrito.quer_certificado
    );

    if (inscritosConfirmados.length === 0) {
        mostrarNotificacao('Nenhum inscrito com certificado confirmado encontrado.', 'erro');
        return;
    }

    // Mostra notificação de progresso
    mostrarNotificacao(`Gerando ${inscritosConfirmados.length} certificado(s)...`, 'sucesso');

    // Gera um certificado para cada inscrito
    for (let i = 0; i < inscritosConfirmados.length; i++) {
        const inscrito = inscritosConfirmados[i];
        await gerarCertificadoPDF(inscrito);
        
        // Pequeno delay para evitar sobrecarga do navegador
        if (i < inscritosConfirmados.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    mostrarNotificacao(`${inscritosConfirmados.length} certificado(s) gerado(s) com sucesso!`, 'sucesso');
}

/**
 * Cria os gráficos de estatísticas com base nos dados dos inscritos.
 * @param {Array} inscritos - A lista de objetos de inscritos.
 */
function criarGraficos(inscritos) {
    // Destrói gráficos antigos para evitar sobreposição de tooltips e dados
    ['grafico-top-municipios', 'grafico-top-empresas', 'grafico-distribuicao-dias'].forEach(id => {
        const chartInstance = Chart.getChart(id);
        if (chartInstance) {
            chartInstance.destroy();
        }
    });

    const criarGraficoBarras = (canvasId, dados, titulo, corBarra) => {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const top5 = Object.entries(dados).sort(([,a],[,b]) => b-a).slice(0, 5);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: top5.map(([label]) => formatarParaTitulo(label)),
                datasets: [{
                    label: 'Nº de Inscritos',
                    data: top5.map(([, count]) => count),
                    backgroundColor: corBarra,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { display: false },
                        ticks: { precision: 0 }
                    },
                    y: {
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: titulo,
                        font: { size: 16, weight: 'bold' },
                        color: '#475569'
                    }
                }
            }
        });
    };

    // 1. Gráfico de Top 5 Municípios
    const contagemMunicipios = inscritos.reduce((acc, { municipio }) => {
        if (municipio) acc[municipio] = (acc[municipio] || 0) + 1;
        return acc;
    }, {});
    criarGraficoBarras('grafico-top-municipios', contagemMunicipios, 'Top 5 Municípios', '#22c55e'); // green-500

    // 2. Gráfico de Top 5 Empresas
    const contagemEmpresas = inscritos.reduce((acc, { empresa }) => {
        if (empresa) acc[empresa] = (acc[empresa] || 0) + 1;
        return acc;
    }, {});
    criarGraficoBarras('grafico-top-empresas', contagemEmpresas, 'Top 5 Empresas', '#3b82f6'); // blue-500

    // 3. Gráfico de Distribuição por Dia
    const ctxDias = document.getElementById('grafico-distribuicao-dias');
    if (ctxDias) {
        const contagemDias = inscritos.reduce((acc, inscrito) => {
            if (inscrito.participa_dia_13 && inscrito.participa_dia_14) acc.ambos++;
            else if (inscrito.participa_dia_13) acc.dia13++;
            else if (inscrito.participa_dia_14) acc.dia14++;
            return acc;
        }, { dia13: 0, dia14: 0, ambos: 0 });
        
        new Chart(ctxDias, {
            type: 'doughnut',
            data: {
                labels: ['Apenas Dia 13', 'Apenas Dia 14', 'Ambos os Dias'],
                datasets: [{
                    data: [contagemDias.dia13, contagemDias.dia14, contagemDias.ambos],
                    backgroundColor: ['#8b5cf6', '#ef4444', '#f97316'], // purple, red, orange
                    borderColor: '#f3f4f6', // Cor de fundo do body
                    borderWidth: 4,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: { size: 12 }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Distribuição por Dia',
                        font: { size: 16, weight: 'bold' },
                        color: '#475569',
                        padding: { bottom: 10 }
                    }
                }
            }
        });
    }
}

/**
 * Configura o botão e a lógica para excluir inscritos duplicados.
 * A duplicidade é baseada no e-mail. O inscrito mais recente é mantido.
 */
function configurarExclusaoDuplicados() {
    const deleteBtn = document.getElementById('delete-duplicates-btn'); // Corrigido
    if (!deleteBtn) return; // Corrigido

    deleteBtn.addEventListener('click', async () => {
        // Usa os dados do estado global, que já estão carregados.
        if (!estado.inscritos || estado.inscritos.length === 0) {
            mostrarNotificacao('Não há inscritos carregados para verificar duplicados.', 'aviso');
            return;
        }

        // 1. Agrupa inscritos por nome completo (ignorando maiúsculas/minúsculas)
        const inscritosPorNome = estado.inscritos.reduce((acc, inscrito) => {
            const nome = inscrito.nome_completo.toLowerCase().trim();
            if (!acc[nome]) {
                acc[nome] = [];
            }
            acc[nome].push(inscrito);
            return acc;
        }, {});

        // 2. Encontra os IDs para deletar (todos exceto o mais recente de cada grupo de duplicados)
        const idsParaDeletar = [];
        Object.values(inscritosPorNome).forEach(grupo => {
            if (grupo.length > 1) {
                // Ordena por data de criação, do mais novo para o mais antigo
                grupo.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                // Adiciona todos, exceto o primeiro (o mais novo), à lista de exclusão
                const paraDeletar = grupo.slice(1).map(i => i.id);
                idsParaDeletar.push(...paraDeletar);
            }
        });

        if (idsParaDeletar.length === 0) {
            mostrarNotificacao('Nenhum inscrito duplicado encontrado.', 'sucesso');
            return;
        }

        // 3. Pede confirmação ao usuário
        const confirmado = await mostrarModalConfirmacao(
            `Excluir ${idsParaDeletar.length} Duplicados`,
            `Foram encontrados ${idsParaDeletar.length} inscritos duplicados (baseado no nome completo). Deseja mover os registros mais antigos para a lixeira, mantendo apenas o mais recente de cada?`,
            `Sim, mover para lixeira`
        );

        // 4. Executa a exclusão (movendo para a lixeira)
        if (confirmado) {
            try {
                await updateInscritosBatch(idsParaDeletar, { is_deleted: true });
                mostrarNotificacao(`${idsParaDeletar.length} registro(s) duplicado(s) movido(s) para a lixeira.`, 'sucesso');
                document.body.dispatchEvent(new CustomEvent('dadosAlterados'));
            } catch (error) {
                mostrarNotificacao(error.message, 'erro');
            }
        }
    });
}

/**
 * Configura a busca e exibição de commits recentes do GitHub.
 */
async function configurarNotificacoesDeCommit() {
    const GITHUB_REPO = 'deept42/workshop'; // Repositório público do projeto
    const LAST_SEEN_COMMIT_KEY = 'lastSeenCommitSha';

    const commitBtn = document.getElementById('github-commits-btn');
    const commitDropdown = document.getElementById('commits-dropdown');
    const commitList = document.getElementById('commits-list');
    const commitBadge = document.getElementById('commit-count-badge');

    if (!commitBtn || !commitDropdown || !commitList || !commitBadge) return;

    /**
     * Busca os 3 commits mais recentes do repositório.
     * @returns {Promise<Array|null>}
     */
    async function buscarCommitsRecentes() {
        try {
            // Alterado de per_page=5 para per_page=3 para buscar apenas os 3 últimos commits.
            const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=3`);
            if (!response.ok) {
                console.error('Erro ao buscar commits do GitHub:', response.statusText);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error('Falha na requisição para a API do GitHub:', error);
            return null;
        }
    }

    const commits = await buscarCommitsRecentes();
    if (!commits || commits.length === 0) return;

    const lastSeenSha = localStorage.getItem(LAST_SEEN_COMMIT_KEY);
    const latestSha = commits[0].sha;

    // Calcula o número de commits novos
    let newCommitsCount = 0;
    if (lastSeenSha) {
        const lastSeenIndex = commits.findIndex(c => c.sha === lastSeenSha);
        newCommitsCount = lastSeenIndex === -1 ? commits.length : lastSeenIndex;
    } else {
        newCommitsCount = commits.length; // Se nunca viu, todos são novos
    }

    // Atualiza o badge se houver commits novos
    if (newCommitsCount > 0) {
        commitBadge.textContent = newCommitsCount > 3 ? '3+' : newCommitsCount;
        commitBadge.classList.remove('hidden');
        commitBadge.classList.add('pulse-once');
    }

    // Renderiza a lista de commits no dropdown
    commitList.innerHTML = commits.map(item => {
        const commitData = item.commit;
        const commitDate = new Date(commitData.author.date).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        return `
            <a href="${item.html_url}" target="_blank" rel="noopener noreferrer" class="block p-3 hover:bg-gray-100 rounded-md transition-colors">
                <p class="font-semibold text-gray-800 text-sm truncate">${commitData.message.split('\n')[0]}</p>
                <div class="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>${commitData.author.name}</span>
                    <span>${commitDate}</span>
                </div>
            </a>
        `;
    }).join('') || '<p class="p-4 text-center text-gray-500">Nenhum commit encontrado.</p>';

    // Lógica para abrir/fechar o dropdown
    commitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = commitDropdown.classList.contains('hidden');
        
        if (isHidden) {
            commitDropdown.classList.remove('hidden');
            // Ao abrir, marca os commits como vistos
            localStorage.setItem(LAST_SEEN_COMMIT_KEY, latestSha);
            commitBadge.classList.add('hidden'); // Esconde o badge
        } else {
            commitDropdown.classList.add('hidden');
        }
    });

    // Fecha o dropdown se clicar fora dele
    document.addEventListener('click', (e) => {
        if (!commitDropdown.contains(e.target)) {
            commitDropdown.classList.add('hidden');
        }
    });
}

/**
 * Cria um efeito de chuva de confetes na tela.
 */
function criarConfetes() {
    const container = document.body;
    const numeroDeConfetes = 150;
    // Cores baseadas no tema do site e do painel
    const cores = ['#E63946', '#3b82f6', '#22c55e', '#f97316', '#a8dadc', '#1d3557'];

    for (let i = 0; i < numeroDeConfetes; i++) {
        const confete = document.createElement('div');
        confete.classList.add('confete');
        confete.style.left = `${Math.random() * 100}vw`;
        // Duração da animação entre 3 e 7 segundos
        confete.style.animationDuration = `${Math.random() * 4 + 3}s`;
        confete.style.animationDelay = `${Math.random() * 3}s`;
        confete.style.backgroundColor = cores[Math.floor(Math.random() * cores.length)];
        
        container.appendChild(confete);

        // Remove o confete do DOM após a animação para não sobrecarregar a página
        confete.addEventListener('animationend', () => {
            confete.remove();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarPainelAdministrativo();

    // --- INICIALIZAÇÃO DOS CARDS INTERATIVOS ---
    criarCardInterativo('card-empresas-wrapper', [
        {
            cardId: 'card-empresas-total', valueId: 'card-empresas-total-valor',
            calculate: (inscritos) => new Set(inscritos.map(i => i.empresa).filter(Boolean)).size
        },
        {
            cardId: 'card-empresas-mais-inscritos', valueId: 'card-empresas-mais-inscritos-valor',
            calculate: (inscritos) => {
                const contagem = inscritos.reduce((acc, { empresa }) => { if (empresa) acc[empresa] = (acc[empresa] || 0) + 1; return acc; }, {});
                const sorted = Object.entries(contagem).sort(([, a], [, b]) => b - a);
                return sorted.length > 0 ? sorted[0][0] : 'N/A';
            }
        },
        {
            cardId: 'card-empresas-menos-inscritos', valueId: 'card-empresas-menos-inscritos-valor',
            calculate: (inscritos) => {
                const contagem = inscritos.reduce((acc, { empresa }) => { if (empresa) acc[empresa] = (acc[empresa] || 0) + 1; return acc; }, {});
                const sorted = Object.entries(contagem).sort(([, a], [, b]) => a - b);
                return sorted.length > 0 ? sorted[0][0] : 'N/A';
            }
        }
    ]);

    criarCardInterativo('card-municipios-wrapper', [
        {
            cardId: 'card-municipios-total', valueId: 'card-municipios-total-valor',
            calculate: (inscritos) => new Set(inscritos.map(i => i.municipio).filter(Boolean)).size
        },
        {
            cardId: 'card-municipios-mais-inscritos', valueId: 'card-municipios-mais-inscritos-valor',
            calculate: (inscritos) => {
                const contagem = inscritos.reduce((acc, { municipio }) => { if (municipio) acc[municipio] = (acc[municipio] || 0) + 1; return acc; }, {});
                const sorted = Object.entries(contagem).sort(([, a], [, b]) => b - a);
                return sorted.length > 0 ? sorted[0][0] : 'N/A';
            }
        },
        {
            cardId: 'card-municipios-menos-inscritos', valueId: 'card-municipios-menos-inscritos-valor',
            calculate: (inscritos) => {
                const contagem = inscritos.reduce((acc, { municipio }) => { if (municipio) acc[municipio] = (acc[municipio] || 0) + 1; return acc; }, {});
                const sorted = Object.entries(contagem).sort(([, a], [, b]) => a - b);
                return sorted.length > 0 ? sorted[0][0] : 'N/A';
            }
        }
    ]);

    criarCardInterativo('card-adesao-wrapper', [
        { cardId: 'card-adesao-percent', valueId: 'card-certificado-percent-valor', calculate: i => `${(i.filter(u => u.quer_certificado).length / (i.length || 1) * 100).toFixed(0)}%` },
        { cardId: 'card-adesao-count', valueId: 'card-certificado-count-valor', calculate: i => i.filter(u => u.quer_certificado).length },
        { cardId: 'card-adesao-receita', valueId: 'card-certificado-receita-valor', calculate: i => `R$ ${(i.filter(u => u.status_pagamento === 'pendente').length * 20).toFixed(2).replace('.', ',')}` },
        { cardId: 'card-adesao-receita-paga', valueId: 'card-certificado-receita-paga-valor', calculate: i => `R$ ${(i.filter(u => u.status_pagamento === 'pago').length * 20).toFixed(2).replace('.', ',')}` }
    ]);

    criarCardInterativo('card-participantes-wrapper', [
        { cardId: 'card-participantes-total', valueId: 'card-participantes-total-valor', calculate: i => i.length },
        { cardId: 'card-participantes-dia13', valueId: 'card-participantes-dia13-valor', calculate: i => i.filter(u => u.participa_dia_13).length },
        { cardId: 'card-participantes-dia14', valueId: 'card-participantes-dia14-valor', calculate: i => i.filter(u => u.participa_dia_14).length },
        { cardId: 'card-participantes-ambos', valueId: 'card-participantes-ambos-valor', calculate: i => i.filter(u => u.participa_dia_13 && u.participa_dia_14).length }
    ]);
});

/**
 * Formata uma string para o formato "Título", tratando preposições comuns em português.
 * Corrige letras maiúsculas no meio das palavras e formata corretamente.
 * Ex: "JOÃO DA SILVA" -> "João da Silva", "Marcio Matozo GuimarãEs" -> "Marcio Matozo Guimarães"
 * @param {string} str A string para formatar.
 * @returns {string} A string formatada.
 */
function formatarParaTitulo(str) {
    if (!str) return '';
    
    // Remove espaços extras e normaliza
    let formatado = str.trim().replace(/\s+/g, ' ');
    
    // Corrige erros comuns de digitação ANTES de normalizar
    const correcoes = {
        'cscavel': 'cascavel',
        'Cscavel': 'Cascavel',
        'CSCAVEL': 'Cascavel'
    };
    
    Object.keys(correcoes).forEach(erro => {
        const regex = new RegExp(`\\b${erro.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        formatado = formatado.replace(regex, correcoes[erro]);
    });
    
    // Primeiro, corrige letras maiúsculas no meio das palavras
    // Converte tudo para minúsculo primeiro, depois capitaliza corretamente
    formatado = formatado.toLowerCase();
    
    // Lista de preposições e artigos em português que devem ficar minúsculos
    const preposicoes = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'sem', 'sob', 'sobre', 'entre', 'até', 'a', 'o', 'as', 'os'];
    
    // Divide em palavras e formata cada uma
    const palavras = formatado.split(/\s+/);
    const palavrasFormatadas = palavras.map((palavra, index) => {
        // Ignora palavras vazias
        if (!palavra) return palavra;
        
        // Se for a primeira palavra, sempre capitaliza
        if (index === 0) {
            return palavra.charAt(0).toUpperCase() + palavra.slice(1);
        }
        
        // Se for uma preposição, mantém minúscula
        if (preposicoes.includes(palavra.toLowerCase())) {
            return palavra.toLowerCase();
        }
        
        // Para outras palavras, capitaliza a primeira letra (funciona com acentos)
        return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    });
    
    return palavrasFormatadas.join(' ');
}

/**
 * Configura o modal para adicionar um novo inscrito manualmente.
 */
function configurarModalAdicionarInscrito() {
    const openBtn = document.getElementById('add-inscrito-btn');
    const modal = document.getElementById('add-inscrito-modal');
    const form = document.getElementById('add-inscrito-form');
    const closeBtn = document.getElementById('add-modal-close-btn');
    const cancelBtn = document.getElementById('add-modal-cancel-btn');
    const saveAndAddAnotherBtn = document.getElementById('save-and-add-another-btn');
    const tituloModal = modal.querySelector('h3');

    // Lógica para o botão de copiar link (já em português)
    const copyBtn = document.getElementById('copy-link-btn'); 
    const linkInput = document.getElementById('certificate-link-input');
    const copyIcon = document.getElementById('copy-link-icon');
    const copyText = document.getElementById('copy-link-text');

    if (copyBtn && linkInput) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(linkInput.value).then(() => {
                // Feedback visual de sucesso (já em português)
                copyText.textContent = 'Copiado!'; 
                copyIcon.textContent = 'check';
                setTimeout(() => {
                    copyText.textContent = 'Copiar'; 
                    copyIcon.textContent = 'content_copy';
                }, 2000); // Volta ao normal após 2 segundos
            });
        });
    }

    if (!openBtn || !modal || !form || !closeBtn || !cancelBtn) return; // Verifica se os elementos existem

    const esconderModal = () => modal.classList.replace('flex', 'hidden'); // Função para esconder o modal

    openBtn.addEventListener('click', () => {
        // Garante que o formulário esteja limpo e o título correto ao abrir
        form.reset();
        if (tituloModal) tituloModal.textContent = 'Adicionar Novo Inscrito';
        
        modal.classList.replace('hidden', 'flex');
    });

    closeBtn.addEventListener('click', esconderModal);
    cancelBtn.addEventListener('click', esconderModal);

    /**
     * Função reutilizável para salvar um novo inscrito.
     * @returns {Promise<boolean>} Retorna true se o salvamento for bem-sucedido, false caso contrário.
     */
    const salvarNovoInscrito = async () => {
        const formData = new FormData(form);
        const novoInscrito = {
            nome_completo: formatarParaTitulo(formData.get('nome')),
            cargo_funcao: formatarParaTitulo(formData.get('cargo')),
            cpf: formData.get('cpf').replace(/\D/g, ''), // Salva apenas números
            email: formData.get('email').toLowerCase(),
            empresa: formatarParaTitulo(formData.get('empresa')),
            telefone: formData.get('telefone'),
            municipio: formatarParaTitulo(formData.get('municipio')),
            cep: formData.get('cep'),
            participa_dia_13: formData.has('dia13'),
            participa_dia_14: formData.has('dia14'),
            is_deleted: false,
            concorda_comunicacoes: true,
            quer_certificado: false,
            status_pagamento: 'nao_solicitado'
        };

        if (!novoInscrito.nome_completo || !novoInscrito.email || !novoInscrito.empresa || !novoInscrito.municipio || !novoInscrito.telefone || (!novoInscrito.participa_dia_13 && !novoInscrito.participa_dia_14)) {
            mostrarNotificacao('Por favor, preencha todos os campos, incluindo o telefone e pelo menos um dia de participação.', 'aviso');
            return false;
        }

        try {
            await addInscrito(novoInscrito);
            mostrarNotificacao('Novo inscrito adicionado com sucesso!', 'sucesso');
            document.body.dispatchEvent(new CustomEvent('dadosAlterados'));
            return true;
        } catch (error) {
            mostrarNotificacao(error.code === '23505' ? 'Este e-mail já está cadastrado.' : 'Ocorreu um erro ao salvar.', 'erro');
            return false;
        }
    };

    // Evento para "Salvar e Fechar"
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `<span class="material-symbols-outlined animate-spin">progress_activity</span>Salvando...`;

        const sucesso = await salvarNovoInscrito();
        if (sucesso) {
            esconderModal();
        }

        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    });

    // Evento para "Salvar e Novo"
    saveAndAddAnotherBtn.addEventListener('click', async () => {
        const sucesso = await salvarNovoInscrito();
        if (sucesso) {
            form.elements['nome'].value = '';
            form.elements['email'].value = '';
            form.elements['nome'].focus();
        }
    });
}

/**
 * Abre o modal de "Adicionar Inscrito" com os campos já preenchidos.
 * @param {object} dados - Os dados para preencher o formulário.
 */
function abrirModalAdicionarComDados(dados) {
    const modal = document.getElementById('add-inscrito-modal');
    const form = document.getElementById('add-inscrito-form');
    const tituloModal = modal.querySelector('h3');

    if (!modal || !form || !tituloModal) return;

    // Preenche o formulário
    form.elements['nome'].value = dados.nome_completo;
    form.elements['cargo'].value = dados.cargo_funcao;
    form.elements['cpf'].value = dados.cpf;
    form.elements['email'].value = dados.email;
    form.elements['empresa'].value = dados.empresa;
    form.elements['telefone'].value = dados.telefone;
    form.elements['municipio'].value = dados.municipio;
    form.elements['cep'].value = dados.cep;
    form.elements['dia13'].checked = dados.participa_dia_13;
    form.elements['dia14'].checked = dados.participa_dia_14;

    tituloModal.textContent = 'Duplicar Inscrito';
    modal.classList.replace('hidden', 'flex');
}

/**
 * Configura o modal para editar um inscrito existente.
 */
function configurarModalEditarInscrito() {
    const modal = document.getElementById('edit-inscrito-modal');
    const form = document.getElementById('edit-inscrito-form');
    const closeBtn = document.getElementById('edit-modal-close-btn');
    const cancelBtn = document.getElementById('edit-modal-cancel-btn');

    if (!modal || !form || !closeBtn || !cancelBtn) return;

    const esconderModal = () => modal.classList.replace('flex', 'hidden');

    closeBtn.addEventListener('click', esconderModal);
    cancelBtn.addEventListener('click', esconderModal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        const formData = new FormData(form);
        const id = formData.get('id');
        const dadosAtualizados = {
            nome_completo: formatarParaTitulo(formData.get('nome')),
            cargo_funcao: formatarParaTitulo(formData.get('cargo')),
            cpf: formData.get('cpf').replace(/\D/g, ''), // Salva apenas números
            email: formData.get('email').toLowerCase(),
            empresa: formatarParaTitulo(formData.get('empresa')),
            telefone: formData.get('telefone'),
            municipio: formatarParaTitulo(formData.get('municipio')),
            cep: formData.get('cep'),
            participa_dia_13: formData.has('dia13'),
            participa_dia_14: formData.has('dia14'),
        };

        try {
            await updateInscrito(id, dadosAtualizados);
            esconderModal();
            mostrarNotificacao('Inscrito atualizado com sucesso!', 'sucesso');
            document.body.dispatchEvent(new CustomEvent('dadosAlterados'));
        } catch (error) {
            mostrarNotificacao(error.message, 'erro');
        }

        submitButton.disabled = false;
        submitButton.textContent = 'Salvar Alterações';
    });
}

/**
 * Abre o modal de edição e preenche com os dados do inscrito.
 * @param {object} inscrito - O objeto com os dados do inscrito.
 */
function abrirModalEdicao(inscrito) {
    const modal = document.getElementById('edit-inscrito-modal');
    const form = document.getElementById('edit-inscrito-form');

    if (!modal || !form) return;

    // Preenche o formulário
    form.elements['id'].value = inscrito.id;
    form.elements['nome'].value = inscrito.nome_completo;
    form.elements['cpf'].value = inscrito.cpf;
    form.elements['cargo'].value = inscrito.cargo_funcao;
    form.elements['email'].value = inscrito.email;
    form.elements['empresa'].value = inscrito.empresa;
    form.elements['telefone'].value = inscrito.telefone;
    form.elements['municipio'].value = inscrito.municipio;
    form.elements['cep'].value = inscrito.cep;
    form.elements['dia13'].checked = inscrito.participa_dia_13;
    form.elements['dia14'].checked = inscrito.participa_dia_14;

    // Exibe o modal
    modal.classList.replace('hidden', 'flex');
}

/**
 * Configura o menu de ações flutuante (FAB).
 */
function configurarMenuFlutuante() {
    const fabContainer = document.getElementById('fab-container');
    const fabMainBtn = document.getElementById('fab-main-btn');
    const fabIcon = fabMainBtn ? fabMainBtn.querySelector('.material-symbols-outlined') : null;

    if (!fabContainer || !fabMainBtn || !fabIcon) return;

    fabMainBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fabContainer.classList.toggle('open');
        // Troca o ícone com base no estado do menu
        const isOpen = fabContainer.classList.contains('open');
        fabIcon.textContent = isOpen ? 'close' : 'help';
    });

    document.addEventListener('click', (e) => {
        if (!fabContainer.contains(e.target)) {
            fabContainer.classList.remove('open');
        }
    });
    // Garante que o ícone volte ao normal se o menu for fechado clicando fora
    fabContainer.addEventListener('transitionend', () => {
        if (!fabContainer.classList.contains('open')) {
            fabIcon.textContent = 'help';
        }
    });
}

/**
 * Configura a lógica para o tutorial guiado da página.
 */
function configurarTutorialGuiado() {
    const startBtn = document.getElementById('start-tutorial-btn');
    const overlay = document.getElementById('tutorial-overlay');
    const highlightBox = document.getElementById('tutorial-highlight');
    const tutorialBox = document.getElementById('tutorial-box');

    if (!startBtn || !overlay || !highlightBox || !tutorialBox) return;

    // Ações personalizadas que podem ser executadas antes ou depois de um passo
    const acoesTutorial = {
        abrirGraficos: () => document.getElementById('toggle-charts-btn')?.click(),
        fecharGraficos: () => {
            const chartsSection = document.getElementById('charts-section');
            if (chartsSection && !chartsSection.classList.contains('hidden')) {
                document.getElementById('toggle-charts-btn')?.click();
            }
        },
        abrirMenuAjuda: () => document.getElementById('fab-container')?.classList.add('open'),
        fecharMenuAjuda: () => document.getElementById('fab-container')?.classList.remove('open'),
        abrirModalAdicionar: () => {
            return new Promise(resolve => {
                document.getElementById('add-inscrito-btn')?.click();
                setTimeout(resolve, 300); // Aguarda 300ms para a animação do modal
            });
        },
        fecharModalAdicionar: () => document.getElementById('add-modal-close-btn')?.click(),
        abrirModalEditar: () => {
            return new Promise(resolve => {
                document.querySelector('.btn-editar')?.click(); // Clica no primeiro botão de editar que encontrar
                setTimeout(resolve, 300); // Aguarda a animação do modal
            });
        },
        fecharModalEditar: () => document.getElementById('edit-modal-close-btn')?.click()
    };

    const passos = [
        { element: '#summary-section', title: '1. Visão Geral (Resumo e Gráficos)', text: 'Aqui você tem uma visão rápida das métricas mais importantes. Os cards são interativos e os gráficos mostram a distribuição dos inscritos.', proTip: 'Clique nos cards para alternar entre diferentes métricas, como o total de empresas e o município com mais inscritos.' },
        { element: '#toggle-charts-btn', title: '2. Alternar Visualização (Ocultar/Mostrar Gráficos)', text: 'Use este botão para expandir ou recolher a seção de gráficos, focando na tabela de inscritos quando necessário.', proTip: 'Ocultar os gráficos pode facilitar a visualização da tabela em telas menores.', acaoAntes: acoesTutorial.abrirGraficos, acaoDepois: acoesTutorial.fecharGraficos },
        { element: '.admin-table', title: '3. Entender a Lista de Inscritos', text: 'Esta é a lista principal de participantes. Você pode ordenar as colunas clicando nos títulos e realizar ações individuais em cada linha.', proTip: 'Clique no cabeçalho de uma coluna (como "Nome Completo") para ordenar a lista em ordem crescente ou decrescente.' },
        { element: '#filtro-busca', title: '4. Buscar e Filtrar Inscritos', text: 'Use este campo para encontrar rapidamente um participante. Você pode escolher em qual coluna buscar para refinar sua pesquisa.', proTip: 'Para buscar por um dia específico, selecione a coluna "Dia" e digite "13" ou "14".' },
        { element: '#add-inscrito-btn', title: '5. Adicionar Novo Inscrito', text: 'Clique aqui para abrir o formulário e cadastrar um novo participante manualmente. Ideal para inscrições feitas no local.', proTip: 'Manter o painel aberto em um tablet no dia do evento pode agilizar o cadastro de última hora.' },
        { element: '#add-inscrito-modal-content', title: '6. Preencher o Formulário', text: 'Este é o formulário para adicionar um novo inscrito. Preencha os dados e escolha os dias de participação.', proTip: 'Campos com * são obrigatórios para garantir a qualidade dos dados.', acaoAntes: acoesTutorial.abrirModalAdicionar, position: 'right' },
        { element: '#save-and-add-another-btn', title: '7. Salvar o Novo Inscrito', text: 'Use "Salvar e Fechar" para finalizar ou "Salvar e Novo" para cadastrar várias pessoas da mesma empresa rapidamente, mantendo os dados em comum.', proTip: 'O botão "Salvar e Novo" é um grande aliado para agilizar o cadastro de grupos.', acaoDepois: acoesTutorial.fecharModalAdicionar },
        { element: '#export-csv-btn', title: '8. Exportar para CSV', text: 'Gera um arquivo CSV (compatível com Excel) com os dados dos inscritos visíveis na tabela.', proTip: 'O CSV é ideal para análises de dados mais profundas ou para importar a lista em outras ferramentas de gerenciamento.' },
        { element: '#export-pdf-btn', title: '9. Exportar Relatório PDF', text: 'Cria um relatório completo em PDF com todos os dados dos inscritos, ideal para arquivamento e análise.', proTip: 'Este PDF é perfeito para gerar um documento oficial do evento, com uma formatação profissional e todos os detalhes dos participantes.' },
        { element: '#export-checklist-btn', title: '10. Exportar Checklist de Presença', text: 'Gera uma lista de chamada simplificada em PDF, pronta para ser impressa e usada no credenciamento do evento.', proTip: 'No dia do evento, imprima uma lista para cada dia. Use o filtro de "Dias" antes de exportar para gerar uma checklist específica para o Dia 13 e outra para o Dia 14.' },
        { element: '#delete-duplicates-btn', title: '11. Excluir Duplicados', text: 'Esta função inteligente verifica todos os inscritos com o mesmo nome completo e move os registros mais antigos para a lixeira.', proTip: 'Use esta função após importar ou adicionar muitos inscritos para garantir que sua lista esteja limpa e sem entradas repetidas.' },
        { element: '#view-toggle-switch', title: '12. Ativos e Lixeira', text: 'Alterne entre a visualização de inscritos ativos e os que foram movidos para a lixeira. O número na lixeira indica quantos itens foram removidos.', proTip: 'A lixeira é uma camada de segurança. Itens aqui podem ser restaurados ou excluídos permanentemente, evitando perdas acidentais.' },
        { element: '#lista-inscritos tr:first-child td:last-child', title: '13. Ações Individuais', text: 'Em cada linha, você encontra botões para Editar, Mover para a Lixeira ou Duplicar um inscrito.', proTip: 'Duplicar é útil para cadastrar rapidamente outra pessoa da mesma empresa, pois copia todos os dados, exceto o nome.' },
        { element: '.btn-editar', title: '14. Editar um Inscrito', text: 'Vamos ver como editar. Ao clicar no lápis, o formulário de edição é aberto com os dados do participante.', proTip: 'É a maneira mais rápida de corrigir um nome, e-mail ou alterar os dias de participação.' },
        { element: '#edit-inscrito-modal-content', title: '15. Alterar os Dados', text: 'O formulário de edição é similar ao de adição. Faça as alterações necessárias nos campos.', proTip: 'Lembre-se de verificar se os dias de participação estão corretos antes de salvar.', acaoAntes: acoesTutorial.abrirModalEditar, position: 'right' },
        { element: '#edit-inscrito-form button[type="submit"]', title: '16. Salvar Alterações', text: 'Após fazer as modificações, clique neste botão para salvar e atualizar os dados do inscrito na tabela.', proTip: 'As alterações são salvas imediatamente no banco de dados.', acaoDepois: acoesTutorial.fecharModalEditar },
        { element: '#fab-main-btn', title: '17. Conclusão (Precisa de ajuda?)', text: 'Este é o menu de ajuda. Por aqui, você pode iniciar este tutorial novamente ou entrar em contato com o suporte técnico.', proTip: 'Se encontrar qualquer comportamento inesperado (um "bug"), use o botão de WhatsApp para reportar diretamente ao desenvolvedor.', acaoAntes: acoesTutorial.abrirMenuAjuda, acaoDepois: acoesTutorial.fecharMenuAjuda }
    ];

    let passoAtual = 0;

    async function mostrarPasso(index) {
        if (index < 0 || index >= passos.length) {
            finalizarTutorial();
            return;
        }

        // Executa a ação de "limpeza" do passo de onde saímos (seja para frente ou para trás)
        const passoAnterior = passos[passoAtual];
        if (passoAnterior && passoAnterior.acaoDepois) { passoAnterior.acaoDepois(); }

        passoAtual = index;
        const passo = passos[index];
        const elementoAlvo = document.querySelector(passo.element);

        if (!elementoAlvo) {
            console.warn(`Elemento do tutorial não encontrado: ${passo.element}`);
            mostrarPasso(index + 1); // Pula para o próximo passo
            return;
        }

        // Executa a ação ANTES de mostrar o passo atual
        if (passo.acaoAntes) { // Agora a função pode ser assíncrona
            await passo.acaoAntes();
        }

        // Rola a tela para que o elemento destacado fique visível ANTES de calcular a posição.
        // Usamos 'instant' para garantir que a posição seja calculada corretamente,
        // e um pequeno timeout para dar a sensação de suavidade.
        elementoAlvo.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });

        setTimeout(() => {
            // Posiciona a área de destaque
            const rect = elementoAlvo.getBoundingClientRect();
            highlightBox.style.width = `${rect.width + 16}px`;
            highlightBox.style.height = `${rect.height + 16}px`;
            highlightBox.style.top = `${rect.top - 8 + window.scrollY}px`;
            highlightBox.style.left = `${rect.left - 8 + window.scrollX}px`;

            // Cria e posiciona a caixa de texto
            const proTipHtml = passo.proTip 
                ? `<div class="mt-4 pt-3 border-t border-gray-200">
                       <p class="text-xs font-bold text-amber-600 uppercase mb-1">Dica do Desenvolvedor</p>
                       <p class="text-xs text-gray-600">${passo.proTip}</p>
                   </div>`
                : '';

            tutorialBox.innerHTML = `
                <h4 class="font-bold text-lg text-[#062E51] mb-2">${passo.title}</h4>
                <p class="text-gray-700 text-sm">${passo.text}</p>
                ${proTipHtml}
                <div class="flex justify-between items-center">
                    <span class="text-xs font-semibold text-gray-500">${index + 1} / ${passos.length}</span>
                    <div>
                        <button id="tutorial-end-btn" class="px-3 py-1 text-sm rounded-md bg-gray-200 hover:bg-gray-300 transition-colors">Encerrar</button>
                        <button id="tutorial-next-btn" class="px-3 py-1 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors">${index === passos.length - 1 ? 'Finalizar' : 'Próximo'}</button>
                    </div>
                </div>
            `;
            tutorialBox.classList.remove('hidden');

            // Posiciona a caixa de texto
            const boxRect = tutorialBox.getBoundingClientRect();
            let top, left;

            if (passo.position === 'right') {
                // Posiciona à direita do elemento alvo
                top = rect.top + (rect.height / 2) - (boxRect.height / 2) + window.scrollY;
                left = rect.right + 15 + window.scrollX;
            } else {
                // Lógica padrão (abaixo ou acima)
                top = rect.bottom + 15 + window.scrollY;
                left = rect.left + (rect.width / 2) - (boxRect.width / 2) + window.scrollX;

                // Ajusta para não sair da tela
                if (left < 10) left = 10;
                if (left + boxRect.width > window.innerWidth - 10) left = window.innerWidth - boxRect.width - 10;
                if (top + boxRect.height > window.innerHeight + window.scrollY - 10) {
                    top = rect.top - boxRect.height - 15 + window.scrollY;
                }
            }

            tutorialBox.style.top = `${top}px`;
            tutorialBox.style.left = `${left}px`;

            // Configura os botões de navegação do tutorial
            document.getElementById('tutorial-next-btn').addEventListener('click', () => mostrarPasso(passoAtual + 1));
            document.getElementById('tutorial-end-btn').addEventListener('click', () => finalizarTutorial());
        }, 50); // Pequeno delay para suavizar a transição visual
    }

    function iniciarTutorial() {
        overlay.classList.remove('hidden');
        passoAtual = 0;
        mostrarPasso(passoAtual);
    }

    function finalizarTutorial() {
        overlay.classList.add('hidden');
        tutorialBox.classList.add('hidden');
        highlightBox.style.width = '0px'; // Recolhe a caixa de destaque

        // Garante que qualquer ação de "limpeza" do último passo seja executada
        const ultimoPasso = passos[passoAtual];
        if (ultimoPasso && ultimoPasso.acaoDepois) {
            ultimoPasso.acaoDepois();
        }

        // Solta os confetes para celebrar!
        criarConfetes();

        // Mostra uma notificação de sucesso
        mostrarNotificacao('Tutorial concluído com sucesso!', 'sucesso');
    }

    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fabContainer = document.getElementById('fab-container');
        if (fabContainer) fabContainer.classList.remove('open'); // Fecha o menu
        iniciarTutorial();
    });

    // Permite fechar o tutorial clicando fora da caixa de texto
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            finalizarTutorial();
        }
    });

    // Permite fechar com a tecla 'Esc'
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
            finalizarTutorial();
        }
    });
}