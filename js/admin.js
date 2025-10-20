/**
 * @file Gerencia a página do painel administrativo.
 * @description Protege a página, busca e exibe a lista de inscritos, e gerencia o logout.
 */

import { supabase } from './supabaseClient.js';

/**
 * Função principal que inicializa o painel de administração.
 */
async function inicializarPainelAdmin() {
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

    // 2. Buscar e Exibir os Inscritos
    const inscritos = await buscarInscritos();
    if (inscritos) {
        renderizarTabela(inscritos);
        configurarFiltroDeBusca();
        configurarOrdenacaoTabela(inscritos);
        configurarExportacaoCSV();
        preencherMetricas(inscritos);
        configurarCardParticipantesInterativo(inscritos);
        configurarExportacaoPDF();
        criarGraficos(inscritos);
    } else {
        const corpoTabela = document.getElementById('lista-inscritos');
        corpoTabela.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Falha ao carregar dados.</td></tr>`;
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
}

/**
 * Busca os dados da tabela 'cadastro_workshop' no Supabase.
 * @returns {Promise<Array|null>} Uma lista de inscritos ou null em caso de erro.
 */
async function buscarInscritos() {
    // Busca todos os inscritos, ordenando pelo nome
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
 * @param {Array} inscritos - A lista de objetos de inscritos.
 */
function renderizarTabela(inscritos) {
    const corpoTabela = document.getElementById('lista-inscritos');
    if (!corpoTabela) return;

    if (inscritos.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Nenhum inscrito encontrado.</td></tr>`;
        return;
    }

    const linhasHtml = inscritos.map(inscrito => {
        const dias = `${inscrito.participa_dia_13 ? '13' : ''}${inscrito.participa_dia_13 && inscrito.participa_dia_14 ? ', ' : ''}${inscrito.participa_dia_14 ? '14' : ''}`;
        return `
            <tr>
                <td class="whitespace-nowrap font-medium">${inscrito.nome_completo}</td>
                <td class="whitespace-nowrap">${inscrito.email}</td>
                <td class="whitespace-nowrap">${inscrito.telefone}</td>
                <td class="whitespace-nowrap">${inscrito.empresa}</td>
                <td class="whitespace-nowrap">${inscrito.municipio}</td>
                <td class="whitespace-nowrap">${dias}</td>
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
 * @param {Array} inscritos - A lista original e completa de inscritos.
 */
function configurarOrdenacaoTabela(inscritos) {
    const headers = document.querySelectorAll('.admin-table th[data-column]');
    let colunaOrdenadaAtual = 'nome_completo';
    let direcaoOrdenacaoAtual = 'asc';

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const colunaSelecionada = header.dataset.column;

            if (colunaSelecionada === colunaOrdenadaAtual) {
                // Inverte a direção se a mesma coluna for clicada
                direcaoOrdenacaoAtual = direcaoOrdenacaoAtual === 'asc' ? 'desc' : 'asc';
            } else {
                // Define a nova coluna e reseta a direção para ascendente
                colunaOrdenadaAtual = colunaSelecionada;
                direcaoOrdenacaoAtual = 'asc';
            }

            // Cria uma cópia do array para não modificar o original
            const inscritosOrdenados = [...inscritos];

            inscritosOrdenados.sort((a, b) => {
                let valorA = a[colunaSelecionada];
                let valorB = b[colunaSelecionada];

                // Tratamento especial para a coluna 'dias'
                if (colunaSelecionada === 'dias') {
                    valorA = `${a.participa_dia_13 ? '13' : ''}${a.participa_dia_13 && a.participa_dia_14 ? ', ' : ''}${a.participa_dia_14 ? '14' : ''}`;
                    valorB = `${b.participa_dia_13 ? '13' : ''}${b.participa_dia_13 && b.participa_dia_14 ? ', ' : ''}${b.participa_dia_14 ? '14' : ''}`;
                }

                // Garante que valores nulos ou indefinidos fiquem no final
                if (valorA == null) return 1;
                if (valorB == null) return -1;

                // Comparação usando localeCompare para ordenação alfabética correta
                const comparacao = String(valorA).localeCompare(String(valorB), 'pt-BR', { sensitivity: 'base' });

                return direcaoOrdenacaoAtual === 'asc' ? comparacao : -comparacao;
            });

            // Re-renderiza a tabela com os dados ordenados
            renderizarTabela(inscritosOrdenados);
            atualizarIconesOrdenacao(headers, colunaSelecionada, direcaoOrdenacaoAtual);
        });
    });
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
    const iconBgEl = document.getElementById('card-participantes-icon-bg');

    if (!card || !tituloEl || !valorEl || !iconEl || !iconBgEl) return;

    const estados = [
        {
            titulo: 'Participantes Dia 13',
            filtro: (i) => i.participa_dia_13,
            icon: 'today',
            bgColor: 'bg-orange-100',
            iconColor: 'text-orange-600'
        },
        {
            titulo: 'Participantes Dia 14',
            filtro: (i) => i.participa_dia_14,
            icon: 'event',
            bgColor: 'bg-teal-100',
            iconColor: 'text-teal-600'
        },
        {
            titulo: 'Participam de Ambos',
            filtro: (i) => i.participa_dia_13 && i.participa_dia_14,
            icon: 'calendar_month',
            bgColor: 'bg-indigo-100',
            iconColor: 'text-indigo-600'
        }
    ];

    let estadoAtual = 0;

    const atualizarCard = () => {
        const estado = estados[estadoAtual];
        const contagem = inscritos.filter(estado.filtro).length;

        tituloEl.innerHTML = `${estado.titulo} <span class="material-symbols-outlined text-base ml-1 text-gray-400">sync_alt</span>`;
        valorEl.textContent = contagem;
        iconEl.textContent = estado.icon;

        // Remove classes de cor antigas e adiciona as novas
        iconBgEl.className = `p-3 rounded-full transition-colors ${estado.bgColor}`;
        iconEl.className = `material-symbols-outlined text-3xl transition-colors ${estado.iconColor}`;
    };

    card.addEventListener('click', () => {
        estadoAtual = (estadoAtual + 1) % estados.length;
        atualizarCard();
    });

    // Inicializa o card com o primeiro estado
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
        let csvContent = "data:text/csv;charset=utf-8,";

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
        const encodedUri = encodeURI(csvContent);
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

        // Define o cabeçalho do documento
        doc.setFontSize(18);
        doc.setTextColor('#062E51');
        doc.text("Lista de Inscritos - Workshop", 14, 22);

        // Prepara os dados para a autoTable
        const head = [["Nome Completo", "E-mail", "Telefone", "Empresa", "Município", "Dias"]];
        const body = [];

        const linhasTabela = document.querySelectorAll('#lista-inscritos tr');
        linhasTabela.forEach(linha => {
            if (linha.style.display === 'none') return; // Pula linhas escondidas pelo filtro

            const colunas = linha.querySelectorAll('td');
            const dadosLinha = Array.from(colunas).map(coluna => coluna.innerText);
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

        const dataAtual = new Date().toISOString().slice(0, 10);
        doc.save(`inscritos_workshop_${dataAtual}.pdf`);
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
                    backgroundColor: '#062E51',
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' }
        });
    }
}

// Inicia a execução do script da página.
document.addEventListener('DOMContentLoaded', inicializarPainelAdmin);