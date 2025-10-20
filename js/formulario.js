/**
 * @file Gerencia todas as funcionalidades relacionadas ao formulário de inscrição.
 */

// Configuração da conexão com o Supabase
const SUPABASE_URL = 'https://onqettyqcdyutkticrab.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucWV0dHlxY2R5dXRrdGljcmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Njg5OTksImV4cCI6MjA3NjI0NDk5OX0.LZJhIX3f0Jd3TxVo-YGHBVpiejLimGo-ClACeipilqc';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function exibirMensagem(mensagem, tipo) {
    const mensagensForm = document.getElementById('form-messages');
    if (!mensagensForm) return;
    const elementoMensagem = document.createElement('p');
    elementoMensagem.textContent = mensagem;
    elementoMensagem.className = tipo === 'error' ? 'form-message-error' : 'form-message-success';
    mensagensForm.innerHTML = ''; // Limpa mensagens anteriores antes de adicionar uma nova
    mensagensForm.appendChild(elementoMensagem);
}

function validarEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validarTelefone(telefone) {
    const apenasDigitos = telefone.replace(/\D/g, '');
    return /^\d{10,11}$/.test(apenasDigitos);
}

/**
 * Configura a validação e o envio do formulário de inscrição para o Supabase.
 */
export function configurarValidacaoFormulario() {
    const form = document.getElementById('lead-form');
    const mensagensForm = document.getElementById('form-messages');
    const botaoSubmit = form ? form.querySelector('button[type="submit"]') : null;

    if (!form || !mensagensForm || !botaoSubmit) return;

    // --- Validação em Tempo Real ---
    const camposParaValidar = ['nome', 'empresa', 'email', 'telefone', 'municipio'];
    camposParaValidar.forEach(nomeCampo => {
        const input = form.elements[nomeCampo];
        if (input) {
            input.addEventListener('blur', () => validarCampo(input));
        }
    });

    ['dia13', 'dia14'].forEach(idDia => {
        const checkbox = document.getElementById(idDia);
        if (checkbox) {
            checkbox.addEventListener('change', () => validarGrupoDias());
        }
    });

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        mensagensForm.innerHTML = ''; // Limpa mensagens anteriores
        botaoSubmit.disabled = true;
        botaoSubmit.textContent = 'Enviando...';

        const nome = form.elements['nome'].value.trim();
        const empresa = form.elements['empresa'].value.trim();
        const email = form.elements['email'].value.trim();
        const telefone = form.elements['telefone'].value.trim();
        const municipio = form.elements['municipio'].value.trim();
        const consentimento = form.elements['consent'].checked;
        const participaDia13 = form.elements['dia13'].checked;
        const participaDia14 = form.elements['dia14'].checked;

        // --- Lógica de Validação Aprimorada ---
        let isFormValid = true;
        // Reseta todos os erros e sucessos visuais antes de validar novamente
        form.querySelectorAll('.form-group, .days-selection-group').forEach(el => {
            el.classList.remove('error');
            el.classList.remove('success');
        });

        // Valida campo Nome (obrigatório)
        const nomeGroup = form.elements['nome'].closest('.form-group');
        if (nome) {
            nomeGroup.classList.add('success');
        } else {
            nomeGroup.classList.add('error');
            isFormValid = false;
        }

        // Valida campo Empresa (obrigatório)
        const empresaGroup = form.elements['empresa'].closest('.form-group');
        if (empresa) {
            empresaGroup.classList.add('success');
        } else {
            empresaGroup.classList.add('error');
            isFormValid = false;
        }

        // Valida campo E-mail (obrigatório e formato válido)
        const emailGroup = form.elements['email'].closest('.form-group');
        if (email && validarEmail(email)) {
            emailGroup.classList.add('success');
        } else {
            emailGroup.classList.add('error');
            isFormValid = false;
        }

        // Valida campo Telefone (obrigatório e formato válido)
        const telefoneGroup = form.elements['telefone'].closest('.form-group');
        if (telefone && validarTelefone(telefone)) {
            telefoneGroup.classList.add('success');
        } else {
            telefoneGroup.classList.add('error');
            isFormValid = false;
        }

        // Valida campo Município (obrigatório)
        const municipioGroup = form.elements['municipio'].closest('.form-group');
        if (municipio) {
            municipioGroup.classList.add('success');
        } else {
            municipioGroup.classList.add('error');
            isFormValid = false;
        }

        // Validações sem feedback visual direto no campo, mas que invalidam o formulário
        const daysGroup = form.querySelector('.days-selection-group');
        if (!participaDia13 && !participaDia14) {
            if (daysGroup) daysGroup.classList.add('error');
            isFormValid = false;
        }
        if (!consentimento) {
            isFormValid = false;
        }

        // Se algum campo for inválido, mostra o modal e para a execução.
        if (!isFormValid) {
            await mostrarModalErro('Por favor, corrija os campos destacados em vermelho.');
            botaoSubmit.disabled = false;
            botaoSubmit.textContent = 'Inscrever-se Agora';
            return;
        }
        // --- Fim da Lógica de Validação Aprimorada ---

        // Envio para o Supabase
        const { data, error } = await supabaseClient
            .from('cadastro_workshop')
            .insert([{
                nome_completo: nome,
                empresa: empresa,
                email: email,
                telefone: telefone,
                municipio: municipio,
                participa_dia_13: participaDia13,
                participa_dia_14: participaDia14,
                concorda_comunicacoes: consentimento,
                quer_certificado: false,
                status_pagamento: 'nao_solicitado'
            }])
            .select();

        if (error) {
            console.error('Objeto completo do erro do Supabase:', error);
            if (error.code === '23505') { // Código de violação de chave única (e-mail duplicado)
                await mostrarModalErro('Este e-mail já foi cadastrado. Por favor, utilize outro.');
            } else {
                await mostrarModalErro('Ocorreu um erro inesperado na inscrição. Por favor, tente novamente.');
            }
            botaoSubmit.disabled = false;
            botaoSubmit.textContent = 'Inscrever-se Agora';
        } else {
            mostrarFeedbackSucessoTopo();
            form.reset();

            const idNovoRegistro = data ? data[0].id : null;
            mostrarModalCertificado(idNovoRegistro);

            setTimeout(() => {
                botaoSubmit.disabled = false;
                botaoSubmit.textContent = 'Inscrever-se Agora';
            }, 3000);
        }
    });

    async function mostrarModalCertificado(idRegistro) {
        const modal = document.getElementById('certificate-modal');
        const botaoSim = document.getElementById('cert-btn-yes');
        const botaoNao = document.getElementById('cert-btn-no');

        if (!modal || !botaoSim || !botaoNao) return;

        modal.classList.remove('hidden');
        modal.classList.add('flex');

        const fecharModal = () => modal.classList.add('hidden');

        // Usamos .cloneNode e .replaceWith para garantir que os listeners antigos sejam removidos.
        const novoBotaoSim = botaoSim.cloneNode(true);
        botaoSim.parentNode.replaceChild(novoBotaoSim, botaoSim);

        const novoBotaoNao = botaoNao.cloneNode(true);
        botaoNao.parentNode.replaceChild(novoBotaoNao, botaoNao);

        novoBotaoSim.onclick = async () => {
            if (idRegistro) {
                await supabaseClient
                    .from('cadastro_workshop')
                    .update({ quer_certificado: true, status_pagamento: 'pendente' })
                    .eq('id', idRegistro);
            }
            window.open('https://www.asaas.com/c/p9v42o92yos25x75', '_blank');
            fecharModal();
        };

        novoBotaoNao.onclick = fecharModal;
    }

    async function mostrarModalErro(mensagem) {
        const modal = document.getElementById('error-modal');
        const mensagemEl = document.getElementById('error-modal-message');
        const botaoFechar = document.getElementById('error-btn-close');

        if (!modal || !mensagemEl || !botaoFechar) return;

        mensagemEl.textContent = mensagem;
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        const fecharModal = () => modal.classList.add('hidden');

        // Garante que o listener de clique seja sempre novo
        const novoBotaoFechar = botaoFechar.cloneNode(true);
        botaoFechar.parentNode.replaceChild(novoBotaoFechar, botaoFechar);
        novoBotaoFechar.onclick = fecharModal;
    }

    function mostrarFeedbackSucessoTopo() {
        const topBar = document.getElementById('top-bar');
        const title = topBar.querySelector('.top-bar-title');
        const countdown = topBar.querySelector('#countdown-timer');
        const subtitle = topBar.querySelector('.top-bar-subtitle');

        if (!topBar || !title || !countdown || !subtitle) return;

        // Aplica o estado de sucesso permanentemente na sessão atual
        topBar.style.background = 'linear-gradient(to right, #16A34A, #15803D, #16A34A)'; // Gradiente verde
        subtitle.textContent = 'INSCRIÇÃO CONFIRMADA COM SUCESSO!';
        subtitle.style.fontWeight = 'bold';
    }

    function validarCampo(input) {
        const grupo = input.closest('.form-group');
        if (!grupo) return true;

        let ehValido = false;
        const valor = input.value.trim();

        switch (input.name) {
            case 'email':
                ehValido = valor && validarEmail(valor);
                break;
            case 'telefone':
                ehValido = valor && validarTelefone(valor);
                break;
            default: // Para nome, empresa, municipio
                ehValido = !!valor; // Verifica se não está vazio
        }

        grupo.classList.remove('success', 'error');
        if (ehValido) {
            grupo.classList.add('success');
        } else {
            grupo.classList.add('error');
        }
        return ehValido;
    }

    function validarGrupoDias() {
        const grupo = form.querySelector('.days-selection-group');
        const dia13 = form.elements['dia13'].checked;
        const dia14 = form.elements['dia14'].checked;
        const ehValido = dia13 || dia14;

        if (grupo) {
            grupo.classList.remove('error');
            if (!ehValido) grupo.classList.add('error');
        }
        return ehValido;
    }
}

/**
 * Implementa a funcionalidade de autocompletar para o campo de município.
 */
export function configurarAutocompletar() {
    const input = document.getElementById('municipio-input');
    const containerSugestoes = document.getElementById('municipio-suggestions');
    if (!input || !containerSugestoes) return;

    const cidadesParana = [ "Abatiá", "Adrianópolis", "Agudos do Sul", "Almirante Tamandaré", "Altamira do Paraná", "Alto Paraíso", "Alto Paraná", "Alto Piquiri", "Altônia", "Alvorada do Sul", "Amaporã", "Ampére", "Anahy", "Andirá", "Ângulo", "Antonina", "Antônio Olinto", "Apucarana", "Arapongas", "Arapoti", "Arapuã", "Araruna", "Araucária", "Ariranha do Ivaí", "Assaí", "Assis Chateaubriand", "Astorga", "Atalaia", "Balsa Nova", "Bandeirantes", "Barbosa Ferraz", "Barra do Jacaré", "Barracão", "Bela Vista da Caroba", "Bela Vista do Paraíso", "Bituruna", "Boa Esperança", "Boa Esperança do Iguaçu", "Boa Ventura de São Roque", "Boa Vista da Aparecida", "Bocaiúva do Sul", "Bom Jesus do Sul", "Bom Sucesso", "Bom Sucesso do Sul", "Borrazópolis", "Braganey", "Brasilândia do Sul", "Cafeara", "Cafelândia", "Cafezal do Sul", "Califórnia", "Cambará", "Cambé", "Cambira", "Campina da Lagoa", "Campina do Simão", "Campina Grande do Sul", "Campo Bonito", "Campo do Tenente", "Campo Largo", "Campo Magro", "Campo Mourão", "Cândido de Abreu", "Candói", "Cantagalo", "Capanema", "Capitão Leônidas Marques", "Carambeí", "Carlópolis", "Cascavel", "Castro", "Catanduvas", "Centenário do Sul", "Cerro Azul", "Céu Azul", "Chopinzinho", "Cianorte", "Cidade Gaúcha", "Clevelândia", "Colombo", "Colorado", "Congonhinhas", "Conselheiro Mairinck", "Contenda", "Corbélia", "Cornélio Procópio", "Coronel Domingos Soares", "Coronel Vivida", "Corumbataí do Sul", "Cruz Machado", "Cruzeiro do Iguaçu", "Cruzeiro do Oeste", "Cruzeiro do Sul", "Cruzmaltina", "Curitiba", "Curiúva", "Diamante do Norte", "Diamante do Sul", "Diamante D'Oeste", "Dois Vizinhos", "Douradina", "Doutor Camargo", "Doutor Ulysses", "Enéas Marques", "Engenheiro Beltrão", "Entre Rios do Oeste", "Esperança Nova", "Espigão Alto do Iguaçu", "Farol", "Faxinal", "Fazenda Rio Grande", "Fênix", "Fernandes Pinheiro", "Figueira", "Flor da Serra do Sul", "Floraí", "Floresta", "Florestópolis", "Flórida", "Formosa do Oeste", "Foz do Iguaçu", "Foz do Jordão", "Francisco Alves", "Francisco Beltrão", "General Carneiro", "Godoy Moreira", "Goioerê", "Goioxim", "Grandes Rios", "Guaíra", "Guairaçá", "Guamiranga", "Guapirama", "Guaporema", "Guaraci", "Guaraniaçu", "Guarapuava", "Guaraqueçaba", "Guaratuba", "Honório Serpa", "Ibaiti", "Ibema", "Ibiporã", "Icaraíma", "Iguaraçu", "Iguatu", "Imbaú", "Imbituva", "Inácio Martins", "Inajá", "Indianópolis", "Ipiranga", "Iporã", "Iracema do Oeste", "Irati", "Iretama", "Itaguajé", "Itaipulândia", "Itambaracá", "Itambé", "Itapejara d'Oeste", "Itaperuçu", "Itaúna do Sul", "Ivaí", "Ivaiporã", "Ivaté", "Ivatuba", "Jaboti", "Jacarezinho", "Jaguapitã", "Jaguariaíva", "Jandaia do Sul", "Janiópolis", "Japira", "Japurá", "Jardim Alegre", "Jardim Olinda", "Jataizinho", "Jesuítas", "Joaquim Távora", "Jundiaí do Sul", "Juranda", "Jussara", "Kaloré", "Lapa", "Laranjal", "Laranjeiras do Sul", "Leópolis", "Lidianópolis", "Lindoeste", "Loanda", "Lobato", "Londrina", "Luiziana", "Lunardelli", "Lupionópolis", "Mallet", "Mamborê", "Mandaguaçu", "Mandaguari", "Mandirituba", "Manfrinópolis", "Mangueirinha", "Manoel Ribas", "Marechal Cândido Rondon", "Maria Helena", "Marialva", "Marilândia do Sul", "Marilena", "Mariluz", "Maringá", "Mariópolis", "Maripá", "Marmeleiro", "Marquinho", "Marumbi", "Matelândia", "Matinhos", "Mato Rico", "Mauá da Serra", "Medianeira", "Mercedes", "Mirador", "Miraselva", "Missal", "Moreira Sales", "Morretes", "Munhoz de Melo", "Nossa Senhora das Graças", "Nova Aliança do Ivaí", "Nova América da Colina", "Nova Aurora", "Nova Cantu", "Nova Esperança", "Nova Esperança do Sudoeste", "Nova Fátima", "Nova Laranjeiras", "Nova Londrina", "Nova Olímpia", "Nova Prata do Iguaçu", "Nova Santa Bárbara", "Nova Santa Rosa", "Nova Tebas", "Novo Itacolomi", "Ortigueira", "Ourizona", "Ouro Verde do Oeste", "Paiçandu", "Palmas", "Palmeira", "Palmital", "Palotina", "Paraíso do Norte", "Paranacity", "Paranaguá", "Paranapoema", "Paranavaí", "Pato Bragado", "Pato Branco", "Paula Freitas", "Paulo Frontin", "Peabiru", "Perobal", "Pérola", "Pérola d'Oeste", "Piên", "Pinhais", "Pinhal de São Bento", "Pinhalão", "Pinhão", "Piraí do Sul", "Piraquara", "Pitanga", "Pitangueiras", "Planaltina do Paraná", "Planalto", "Ponta Grossa", "Pontal do Paraná", "Porecatu", "Porto Amazonas", "Porto Barreiro", "Porto Rico", "Porto Vitória", "Prado Ferreira", "Pranchita", "Presidente Castelo Branco", "Primeiro de Maio", "Prudentópolis", "Quarto Centenário", "Quatiguá", "Quatro Barras", "Quatro Pontes", "Quedas do Iguaçu", "Querência do Norte", "Quinta do Sol", "Quitandinha", "Ramilândia", "Rancho Alegre", "Rancho Alegre D'Oeste", "Realeza", "Rebouças", "Renascença", "Reserva", "Reserva do Iguaçu", "Ribeirão Claro", "Ribeirão do Pinhal", "Rio Azul", "Rio Bom", "Rio Bonito do Iguaçu", "Rio Branco do Ivaí", "Rio Branco do Sul", "Rio Negro", "Rolândia", "Roncador", "Rondon", "Rosário do Ivaí", "Sabáudia", "Salgado Filho", "Salto do Itararé", "Salto do Lontra", "Santa Amélia", "Santa Cecília do Pavão", "Santa Cruz de Monte Castelo", "Santa Fé", "Santa Helena", "Santa Inês", "Santa Isabel do Ivaí", "Santa Izabel do Oeste", "Santa Lúcia", "Santa Maria do Oeste", "Santa Mariana", "Santa Mônica", "Santa Tereza do Oeste", "Santa Terezinha de Itaipu", "Santana do Itararé", "Santo Antônio da Platina", "Santo Antônio do Caiuá", "Santo Antônio do Paraíso", "Santo Antônio do Sudoeste", "Santo Inácio", "São Carlos do Ivaí", "São Jerônimo da Serra", "São João", "São João do Caiuá", "São João do Ivaí", "São João do Triunfo", "São Jorge d'Oeste", "São Jorge do Ivaí", "São Jorge do Patrocínio", "São José da Boa Vista", "São José das Palmeiras", "São José dos Pinhais", "São Manoel do Paraná", "São Mateus do Sul", "São Miguel do Iguaçu", "São Pedro do Iguaçu", "São Pedro do Ivaí", "São Pedro do Paraná", "São Sebastião da Amoreira", "São Tomé", "Sapopema", "Sarandi", "Saudade do Iguaçu", "Sengés", "Serranópolis do Iguaçu", "Sertaneja", "Sertanópolis", "Siqueira Campos", "Sulina", "Tamarana", "Tamboara", "Tapejara", "Tapira", "Teixeira Soares", "Telêmaco Borba", "Terra Boa", "Terra Rica", "Terra Roxa", "Tibagi", "Tijucas do Sul", "Toledo", "Tomazina", "Três Barras do Paraná", "Tunas do Paraná", "Tuneiras do Oeste", "Tupãssi", "Turvo", "Ubiratã", "Umuarama", "União da Vitória", "Uniflor", "Uraí", "Ventania", "Vera Cruz do Oeste", "Verê", "Virmond", "Vitorino", "Wenceslau Braz", "Xambrê" ];

    input.addEventListener('input', () => {
        const valor = input.value.toLowerCase();
        containerSugestoes.innerHTML = '';
        containerSugestoes.classList.toggle('hidden', valor.length === 0);

        if (valor.length === 0) return;

        const cidadesFiltradas = cidadesParana.filter(cidade => cidade.toLowerCase().startsWith(valor));

        cidadesFiltradas.slice(0, 5).forEach(cidade => {
            const itemSugestao = document.createElement('div');
            itemSugestao.classList.add('suggestion-item');
            itemSugestao.textContent = cidade;
            itemSugestao.addEventListener('click', () => {
                input.value = cidade;
                containerSugestoes.classList.add('hidden');
            });
            containerSugestoes.appendChild(itemSugestao);
        });

        containerSugestoes.classList.toggle('hidden', cidadesFiltradas.length === 0);
    });

    document.addEventListener('click', (evento) => {
        if (!evento.target.closest('.autocomplete-container')) {
            containerSugestoes.classList.add('hidden');
        }
    });
}

/**
 * Aplica uma máscara de telefone em tempo real ao campo de telefone.
 */
export function configurarMascaraTelefone() {
    const inputTelefone = document.getElementById('telefone');
    if (!inputTelefone) return;

    inputTelefone.addEventListener('input', (evento) => {
        const input = evento.target;
        let valor = input.value.replace(/\D/g, '');

        valor = valor.slice(0, 11);

        let valorFormatado = '';
        if (valor.length > 0) {
            valorFormatado = `(${valor.slice(0, 2)}`;
        }
        if (valor.length > 2) {
            const tamanhoParte2 = valor.length > 10 ? 5 : 4;
            valorFormatado += `) ${valor.slice(2, 2 + tamanhoParte2)}`;
        }
        if (valor.length > 6) {
            const tamanhoParte2 = valor.length > 10 ? 5 : 4;
            valorFormatado += `-${valor.slice(2 + tamanhoParte2)}`;
        }
        input.value = valorFormatado;
    });
}

/**
 * Configura o preenchimento automático do formulário ao inserir um e-mail já cadastrado.
 */
export async function configurarAutocompletarComDadosSalvos() {
    const inputEmail = document.getElementById('email');
    if (!inputEmail) return;

    // O evento 'blur' é disparado quando o usuário clica fora do campo
    inputEmail.addEventListener('blur', async () => {
        const email = inputEmail.value.trim();
        const form = document.getElementById('lead-form');

        if (form && validarEmail(email)) {
            // Busca no Supabase pelo e-mail inserido
            const { data, error } = await supabaseClient
                .from('cadastro_workshop')
                .select('nome_completo, empresa, telefone, municipio')
                .eq('email', email)
                .single(); // .single() retorna um único objeto ou null

            if (data && !error) {
                // Se encontrou dados, preenche o formulário
                form.elements['nome'].value = data.nome_completo || '';
                form.elements['empresa'].value = data.empresa || '';
                form.elements['municipio'].value = data.municipio || '';

                const inputTelefone = form.elements['telefone'];
                if (inputTelefone && data.telefone) {
                    inputTelefone.value = data.telefone;
                    // Dispara o evento 'input' para que a máscara de telefone seja aplicada
                    inputTelefone.dispatchEvent(new Event('input', { bubbles: true }));
                }
                exibirMensagem('Detectamos um cadastro anterior e preenchemos alguns campos para você!', 'success');
            }
        }
    });
}