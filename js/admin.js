/**
 * @file Gerencia a página do painel administrativo.
 * @description Protege a página, busca e exibe a lista de inscritos, e gerencia o logout.
 */

import { supabase } from './supabaseClient.js';
import { configurarControlesAcessibilidade } from './acessibilidade.js';
import { mostrarNotificacao } from './notificacoes.js';

/**
 * Função principal que inicializa o painel de administração.
 */
async function inicializarPainelAdministrativo() {
    // Variáveis de estado para controlar a visualização
    let todosInscritos = [];
    let mostrandoLixeira = false;

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        alert('Acesso negado. Por favor, faça o login como administrador.');
        window.location.replace('index.html');
        return;
    }

    const adminEmailEl = document.getElementById('admin-email');
    if (adminEmailEl) adminEmailEl.textContent = session.user.email;

    /**
     * Atualiza todas as partes da UI que dependem dos dados dos inscritos.
     */
    function atualizarUICompleta() {
        const inscritosAtivos = todosInscritos.filter(i => !i.is_deleted);
        
        renderizarVisualizacao();
        
        configurarCardEmpresasInterativo(inscritosAtivos);
        configurarCardMunicipiosInterativo(inscritosAtivos);
        configurarCardCertificadoInterativo(inscritosAtivos);
        preencherMetricas(inscritosAtivos);
        configurarCardParticipantesInterativo(inscritosAtivos);
        criarGraficos(inscritosAtivos);

        const bulkActionsBar = document.getElementById('bulk-actions-bar');
        if (bulkActionsBar) bulkActionsBar.classList.add('hidden');
    }

    /**
     * Configura todos os listeners de eventos que só precisam ser configurados uma vez.
     */
    function configurarTudo() {
        configurarFiltroDeBusca();
        configurarOrdenacaoTabela(todosInscritos, renderizarVisualizacao);
        configurarAcoesTabela(async () => {
            todosInscritos = await buscarInscritos();
            atualizarUICompleta();
        });
        configurarAcoesEmMassa(async () => {
            todosInscritos = await buscarInscritos();
            atualizarUICompleta();
        });
        configurarExportacaoCSV();
        configurarExportacaoPDF();
        configurarExportacaoChecklist();
        configurarExclusaoDuplicados();
        configurarControlesAcessibilidade();
        configurarModalAdicionarInscrito(async () => {
            todosInscritos = await buscarInscritos();
            atualizarUICompleta();
        });
        configurarModalEditarInscrito(async () => {
            todosInscritos = await buscarInscritos();
            atualizarUICompleta();
        });
        configurarNotificacoesDeCommit();
        configurarBotaoGraficos();
    }

    // 3. Configurar o Botão de Logout
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            // O onAuthStateChange na página principal cuidará do resto,
            // mas garantimos o redirecionamento.
            window.location.replace('index.html');
        });
    }

    // Configura o interruptor (toggle switch) da lixeira
    const toggleSwitch = document.getElementById('view-toggle-switch');
    const labelAtivos = document.getElementById('toggle-label-ativos');
    const labelLixeira = document.getElementById('toggle-label-lixeira');

    if (toggleSwitch && labelAtivos && labelLixeira) {
        // Adiciona cursor de ponteiro para indicar que os labels são clicáveis
        labelAtivos.classList.add('cursor-pointer');
        labelLixeira.classList.add('cursor-pointer');

        // Função central para alternar a visualização
        const alternarVisualizacao = () => {
            mostrandoLixeira = !mostrandoLixeira;

            // Atualiza a aparência do interruptor
            const thumb = document.getElementById('toggle-thumb');

            toggleSwitch.classList.toggle('bg-red-600', mostrandoLixeira);
            toggleSwitch.classList.toggle('bg-green-600', !mostrandoLixeira);
            thumb.classList.toggle('translate-x-5', mostrandoLixeira);
            thumb.classList.toggle('translate-x-0', !mostrandoLixeira);

            labelAtivos.classList.toggle('text-green-700', !mostrandoLixeira);
            labelAtivos.classList.toggle('text-gray-400', mostrandoLixeira);
            labelLixeira.classList.toggle('text-red-600', mostrandoLixeira);
            labelLixeira.classList.toggle('text-gray-400', !mostrandoLixeira);

            // Renderiza a visualização correta (ativos ou lixeira)
            renderizarVisualizacao();
        };

        // Adiciona o evento de clique ao interruptor e aos labels
        toggleSwitch.addEventListener('click', alternarVisualizacao);
        labelAtivos.addEventListener('click', alternarVisualizacao);
        labelLixeira.addEventListener('click', alternarVisualizacao);
    }

    function renderizarVisualizacao() {
        const dadosParaRenderizar = mostrandoLixeira
            ? todosInscritos.filter(i => i.is_deleted)
            : todosInscritos.filter(i => !i.is_deleted);
        renderizarTabela(dadosParaRenderizar, mostrandoLixeira);

        // Atualiza o contador da lixeira
        const trashCountBadge = document.getElementById('trash-count-badge');
        if (trashCountBadge) {
            const count = todosInscritos.filter(i => i.is_deleted).length;
            trashCountBadge.textContent = count;
            trashCountBadge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // --- PONTO DE ENTRADA ---
    todosInscritos = await buscarInscritos();
    if (todosInscritos) {
        atualizarUICompleta(); // Renderiza a UI pela primeira vez
        configurarTudo();      // Configura todos os eventos
        
    } else {
        document.getElementById('lista-inscritos').innerHTML = `<tr><td colspan="8" class="px-6 py-4 text-center text-red-500">Falha ao carregar dados.</td></tr>`;
    }
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
 * Busca os dados da tabela 'cadastro_workshop' no Supabase.
 * @returns {Promise<Array|null>} Uma lista de inscritos ou null em caso de erro.
 */
async function buscarInscritos() {    
    const { data: inscritos, error } = await supabase
        .from('cadastro_workshop')
        .select('*')
        .order('nome_completo', { ascending: true });
    
    if (error) {
        console.error('Erro ao buscar inscritos:', error.message, error); // Loga a mensagem e o objeto completo
        return null;
    }
    return inscritos;
}

/**
 * Gera o HTML para uma única linha da tabela de inscritos.
 * @param {object} inscrito - O objeto do inscrito.
 * @param {boolean} naLixeira - Flag para saber se a visualização é da lixeira.
 * @returns {string} O HTML da tag <tr>.
 */
function gerarHtmlLinha(inscrito, naLixeira = false) {
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

    const botaoAcao = naLixeira
        ? `<div class="flex gap-2">...</div>` // Lógica da lixeira mantida
        : `<button class="btn-mover-lixeira text-gray-500 hover:text-red-600 transition-colors" data-id="${inscrito.id}" data-nome="${inscrito.nome_completo}" title="Mover para a lixeira">
               <span class="material-symbols-outlined">delete</span>
           </button>
           <button class="btn-editar text-gray-500 hover:text-blue-600 transition-colors" data-id="${inscrito.id}" title="Editar inscrito">
                <span class="material-symbols-outlined">edit</span>
           </button>
           <button class="btn-duplicar text-gray-500 hover:text-amber-600 transition-colors" data-id="${inscrito.id}" title="Duplicar inscrito">
                <span class="material-symbols-outlined">content_copy</span>
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

    return `<tr data-id="${inscrito.id}">
        <td class="text-center"><input type="checkbox" class="row-checkbox h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" data-id="${inscrito.id}"></td>
        <td class="whitespace-nowrap font-medium">${nomeHtml}</td>
        <td class="whitespace-nowrap">${inscrito.email}</td>
        <td class="whitespace-nowrap">${inscrito.telefone}</td>
        <td class="whitespace-nowrap">${formatarParaTitulo(inscrito.empresa)}</td>
        <td class="whitespace-nowrap">${formatarParaTitulo(inscrito.municipio)}</td>
        <td class="whitespace-nowrap">${diasHtml}</td>
        <td class="whitespace-nowrap text-sm text-gray-600">${dataInscricao}</td>
        <td class="whitespace-nowrap flex items-center gap-2">${botaoAcao}</td>
    </tr>`;
}

/**
 * Renderiza os dados dos inscritos na tabela HTML.
 * @param {Array} inscritos - A lista de objetos de inscritos a serem exibidos.
 * @param {boolean} naLixeira - Flag para saber se a visualização é da lixeira.
 */
function renderizarTabela(inscritos, naLixeira = false) {
    const corpoTabela = document.getElementById('lista-inscritos');
    if (!corpoTabela) return;

    if (inscritos.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="9" class="px-6 py-4 text-center text-gray-500">Nenhum inscrito encontrado.</td></tr>`;
        return;
    }

    const linhasHtml = inscritos.map(inscrito => gerarHtmlLinha(inscrito, naLixeira)).join('');

    corpoTabela.innerHTML = linhasHtml;

    // Após renderizar, reconfigura a seleção para garantir que os listeners estejam nos novos elementos
    configurarSelecaoEmMassa(naLixeira);
}




/**
 * Configura o campo de busca para filtrar a tabela de inscritos.
 */
function configurarFiltroDeBusca() {
    const seletorColuna = document.getElementById('filtro-coluna');
    const filtroInput = document.getElementById('filtro-busca');

    if (!seletorColuna || !filtroInput) return;

    const executarFiltro = () => {
        const colunaSelecionada = seletorColuna.value;
        const termoBusca = filtroInput.value.toLowerCase().trim();
        const linhasTabela = document.querySelectorAll('#lista-inscritos tr');

        // Mapeia os valores do <select> para os índices das colunas da tabela (começando em 0)
        const mapaColunas = {
            'nome': 1,
            'email': 2,
            'telefone': 3,
            'empresa': 4,
            'municipio': 5,
            'dias': 6,
            'created_at': 7
        };

        linhasTabela.forEach(linha => {
            let textoParaVerificar = '';

            if (colunaSelecionada === 'all') {
                // Busca em toda a linha
                textoParaVerificar = linha.textContent.toLowerCase();
            } else {
                // Busca na coluna específica
                const indiceColuna = mapaColunas[colunaSelecionada];
                const celula = linha.querySelectorAll('td')[indiceColuna];
                if (celula) textoParaVerificar = celula.textContent.toLowerCase();
            }

            linha.style.display = textoParaVerificar.includes(termoBusca) ? '' : 'none';
        });
    };

    // Executa o filtro sempre que o texto ou a seleção mudar
    filtroInput.addEventListener('input', executarFiltro);
    seletorColuna.addEventListener('change', executarFiltro);
}

/**
 * Adiciona a funcionalidade de ordenação à tabela ao clicar nos cabeçalhos.
 * @param {Array} inscritos - A lista completa de todos os inscritos (ativos e lixeira).
 * @param {Function} callbackRender - A função que deve ser chamada para re-renderizar a tabela.
 */
function configurarOrdenacaoTabela(inscritos, callbackRender) {
    const headers = document.querySelectorAll('.admin-table th[data-column]');
    let colunaOrdenadaAtual = 'nome_completo';
    let direcaoOrdenacaoAtual = 'asc';

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const colunaSelecionada = header.dataset.column;

            if (colunaSelecionada === colunaOrdenadaAtual) {
                direcaoOrdenacaoAtual = direcaoOrdenacaoAtual === 'asc' ? 'desc' : 'asc';
            } else {
                colunaOrdenadaAtual = colunaSelecionada;
                direcaoOrdenacaoAtual = 'asc';
            }

            // Ordena o array principal de inscritos
            inscritos.sort((a, b) => {
                let valorA, valorB;

                // Tratamento especial para a coluna 'dias'
                if (colunaSelecionada === 'dias') {
                    valorA = `${a.participa_dia_13 ? '13' : ''}${a.participa_dia_13 && a.participa_dia_14 ? ', ' : ''}${a.participa_dia_14 ? '14' : ''}`;
                    valorB = `${b.participa_dia_13 ? '13' : ''}${b.participa_dia_13 && b.participa_dia_14 ? ', ' : ''}${b.participa_dia_14 ? '14' : ''}`;
                } else if (colunaSelecionada === 'created_at') {
                    // Para datas, compara os objetos Date diretamente
                    valorA = new Date(a.created_at);
                    valorB = new Date(b.created_at);
                } else {
                    valorA = a[colunaSelecionada];
                    valorB = b[colunaSelecionada];
                }

                // Garante que valores nulos ou indefinidos fiquem no final
                if (valorA == null) return 1;
                if (valorB == null) return -1;

                let comparacao = 0;
                if (typeof valorA === 'string' && typeof valorB === 'string') {
                    // Comparação de texto
                    comparacao = valorA.localeCompare(valorB, 'pt-BR', { sensitivity: 'base' });
                } else {
                    // Comparação numérica ou de booleano
                    if (valorA < valorB) comparacao = -1;
                    if (valorA > valorB) comparacao = 1;
                }

                return direcaoOrdenacaoAtual === 'asc' ? comparacao : -comparacao;
            });

            // Chama a função de renderização para redesenhar a tabela com os dados agora ordenados
            callbackRender();

            // Atualiza os ícones de seta nos cabeçalhos
            atualizarIconesOrdenacao(headers, colunaSelecionada, direcaoOrdenacaoAtual);
        });
    });
}

/**
 * Configura os botões e a lógica da barra de ações em massa.
 * @param {Array} todosInscritos - A lista completa de todos os inscritos.
 * @param {Function} callbackSucesso - Função a ser chamada após uma ação bem-sucedida.
 */
function configurarAcoesEmMassa(callbackSucesso) {
    const bulkMoveBtn = document.getElementById('bulk-move-to-trash-btn');
    const bulkCsvBtn = document.getElementById('bulk-export-csv-btn');
    const bulkPdfBtn = document.getElementById('bulk-export-pdf-btn');
    const bulkChecklistBtn = document.getElementById('bulk-export-checklist-btn');
    const bulkRestoreBtn = document.getElementById('bulk-restore-btn');
    const bulkDeletePermanentBtn = document.getElementById('bulk-delete-permanent-btn');
    if (bulkMoveBtn) {
        bulkMoveBtn.addEventListener('click', async () => {
            const idsParaMover = obterIdsSelecionados();
            if (idsParaMover.length === 0) return;

            const confirmado = await mostrarModalConfirmacaoDeletar(
                `Mover ${idsParaMover.length} Itens`,
                `Você tem certeza que deseja mover os ${idsParaMover.length} itens selecionados para a lixeira?`,
                `Sim, mover`
            );

            if (confirmado) {
                const { error } = await supabase.from('cadastro_workshop').update({ is_deleted: true }).in('id', idsParaMover);
                if (error) {
                    mostrarNotificacao('Ocorreu um erro ao mover os itens.', 'erro');
                } else {
                    mostrarNotificacao(`${idsParaMover.length} iten(s) movido(s) para a lixeira.`, 'sucesso');
                    callbackSucesso();
                }
            }
        });
    }

    // Ação: Exportar CSV dos selecionados
    if (bulkCsvBtn) {
        bulkCsvBtn.addEventListener('click', () => {
            const linhasSelecionadas = obterLinhasParaExportacao();
            if (linhasSelecionadas.length === 0) return;
            gerarCSV(linhasSelecionadas);
        });
    }

    // Ação: Exportar PDF dos selecionados
    if (bulkPdfBtn) {
        bulkPdfBtn.addEventListener('click', () => {
            const linhasSelecionadas = obterLinhasParaExportacao();
            if (linhasSelecionadas.length === 0) return;
            gerarPDF(linhasSelecionadas);
        });
    }

    // Ação: Exportar Checklist dos selecionados
    if (bulkChecklistBtn) {
        bulkChecklistBtn.addEventListener('click', () => {
            const linhasSelecionadas = obterLinhasParaExportacao();
            if (linhasSelecionadas.length === 0) return;
            gerarChecklist(linhasSelecionadas);
        });
    }

    // Ação: Restaurar em massa da lixeira
    if (bulkRestoreBtn) {
        bulkRestoreBtn.addEventListener('click', async () => {
            const idsParaRestaurar = obterIdsSelecionados();
            if (idsParaRestaurar.length === 0) return;

            // Não precisa de confirmação para restaurar
            const { error } = await supabase.from('cadastro_workshop').update({ is_deleted: false }).in('id', idsParaRestaurar);
            if (error) {
                mostrarNotificacao('Ocorreu um erro ao restaurar os itens.', 'erro');
            } else {
                mostrarNotificacao(`${idsParaRestaurar.length} iten(s) restaurado(s) com sucesso.`, 'sucesso');
                callbackSucesso();
            }
        });
    }

    // Ação: Excluir permanentemente em massa
    if (bulkDeletePermanentBtn) {
        bulkDeletePermanentBtn.addEventListener('click', async () => {
            const idsParaDeletar = obterIdsSelecionados();
            if (idsParaDeletar.length === 0) return;

            const confirmado = await mostrarModalConfirmacaoDeletar(
                `Excluir ${idsParaDeletar.length} Itens Permanentemente`,
                `ATENÇÃO: Você tem certeza que deseja excluir permanentemente os ${idsParaDeletar.length} itens selecionados? Esta ação não pode ser desfeita.`,
                `Sim, excluir permanentemente`
            );

            if (confirmado) {
                const { error } = await supabase.from('cadastro_workshop').delete().in('id', idsParaDeletar);
                if (error) {
                    mostrarNotificacao('Ocorreu um erro ao excluir os itens permanentemente.', 'erro');
                } else {
                    mostrarNotificacao(`${idsParaDeletar.length} iten(s) excluído(s) permanentemente.`, 'sucesso');
                    callbackSucesso();
                }
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
function configurarSelecaoEmMassa(naLixeira = false) {
    const bulkActionsBar = document.getElementById('bulk-actions-bar');
    const bulkActionsCount = document.getElementById('bulk-actions-count');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    
    const btnsAtivos = document.querySelectorAll('.bulk-action-ativos');
    const btnsLixeira = document.querySelectorAll('.bulk-action-lixeira');

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
        btnsAtivos.forEach(btn => btn.classList.toggle('hidden', naLixeira));
        btnsLixeira.forEach(btn => btn.classList.toggle('hidden', !naLixeira));

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
 * @param {Function} callbackSucesso - Função a ser chamada após uma ação bem-sucedida.
 */
function configurarAcoesTabela(callbackSucesso) {
    const corpoTabela = document.getElementById('lista-inscritos');
    if (!corpoTabela) return;

    corpoTabela.addEventListener('click', async (e) => {
        const targetButton = e.target.closest('.btn-mover-lixeira, .btn-restaurar, .btn-deletar-permanente, .btn-editar, .btn-duplicar');
        if (!targetButton) return;

        const inscritoId = targetButton.dataset.id;
        const inscritoNome = targetButton.dataset.nome; // Captura o nome para usar nos modais
        
        if (targetButton.classList.contains('btn-mover-lixeira')) {
            // Abre o modal de confirmação para mover para a lixeira
            const confirmado = await mostrarModalConfirmacaoDeletar(
                `Mover para a Lixeira`,
                `Você tem certeza que deseja mover "${inscritoNome}" para a lixeira?`,
                `Sim, mover`
            );

            if (confirmado) {
                await atualizarStatusInscrito(inscritoId, true, callbackSucesso);
            }
        } else if (targetButton.classList.contains('btn-restaurar')) {
            // Restaurando da lixeira (não precisa de confirmação)
            await atualizarStatusInscrito(inscritoId, false, callbackSucesso);
        } else if (targetButton.classList.contains('btn-deletar-permanente')) {
            // Abre o modal de confirmação para exclusão permanente
            const confirmado = await mostrarModalConfirmacaoDeletar(
                `Excluir Permanentemente`,
                `ATENÇÃO: Você está prestes a excluir permanentemente "${inscritoNome}". Esta ação não pode ser desfeita.`,
                `Sim, excluir permanentemente`
            );

            if (confirmado) {
                await deletarInscritoPermanentemente(inscritoId, callbackSucesso);
            }
        } else if (targetButton.classList.contains('btn-editar')) {
            const { data, error } = await supabase.from('cadastro_workshop').select('*').eq('id', inscritoId).single();
            if (error) {
                mostrarNotificacao('Erro ao buscar dados do inscrito para edição.', 'erro');
            } else {
                abrirModalEdicao(data);
            }
        } else if (targetButton.classList.contains('btn-duplicar')) {
            await iniciarDuplicacao(inscritoId);
        }
    });
}

async function atualizarStatusInscrito(id, isDeleted, callbackSucesso) {
    const { error } = await supabase
        .from('cadastro_workshop')
        .update({ is_deleted: isDeleted })
        .eq('id', id);

    if (error) {
        mostrarNotificacao('Ocorreu um erro ao atualizar o status do inscrito.', 'erro');
        console.error('Erro ao atualizar:', error);
    } else {
        const mensagem = isDeleted
            ? 'Inscrito movido para a lixeira com sucesso.'
            : 'Inscrito restaurado com sucesso.';

        mostrarNotificacao(mensagem, 'sucesso');
        callbackSucesso(); // Atualiza a UI buscando os dados novamente.
    }
}

async function deletarInscritoPermanentemente(id, callbackSucesso) {
    const { error } = await supabase
        .from('cadastro_workshop')
        .delete()
        .eq('id', id);

    if (error) {
        mostrarNotificacao('Ocorreu um erro ao excluir o inscrito permanentemente.', 'erro');
        console.error('Erro na exclusão permanente:', error);
    } else {
        mostrarNotificacao('Inscrito excluído permanentemente.', 'sucesso');
        callbackSucesso(); // Atualiza a UI buscando os dados novamente.
    }
}

/**
 * Duplica um inscrito, criando um novo registro com dados semelhantes.
 * @param {string} id - O ID do inscrito a ser duplicado.
 * @param {Function} callbackSucesso - Função a ser chamada após a duplicação.
 */
async function iniciarDuplicacao(id) {
    // 1. Busca os dados do inscrito original
    const { data: original, error: fetchError } = await supabase
        .from('cadastro_workshop')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError) {
        mostrarNotificacao('Erro ao buscar dados para duplicação.', 'erro');
        console.error('Erro na busca para duplicar:', fetchError);
        return;
    }

    // 2. Prepara o novo objeto, modificando nome e e-mail para evitar conflitos
    const novoInscrito = { ...original };
    delete novoInscrito.id; // Remove o ID antigo
    delete novoInscrito.created_at; // Deixa o Supabase gerar um novo timestamp

    // Ao duplicar, o nome completo será o mesmo do original.
    // O usuário deverá editá-lo no modal.
    novoInscrito.nome_completo = original.nome_completo;
    // Ao duplicar, o campo de nome virá em branco para ser preenchido.
    // Todos os outros dados são mantidos.
    novoInscrito.nome_completo = '';
    // Mantém o e-mail original para o usuário editar.

    // 3. Abre o modal de "Adicionar" com os dados pré-preenchidos
    abrirModalAdicionarComDados(novoInscrito);
}

/**
 * Exibe um modal para confirmar a exclusão de um inscrito.
 * @param {string} nomeInscrito - O nome do inscrito a ser exibido no modal.
 * @returns {Promise<boolean>} Retorna true se o usuário confirmar, false caso contrário.
 */
function mostrarModalConfirmacaoDeletar(titulo, mensagem, textoBotaoConfirmar) {
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
 * Preenche os cartões de métricas com os dados agregados.
 * @param {Array} inscritos - A lista de objetos de inscritos.
 */
function preencherMetricas(inscritos) {
    // Esta função agora pode ser usada para outras métricas estáticas no futuro.
    // A métrica "Total de Inscritos" foi movida para o card interativo de "Participantes".
}

/**
 * Configura o card interativo de Empresas.
 * @param {Array} inscritos - A lista de objetos de inscritos.
 */
function configurarCardEmpresasInterativo(inscritos) {
    const wrapper = document.getElementById('card-empresas-wrapper');
    const cards = [
        document.getElementById('card-empresas-total'),
        document.getElementById('card-empresas-mais-inscritos'),
        document.getElementById('card-empresas-menos-inscritos')
    ];
    const valores = [
        document.getElementById('card-empresas-total-valor'),
        document.getElementById('card-empresas-mais-inscritos-valor'),
        document.getElementById('card-empresas-menos-inscritos-valor')
    ];
    const indicators = wrapper ? wrapper.querySelectorAll('.indicator-dot') : [];

    if (!wrapper || cards.some(c => !c) || valores.some(v => !v) || indicators.length === 0) return;
    
    let isAnimating = false;
    let estadoAtual = 0; // 0: Total, 1: Mais inscritos, 2: Menos inscritos
    let autoRotateTimeout;
    const progressBar = wrapper.querySelector('.card-progress-bar');
    const autoRotateDelay = 10000;

    const preencherDados = () => {
        const empresasUnicas = new Set(inscritos.map(i => i.empresa).filter(Boolean));
        valores[0].textContent = empresasUnicas.size;

        const contagemEmpresas = inscritos.reduce((acc, { empresa }) => {
            if (empresa) acc[empresa] = (acc[empresa] || 0) + 1;
            return acc;
        }, {});

        const sortedEmpresas = Object.entries(contagemEmpresas).sort(([,a],[,b]) => b-a);

        const maisInscritos = sortedEmpresas.length > 0 ? sortedEmpresas[0][0] : 'N/A';
        valores[1].textContent = maisInscritos;

        const menosInscritos = sortedEmpresas.length > 0 ? sortedEmpresas[sortedEmpresas.length - 1][0] : 'N/A';
        valores[2].textContent = menosInscritos;
    };

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
    preencherDados();
    atualizarIndicadores();
    startProgressBar();
    autoRotateTimeout = setTimeout(avancarCard, autoRotateDelay);
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
        document.getElementById('card-adesao-receita')
    ];
    const valores = [
        document.getElementById('card-certificado-percent-valor'),
        document.getElementById('card-certificado-count-valor'),
        document.getElementById('card-certificado-receita-valor')
    ];
    const indicators = wrapper ? wrapper.querySelectorAll('.indicator-dot') : [];

    if (!wrapper || cards.some(c => !c) || valores.some(v => !v) || indicators.length === 0) return;

    let isAnimating = false;
    let estadoAtual = 0; // 0: Percentual, 1: Contagem, 2: Receita
    let autoRotateTimeout; // Variável para controlar o setTimeout
    const progressBar = wrapper.querySelector('.card-progress-bar');
    const autoRotateDelay = 10000; // 10 segundos

    // Função para preencher os dados nos dois cards
    const preencherDados = () => {
        const totalInscritos = inscritos.length;
        const comCertificado = inscritos.filter(i => i.quer_certificado).length;
        const taxa = totalInscritos > 0 ? (comCertificado / totalInscritos) * 100 : 0;
        const receita = comCertificado * 20;

        valores[0].textContent = `${taxa.toFixed(0)}%`;
        valores[1].textContent = comCertificado;
        valores[2].textContent = `R$ ${receita.toFixed(2).replace('.', ',')}`;
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
function configurarExportacaoCSV() {
    const exportBtn = document.getElementById('export-csv-btn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', () => gerarCSV(obterLinhasParaExportacao()));
}

/**
 * Gera e baixa um arquivo CSV com base nas linhas da tabela fornecidas.
 * @param {Element[]} linhasTabela 
 */
function gerarCSV(linhasTabela) {
        let csvContent = "";

        // Cabeçalho do CSV
        const headers = ["Nome Completo", "E-mail", "Telefone", "Empresa", "Município", "Dias"];
        csvContent += headers.join(";") + "\r\n";

        linhasTabela.forEach(linha => {
            const colunas = linha.querySelectorAll('td');
            const dadosLinha = Array.from(colunas).map(coluna => {
                // Limpa o texto e coloca entre aspas para evitar problemas com vírgulas
                let dado = coluna.innerText.replace(/"/g, '""');
                return `"${dado}"`; // Envolve em aspas
            });
            // Pula a primeira coluna (checkbox) e a última (ações)
            csvContent += dadosLinha.slice(1, -2).join(";") + "\r\n";
        });

        // Cria o link para download
        // Adiciona o BOM (\uFEFF) para garantir a compatibilidade com Excel
        const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\uFEFF' + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        
        // Define o nome do arquivo
        const dataAtual = new Date().toISOString().slice(0, 10);
        link.setAttribute("download", `inscritos_workshop_${dataAtual}.csv`);
        
        // Adiciona o link ao corpo, clica e remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
}

/**
 * Configura o botão para exportar os dados da tabela para um arquivo PDF.
 * Exporta apenas as linhas visíveis (respeitando o filtro).
 */
function configurarExportacaoPDF() {
    const exportBtn = document.getElementById('export-pdf-btn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', () => gerarPDF(obterLinhasParaExportacao()));
}

/**
 * Gera e baixa um arquivo PDF com a lista de inscritos.
 * @param {Element[]} linhasTabela 
 */
function gerarPDF(linhasTabela) {
    const { jsPDF } = window.jspdf; // Acessa o jsPDF do objeto global
        const doc = new jsPDF();
        const dataAtual = new Date().toLocaleDateString('pt-BR');

        // Define o cabeçalho do documento
        doc.setFontSize(18);
        doc.setTextColor('#062E51');
        doc.text("Lista de Inscritos - Workshop", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${dataAtual}`, 14, 28);

        // Prepara os dados para a autoTable
        const head = [["Nome Completo", "E-mail", "Telefone", "Empresa", "Município", "Dias"]];
        const body = [];

        linhasTabela.forEach(linha => {
            const colunas = linha.querySelectorAll('td');
            const dadosLinha = Array.from(colunas).slice(1, -2).map(c => c.innerText);
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

        doc.save(`inscritos_workshop_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Configura o botão para exportar uma lista de chamada (checklist) em PDF.
 */
function configurarExportacaoChecklist() {
    const exportBtn = document.getElementById('export-checklist-btn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', () => gerarChecklist(obterLinhasParaExportacao()));
}

/**
 * Gera e baixa um arquivo PDF formatado como lista de chamada.
 * @param {Element[]} linhasTabela 
 */
function gerarChecklist(linhasTabela) {
    const { jsPDF } = window.jspdf; // Acessa o jsPDF do objeto global
        const doc = new jsPDF();
        const dataAtual = new Date().toLocaleDateString('pt-BR');

        // Define o cabeçalho do documento
        doc.setFontSize(18);
        doc.setTextColor('#062E51');
        doc.text("Lista de Chamada - Workshop", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${dataAtual}`, 14, 28);

        // Prepara os dados para a autoTable
        const head = [['#', 'Nome Completo', 'Empresa / Instituição', 'Assinatura']];
        const body = [];

        let contador = 1;
        linhasTabela.forEach(linha => {
            const colunas = linha.querySelectorAll('td');
            const nome = colunas[1] ? colunas[1].innerText : '';
            const empresa = colunas[4] ? colunas[4].innerText : '';
            
            body.push([contador, nome, empresa, '']); // Adiciona uma coluna vazia para assinatura
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
                3: { cellWidth: 50 }, // Aumenta a largura da coluna "Assinatura"
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

        doc.save(`lista_chamada_workshop_${new Date().toISOString().slice(0, 10)}.pdf`);
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
    const deleteBtn = document.getElementById('delete-duplicates-btn');
    if (!deleteBtn) return;

    deleteBtn.addEventListener('click', async () => {
        // Busca os dados mais recentes para garantir que estamos trabalhando com a lista atual.
        const todosInscritos = await buscarInscritos();
        if (!todosInscritos) {
            mostrarNotificacao('Não foi possível buscar os inscritos para verificar duplicados.', 'erro');
            return;
        }

        // 1. Agrupa inscritos por nome completo (ignorando maiúsculas/minúsculas)
        const inscritosPorNome = todosInscritos.reduce((acc, inscrito) => {
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
        const confirmado = await mostrarModalConfirmacaoDeletar(
            `Excluir ${idsParaDeletar.length} Duplicados`,
            `Foram encontrados ${idsParaDeletar.length} inscritos duplicados (baseado no nome completo). Deseja mover os registros mais antigos para a lixeira, mantendo apenas o mais recente de cada?`,
            `Sim, mover para lixeira`
        );

        // 4. Executa a exclusão (movendo para a lixeira)
        if (confirmado) {
            const { error } = await supabase.from('cadastro_workshop').update({ is_deleted: true }).in('id', idsParaDeletar);
            if (error) {
                mostrarNotificacao('Ocorreu um erro ao excluir os duplicados.', 'erro');
            } else {
                mostrarNotificacao(`${idsParaDeletar.length} registro(s) duplicado(s) movido(s) para a lixeira.`, 'sucesso');
                // Atualiza a UI para refletir a mudança
                document.location.reload(); // A forma mais simples de garantir que tudo seja recarregado
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

// Inicia a execução do script da página.
document.addEventListener('DOMContentLoaded', inicializarPainelAdministrativo);

/**
 * Formata uma string para o formato "Título", tratando preposições comuns em português.
 * Ex: "JOÃO DA SILVA" -> "João da Silva".
 * @param {string} str A string para formatar.
 * @returns {string} A string formatada.
 */
function formatarParaTitulo(str) {
    if (!str) return '';
    // Capitaliza a primeira letra de TODAS as palavras.
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Configura o modal para adicionar um novo inscrito manualmente.
 * @param {Function} callbackSucesso - Função a ser chamada após adicionar com sucesso.
 */
function configurarModalAdicionarInscrito(callbackSucesso) {
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
            email: formData.get('email').toLowerCase(),
            empresa: formatarParaTitulo(formData.get('empresa')),
            telefone: formData.get('telefone'),
            municipio: formatarParaTitulo(formData.get('municipio')),
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

        const { error } = await supabase.from('cadastro_workshop').insert([novoInscrito]);

        if (error) {
            mostrarNotificacao(error.code === '23505' ? 'Este e-mail já está cadastrado.' : 'Ocorreu um erro ao salvar.', 'erro');
            console.error('Erro ao adicionar inscrito:', error);
            return false;
        } else {
            mostrarNotificacao('Novo inscrito adicionado com sucesso!', 'sucesso');
            callbackSucesso();
            return true;
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
    form.elements['email'].value = dados.email;
    form.elements['empresa'].value = dados.empresa;
    form.elements['telefone'].value = dados.telefone;
    form.elements['municipio'].value = dados.municipio;
    form.elements['dia13'].checked = dados.participa_dia_13;
    form.elements['dia14'].checked = dados.participa_dia_14;

    tituloModal.textContent = 'Duplicar Inscrito';
    modal.classList.replace('hidden', 'flex');
}

/**
 * Configura o modal para editar um inscrito existente.
 * @param {Function} callbackSucesso - Função a ser chamada após editar com sucesso.
 */
function configurarModalEditarInscrito(callbackSucesso) {
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
            email: formData.get('email').toLowerCase(),
            empresa: formatarParaTitulo(formData.get('empresa')),
            telefone: formData.get('telefone'),
            municipio: formatarParaTitulo(formData.get('municipio')),
            participa_dia_13: formData.has('dia13'),
            participa_dia_14: formData.has('dia14'),
        };

        const { error } = await supabase.from('cadastro_workshop').update(dadosAtualizados).eq('id', id);

        if (error) {
            mostrarNotificacao('Ocorreu um erro ao salvar as alterações.', 'erro');
            console.error('Erro ao editar inscrito:', error);
        } else {
            esconderModal();
            mostrarNotificacao('Inscrito atualizado com sucesso!', 'sucesso');
            callbackSucesso();
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
    form.elements['email'].value = inscrito.email;
    form.elements['empresa'].value = inscrito.empresa;
    form.elements['telefone'].value = inscrito.telefone;
    form.elements['municipio'].value = inscrito.municipio;
    form.elements['dia13'].checked = inscrito.participa_dia_13;
    form.elements['dia14'].checked = inscrito.participa_dia_14;

    // Exibe o modal
    modal.classList.replace('hidden', 'flex');
}