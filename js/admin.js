/**
 * @file Gerencia a página do painel administrativo.
 * @description Protege a página, busca e exibe a lista de inscritos, e gerencia o logout.
 */

import { supabase } from './supabaseClient.js';
import { configurarControlesAcessibilidade } from './acessibilidade.js';

/**
 * Função principal que inicializa o painel de administração.
 */
async function inicializarPainelAdmin() {
    // Variáveis de estado para controlar a visualização
    let todosInscritos = [];
    let mostrandoLixeira = false;

    // 1. Proteger a Rota: Verifica se o usuário está logado
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // Se não houver sessão, redireciona para a página inicial
        alert('Acesso negado. Por favor, faça o login como administrador.');
        window.location.replace('/index.html');
        return; // Interrompe a execução
    }

    // Se chegou aqui, o usuário está logado.
    const adminEmailEl = document.getElementById('admin-email');
    if (adminEmailEl) {
        adminEmailEl.textContent = session.user.email;
    }

    // 2. Buscar todos os inscritos (ativos e na lixeira)
    todosInscritos = await buscarInscritos();

    if (todosInscritos) {
        // Inicialmente, renderiza apenas os ativos
        renderizarVisualizacao();

        configurarFiltroDeBusca();
        configurarOrdenacaoTabela(todosInscritos, renderizarVisualizacao);
        configurarAcoesTabela();
        configurarExportacaoCSV();
        preencherMetricas(todosInscritos.filter(i => !i.is_deleted)); // Métricas apenas com ativos
        configurarCardParticipantesInterativo(todosInscritos.filter(i => !i.is_deleted));
        configurarExportacaoPDF();
        configurarExportacaoChecklist();
        configurarControlesAcessibilidade();
        configurarModalAdicionarInscrito();
        criarGraficos(todosInscritos.filter(i => !i.is_deleted));
    } else {
        const corpoTabela = document.getElementById('lista-inscritos');
        corpoTabela.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-red-500">Falha ao carregar dados.</td></tr>`;
    }

    // 3. Configurar o Botão de Logout
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            // O onAuthStateChange na página principal cuidará do resto,
            // mas garantimos o redirecionamento.
            window.location.replace('/index.html');
        });
    }

    // Configura o interruptor (toggle switch) da lixeira
    const toggleSwitch = document.getElementById('view-toggle-switch');
    if (toggleSwitch) {
        toggleSwitch.addEventListener('click', () => {
            mostrandoLixeira = !mostrandoLixeira;
            
            // Atualiza a aparência do interruptor
            const thumb = document.getElementById('toggle-thumb');
            const labelAtivos = document.getElementById('toggle-label-ativos');
            const labelLixeira = document.getElementById('toggle-label-lixeira');

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
        });
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
        console.error('Erro ao buscar inscritos:', error);
        return null;
    }
    return inscritos;
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
        corpoTabela.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">Nenhum inscrito encontrado.</td></tr>`;
        return;
    }

    const linhasHtml = inscritos.map(inscrito => {
        const dias = `${inscrito.participa_dia_13 ? '13' : ''}${inscrito.participa_dia_13 && inscrito.participa_dia_14 ? ', ' : ''}${inscrito.participa_dia_14 ? '14' : ''}`;
        const botaoAcao = naLixeira
            ? `<div class="flex gap-2">
                   <button class="btn-restaurar text-green-600 hover:text-green-800 transition-colors" data-id="${inscrito.id}" title="Restaurar inscrito">
                       <span class="material-symbols-outlined">restore_from_trash</span>
                   </button>
                   <button class="btn-deletar-permanente text-red-600 hover:text-red-800 transition-colors" data-id="${inscrito.id}" data-nome="${inscrito.nome_completo}" title="Excluir permanentemente">
                       <span class="material-symbols-outlined">delete_forever</span>
                   </button>
               </div>`
            : `<button class="btn-mover-lixeira text-gray-500 hover:text-red-600 transition-colors" data-id="${inscrito.id}" data-nome="${inscrito.nome_completo}" title="Mover para a lixeira">
                   <span class="material-symbols-outlined">archive</span>
               </button>`;

        return `
            <tr>
                <td class="whitespace-nowrap font-medium">${inscrito.nome_completo}</td>
                <td class="whitespace-nowrap">${inscrito.email}</td>
                <td class="whitespace-nowrap">${inscrito.telefone}</td>
                <td class="whitespace-nowrap">${inscrito.empresa}</td>
                <td class="whitespace-nowrap">${inscrito.municipio}</td>
                <td class="whitespace-nowrap">${dias}</td>
                <td class="whitespace-nowrap">
                    ${botaoAcao}
                </td>
            </tr>
        `;
    }).join('');

    corpoTabela.innerHTML = linhasHtml;
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
            'nome': 0,
            'email': 1,
            'telefone': 2,
            'empresa': 3,
            'municipio': 4,
            'dias': 5
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
 * Configura os ouvintes de eventos para as ações da tabela (ex: deletar).
 */
function configurarAcoesTabela() {
    const corpoTabela = document.getElementById('lista-inscritos');
    if (!corpoTabela) return;

    corpoTabela.addEventListener('click', async (e) => {
        const targetButton = e.target.closest('.btn-mover-lixeira, .btn-restaurar, .btn-deletar-permanente');
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
                await atualizarStatusInscrito(inscritoId, true);
            }
        } else if (targetButton.classList.contains('btn-restaurar')) {
            // Restaurando da lixeira (não precisa de confirmação)
            await atualizarStatusInscrito(inscritoId, false);
        } else if (targetButton.classList.contains('btn-deletar-permanente')) {
            // Abre o modal de confirmação para exclusão permanente
            const confirmado = await mostrarModalConfirmacaoDeletar(
                `Excluir Permanentemente`,
                `ATENÇÃO: Você está prestes a excluir permanentemente "${inscritoNome}". Esta ação não pode ser desfeita.`,
                `Sim, excluir permanentemente`
            );

            if (confirmado) {
                await deletarInscritoPermanentemente(inscritoId);
            }
        }
    });
}

async function atualizarStatusInscrito(id, isDeleted) {
    const { error } = await supabase
        .from('cadastro_workshop')
        .update({ is_deleted: isDeleted })
        .eq('id', id);

    if (error) {
        await mostrarModalErro('Ocorreu um erro ao atualizar o status do inscrito.');
        console.error('Erro ao atualizar:', error);
    } else {
        // Recarrega a página para atualizar tudo de forma simples e garantida.
        location.reload();
    }
}

async function deletarInscritoPermanentemente(id) {
    const { error } = await supabase
        .from('cadastro_workshop')
        .delete()
        .eq('id', id);

    if (error) {
        await mostrarModalErro('Ocorreu um erro ao excluir o inscrito permanentemente.');
        console.error('Erro na exclusão permanente:', error);
    } else {
        // Recarrega a página para atualizar tudo
        location.reload();
    }
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
    const totalInscritosEl = document.getElementById('total-inscritos');
    const totalMunicipiosEl = document.getElementById('total-municipios');
    const taxaCertificadoEl = document.getElementById('taxa-certificado');

    const totalInscritos = inscritos.length;

    if (totalInscritosEl) {
        totalInscritosEl.textContent = totalInscritos;
    }

    if (totalMunicipiosEl) {
        const municipiosUnicos = new Set(inscritos.map(i => i.municipio).filter(Boolean));
        totalMunicipiosEl.textContent = municipiosUnicos.size;
    }

    if (taxaCertificadoEl) {
        const comCertificado = inscritos.filter(i => i.quer_certificado).length;
        const taxa = totalInscritos > 0 ? (comCertificado / totalInscritos) * 100 : 0;
        taxaCertificadoEl.textContent = `${taxa.toFixed(0)}%`;
    }
}

/**
 * Configura o card interativo que alterna a visualização de participantes por dia.
 * @param {Array} inscritos - A lista de objetos de inscritos.
 */
function configurarCardParticipantesInterativo(inscritos) {
    const card = document.getElementById('card-participantes-dia');
    const tituloEl = document.getElementById('card-participantes-titulo');
    const valorEl = document.getElementById('card-participantes-valor');
    const iconEl = document.getElementById('card-participantes-icon');
    if (!card || !tituloEl || !valorEl || !iconEl) return;
    
    const estados = [
        {
            titulo: 'Participantes Dia 13',
            filtro: (i) => i.participa_dia_13,
            icon: 'today', // Ícone para o dia 13
            cardColor: 'bg-orange-500' // Cor principal do card
        },
        {
            titulo: 'Participantes Dia 14',
            filtro: (i) => i.participa_dia_14,
            icon: 'event',
            cardColor: 'bg-teal-500'
        },
        {
            titulo: 'Participam de Ambos',
            filtro: (i) => i.participa_dia_13 && i.participa_dia_14,
            icon: 'calendar_month',
            cardColor: 'bg-indigo-500'
        }
    ];

    let estadoAtual = 0;

    const atualizarCard = () => {
        const estado = estados[estadoAtual];
        const contagem = inscritos.filter(estado.filtro).length;

        tituloEl.innerHTML = `${estado.titulo} <span class="material-symbols-outlined text-base ml-1 opacity-70">sync_alt</span>`;
        valorEl.textContent = contagem; 
        iconEl.textContent = estado.icon;

        // Remove classes de cor antigas e adiciona as novas
        card.className = `text-white p-6 rounded-lg shadow-lg flex items-center gap-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${estado.cardColor}`;
    };

    card.addEventListener('click', () => {
        estadoAtual = (estadoAtual + 1) % estados.length;
        atualizarCard();
    });
    atualizarCard();
}

/**
 * Configura o botão para exportar os dados da tabela para um arquivo CSV.
 * Exporta apenas as linhas visíveis (respeitando o filtro).
 */
function configurarExportacaoCSV() {
    const exportBtn = document.getElementById('export-csv-btn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', () => {
        const linhasTabela = document.querySelectorAll('#lista-inscritos tr');
        let csvContent = "";

        // Cabeçalho do CSV
        const headers = ["Nome Completo", "E-mail", "Telefone", "Empresa", "Município", "Dias de Participação"];
        csvContent += headers.join(";") + "\r\n";

        linhasTabela.forEach(linha => {
            // Verifica se a linha está visível
            if (linha.style.display === 'none') return;

            const colunas = linha.querySelectorAll('td');
            const dadosLinha = Array.from(colunas).map(coluna => {
                // Limpa o texto e coloca entre aspas para evitar problemas com vírgulas
                let dado = coluna.innerText.replace(/"/g, '""');
                return `"${dado}"`;
            });
            csvContent += dadosLinha.join(";") + "\r\n";
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
    });
}

/**
 * Configura o botão para exportar os dados da tabela para um arquivo PDF.
 * Exporta apenas as linhas visíveis (respeitando o filtro).
 */
function configurarExportacaoPDF() {
    const exportBtn = document.getElementById('export-pdf-btn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
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

        const linhasTabela = document.querySelectorAll('#lista-inscritos tr');
        let contador = 1;
        linhasTabela.forEach(linha => {
            if (linha.style.display === 'none') return; // Pula linhas escondidas pelo filtro

            const colunas = linha.querySelectorAll('td');
            const dadosLinha = Array.from(colunas).slice(0, 6).map(coluna => coluna.innerText); // Pega os dados das 6 primeiras colunas
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
    });
}

/**
 * Configura o botão para exportar uma lista de chamada (checklist) em PDF.
 */
function configurarExportacaoChecklist() {
    const exportBtn = document.getElementById('export-checklist-btn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
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

        const linhasTabela = document.querySelectorAll('#lista-inscritos tr');
        let contador = 1;
        linhasTabela.forEach(linha => {
            if (linha.style.display === 'none') return; // Pula linhas escondidas pelo filtro

            const colunas = linha.querySelectorAll('td');
            const nome = colunas[0] ? colunas[0].innerText : '';
            const empresa = colunas[3] ? colunas[3].innerText : '';
            
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
    });
}

/**
 * Cria os gráficos de estatísticas com base nos dados dos inscritos.
 * @param {Array} inscritos - A lista de objetos de inscritos.
 */
function criarGraficos(inscritos) {
    // 1. Gráfico de Participação por Dia
    const ctxDias = document.getElementById('grafico-dias');
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
                    label: 'Participantes',
                    data: [contagemDias.dia13, contagemDias.dia14, contagemDias.ambos],
                    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // 2. Gráfico de Top 5 Municípios
    const ctxMunicipios = document.getElementById('grafico-municipios');
    if (ctxMunicipios) {
        const contagemMunicipios = inscritos.reduce((acc, { municipio }) => {
            if (municipio) {
                acc[municipio] = (acc[municipio] || 0) + 1;
            }
            return acc;
        }, {});

        const top5 = Object.entries(contagemMunicipios).sort(([,a],[,b]) => b-a).slice(0, 5);

        new Chart(ctxMunicipios, {
            type: 'bar',
            data: {
                labels: top5.map(([municipio]) => municipio),
                datasets: [{
                    label: 'Nº de Inscritos',
                    data: top5.map(([, count]) => count),
                    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' }
        });
    }
}

// Inicia a execução do script da página.
document.addEventListener('DOMContentLoaded', inicializarPainelAdmin);

/**
 * Configura o modal para adicionar um novo inscrito manualmente.
 */
function configurarModalAdicionarInscrito() {
    const openBtn = document.getElementById('add-inscrito-btn');
    const modal = document.getElementById('add-inscrito-modal');
    const form = document.getElementById('add-inscrito-form');
    const closeBtn = document.getElementById('add-modal-close-btn');
    const cancelBtn = document.getElementById('add-modal-cancel-btn');

    if (!openBtn || !modal || !form || !closeBtn || !cancelBtn) return;

    const showModal = () => modal.classList.replace('hidden', 'flex');
    const hideModal = () => modal.classList.replace('flex', 'hidden');

    openBtn.addEventListener('click', showModal);
    closeBtn.addEventListener('click', hideModal);
    cancelBtn.addEventListener('click', hideModal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        const formData = new FormData(form);
        const novoInscrito = {
            nome_completo: formData.get('nome'),
            email: formData.get('email'),
            empresa: formData.get('empresa'),
            telefone: formData.get('telefone'),
            municipio: formData.get('municipio'),
            participa_dia_13: formData.has('dia13'),
            participa_dia_14: formData.has('dia14'),
            is_deleted: false, // Garante que o novo inscrito seja ativo
            concorda_comunicacoes: true, // Assume consentimento para cadastro manual
            quer_certificado: false,
            status_pagamento: 'nao_solicitado'
        };

        // Validação simples
        if (!novoInscrito.nome_completo || !novoInscrito.email || !novoInscrito.empresa || !novoInscrito.municipio) {
            await mostrarModalErro('Por favor, preencha todos os campos obrigatórios (*).');
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Inscrito';
            return;
        }

        const { error } = await supabase.from('cadastro_workshop').insert([novoInscrito]);

        if (error) {
            await mostrarModalErro(error.code === '23505' ? 'Este e-mail já está cadastrado.' : 'Ocorreu um erro ao salvar.');
            console.error('Erro ao adicionar inscrito:', error);
        } else {
            hideModal();
            await mostrarModalSucesso('Sucesso!', 'Novo inscrito adicionado.');
            document.getElementById('success-btn-close').addEventListener('click', () => location.reload(), { once: true });
        }

        submitButton.disabled = false;
        submitButton.textContent = 'Salvar Inscrito';
    });
}