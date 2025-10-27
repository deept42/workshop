/**
 * @file Gerencia todas as funcionalidades relacionadas ao formulário de inscrição.
 */

import { supabase } from './supabaseClient.js';
import { mostrarNotificacao } from './notificacoes.js';

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

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf === '' || cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    return true;
}

/**
 * Aplica uma máscara de CEP em tempo real ao campo de CEP.
 */
export function configurarMascaraCEP() {
    const inputCEP = document.getElementById('cep');
    if (!inputCEP) return;

    inputCEP.addEventListener('input', (evento) => {
        const input = evento.target;
        let valor = input.value.replace(/\D/g, '');
        valor = valor.slice(0, 8);

        if (valor.length > 5) {
            valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
        }
        input.value = valor;
    });
}

function validarCEP(cep) {
    return /^\d{5}-\d{3}$/.test(cep);
}

/**
 * Aplica uma máscara de CPF em tempo real ao campo de CPF.
 */
export function configurarMascaraCPF() {
    const inputCPF = document.getElementById('cpf');
    if (!inputCPF) return;

    inputCPF.addEventListener('input', (evento) => {
        const input = evento.target;
        let valor = input.value.replace(/\D/g, '');
        valor = valor.slice(0, 11);

        if (valor.length > 9) {
            valor = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (valor.length > 6) {
            valor = valor.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
        } else if (valor.length > 3) {
            valor = valor.replace(/(\d{3})(\d{3})/, '$1.$2');
        }
        input.value = valor;
    });
}

/**
 * Configura a validação e o envio do formulário de inscrição para o Supabase.
 */
export function configurarValidacaoFormulario() {
    const form = document.getElementById('lead-form');
    const mensagensForm = document.getElementById('form-messages');
    const step1 = document.getElementById('form-step-1');
    const step2 = document.getElementById('form-step-2');
    const nextBtn = document.getElementById('next-step-btn');
    const prevBtn = document.getElementById('prev-step-btn');
    const progressBar = document.getElementById('form-progress-bar');
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

    if (!form || !mensagensForm || !submitBtn || !step1 || !step2 || !nextBtn || !prevBtn) return;

    // --- Lógica de Múltiplos Passos ---
    nextBtn.addEventListener('click', () => {
        // Valida apenas os campos do Passo 1
        const nomeValido = validarCampo(form.elements['nome']);
        const emailValido = validarCampo(form.elements['email']);
        const cpfValido = validarCampo(form.elements['cpf']);
        const diasValidos = validarGrupoDias();

        if (nomeValido && emailValido && cpfValido && diasValidos) {
            step1.classList.add('hidden');
            step2.classList.remove('hidden');
            if (progressBar) progressBar.style.width = '100%';

        } else {
            mostrarNotificacao('Por favor, preencha os campos corretamente para continuar.', 'aviso');
        }
    });

    prevBtn.addEventListener('click', () => {
        step2.classList.add('hidden');
        step1.classList.remove('hidden');
        if (progressBar) progressBar.style.width = '50%';
    });

    // Função para resetar o formulário para o passo 1
    const resetarParaPasso1 = () => {
        form.reset();
        step2.classList.add('hidden');
        step1.classList.remove('hidden');
        // Limpa todas as classes de validação
        form.querySelectorAll('.form-group, .days-selection-group').forEach(el => {
            el.classList.remove('error', 'success');
        });
        // Reseta o indicador de progresso
        if (progressBar) progressBar.style.width = '50%';
    };

    // --- Fim da Lógica de Múltiplos Passos ---

    // Adiciona o campo de cargo, que é opcional
    const inputCargo = document.getElementById('cargo');
    if (inputCargo) inputCargo.addEventListener('blur', () => validarCampo(inputCargo));

    // --- Validação em Tempo Real ---
    const camposParaValidar = ['nome', 'cargo', 'cpf', 'empresa', 'email', 'telefone', 'municipio', 'cep'];
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
        mensagensForm.innerHTML = '';
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Enviando...</span>'; // Adiciona span para o z-index funcionar
        submitBtn.classList.add('is-loading');

        const nome = form.elements['nome'].value.trim();
        const cargo = form.elements['cargo'] ? form.elements['cargo'].value.trim() : '';
        const cpf = form.elements['cpf'].value.trim();
        const empresa = form.elements['empresa'].value.trim();
        const email = form.elements['email'].value.trim();
        const telefone = form.elements['telefone'].value.trim();
        const municipio = form.elements['municipio'].value.trim();
        const cep = form.elements['cep'] ? form.elements['cep'].value.trim() : '';
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

        // Valida campo Cargo (opcional, mas adiciona classe 'success' se preenchido)
        const cargoGroup = form.elements['cargo'] ? form.elements['cargo'].closest('.form-group') : null;
        if (cargoGroup && cargo) {
            cargoGroup.classList.add('success');
        } else if (cargoGroup) {
            cargoGroup.classList.add('error');
            isFormValid = false;
        }

        // Valida campo CPF (obrigatório e formato válido)
        const cpfGroup = form.elements['cpf'].closest('.form-group');
        if (cpf && validarCPF(cpf)) {
            cpfGroup.classList.add('success');
        } else {
            cpfGroup.classList.add('error');
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

        // Valida campo CEP (obrigatório)
        const cepGroup = form.elements['cep'] ? form.elements['cep'].closest('.form-group') : null;
        if (cepGroup && cep && validarCEP(cep)) {
            cepGroup.classList.add('success');
        } else if (cepGroup) {
            cepGroup.classList.add('error');
            isFormValid = false;
        }

        // Validações sem feedback visual direto no campo, mas que invalidam o formulário
        const daysGroup = form.querySelector('.days-selection-group');
        if (!participaDia13 && !participaDia14) {
            if (daysGroup) daysGroup.classList.add('error');
            isFormValid = false;
        }

        // Se algum campo for inválido, mostra o modal e para a execução.
        if (!isFormValid) {
            mostrarNotificacao('Por favor, corrija os campos destacados em vermelho.', 'aviso');
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-loading');
            submitBtn.textContent = 'Inscrever-se Agora';
            return;
        }
        // --- Fim da Lógica de Validação Aprimorada ---

        // Gera um código de inscrição único
        const gerarCodigoInscricao = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let codigo = 'WMRD-';
            for (let i = 0; i < 5; i++) {
                codigo += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return codigo;
        };
        const codigoInscricao = gerarCodigoInscricao();

        // --- VERIFICAÇÃO DE CPF DUPLICADO ANTES DE INSERIR ---
        const cpfLimpo = cpf.replace(/\D/g, '');
        const { data: cpfExistente, error: cpfError } = await supabase
            .from('cadastro_workshop')
            .select('cpf')
            .eq('cpf', cpfLimpo)
            .single();

        if (cpfExistente) {
            mostrarNotificacao('Este CPF já foi cadastrado. Verifique os dados ou entre em contato.', 'erro');
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-loading');
            submitBtn.textContent = 'Inscrever-se Agora';
            return; // Interrompe a execução
        }

        // Envio para o Supabase
        const { data, error } = await supabase
            .from('cadastro_workshop')
            .insert([{
                nome_completo: formatarParaTitulo(nome),
                cargo_funcao: formatarParaTitulo(cargo),
                cpf: cpfLimpo,
                empresa: formatarParaTitulo(empresa),
                email: email.toLowerCase(),
                telefone: telefone,
                municipio: formatarParaTitulo(municipio),
                cep: cep,
                participa_dia_13: participaDia13,
                participa_dia_14: participaDia14,
                concorda_comunicacoes: consentimento,
                quer_certificado: false,
                status_pagamento: 'nao_solicitado',
                codigo_inscricao: codigoInscricao
            }])
            .select();

        if (error) {
            console.error('Objeto completo do erro do Supabase:', error);
            // Agora, a verificação de CPF já foi feita. O erro 23505 provavelmente será de e-mail.
            if (error.code === '23505') {
                mostrarNotificacao('Este e-mail já foi cadastrado. Por favor, utilize outro.', 'erro');
            } else if (cpfError) {
                // Se a busca pelo CPF falhou por outro motivo
                mostrarNotificacao('Erro ao verificar CPF. Tente novamente.', 'erro');
            } else {
                mostrarNotificacao('Ocorreu um erro inesperado na inscrição. Tente novamente.', 'erro');
            }
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-loading');
            submitBtn.textContent = 'Inscrever-se Agora';
        } else {
            // Coleta os dados ANTES de limpar o formulário
            const dadosInscrito = { id: data[0].id, nome, email, cpf, telefone, municipio, cep, codigo_inscricao: codigoInscricao };

            mostrarNotificacao('Inscrição confirmada! Verifique as opções de certificado.', 'sucesso');
            mostrarFeedbackSucessoTopo(); // Reativando a barra de sucesso no topo
            resetarParaPasso1(); // Reseta o formulário e volta para o passo 1

            // Passa os dados coletados para a função do modal
            mostrarModalCertificado(dadosInscrito);

            // Tenta enviar o e-mail de confirmação chamando a Edge Function
            try {
                const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
                    body: { nome, email, codigo_inscricao: codigoInscricao },
                });
                if (emailError) {
                    throw emailError;
                }
            } catch (invokeError) {
                // Se o envio do e-mail falhar, apenas loga no console para não confundir o usuário,
                // pois a inscrição em si foi um sucesso.
                console.error("Falha ao enviar e-mail de confirmação:", invokeError);
            }

            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.classList.remove('is-loading');
                submitBtn.textContent = 'Inscrever-se Agora';
            }, 3000);
        }
    });

    function mostrarFeedbackSucessoTopo() {
        const topBar = document.getElementById('top-bar');
        const title = topBar.querySelector('.top-bar-title');
        const countdown = topBar.querySelector('#countdown-timer');
        const subtitle = topBar.querySelector('.top-bar-subtitle');

        if (!topBar || !title || !countdown || !subtitle) return;
        
        // Esconde os elementos que não são necessários na mensagem de sucesso
        title.style.display = 'none';
        countdown.style.display = 'none';
        
        // Aplica o estado de sucesso
        topBar.style.background = 'linear-gradient(to right, #16A34A, #15803D, #16A34A)'; // Gradiente verde
        topBar.style.color = 'white'; // Garante que o texto fique legível no fundo verde
        subtitle.textContent = 'INSCRIÇÃO CONFIRMADA COM SUCESSO!';
        subtitle.style.fontWeight = 'bold';
        subtitle.style.display = 'block'; // Garante que o subtítulo esteja visível
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
            case 'cpf':
                ehValido = valor && validarCPF(valor);
                break;
            case 'cep':
                ehValido = valor && validarCEP(valor);
                break;
            default: // Para nome, empresa, municipio
                ehValido = !!valor;
                break;
        }

        grupo.classList.remove('success', 'error');
        if (ehValido) {
            grupo.classList.add('success');
        } else {
            // Não marca erro no blur para campos opcionais ou se o campo estiver vazio
            if (valor && !ehValido) {
                grupo.classList.add('error');
            }
        }
        return ehValido;
    }

    function validarGrupoDias() {
        const grupo = form.querySelector('.days-selection-group');
        const dia13 = form.elements['dia13'] ? form.elements['dia13'].checked : false;
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
 * Exibe um modal de confirmação para o certificado.
 * @param {string} idRegistro - O ID do registro no Supabase.
 * @param {object} dadosInscrito - Objeto com os dados do inscrito { id, nome, email, cpf, telefone, codigo_inscricao }.
 */
export async function mostrarModalCertificado(dadosInscrito) {
    const modal = document.getElementById('certificate-modal');
    const botaoSim = document.getElementById('cert-btn-yes');
    const botaoNao = document.getElementById('cert-btn-no');
    const displayCodigo = document.getElementById('codigo-inscricao-display');

    // Exibe o código de inscrição gerado
    if (displayCodigo) displayCodigo.textContent = dadosInscrito.codigo_inscricao;

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
        if (dadosInscrito && dadosInscrito.id) {
            // Primeiro, atualiza o status no banco de dados para 'pendente'
            // Isso garante que saibamos que o usuário demonstrou interesse,
            // mesmo que ele feche a aba de pagamento.
            // O webhook do Asaas cuidará da transição de 'pendente' para 'pago'.
            const { error: updateError } = await supabase
                .from('cadastro_workshop')
                .update({ quer_certificado: true, status_pagamento: 'pendente' })
                .eq('id', dadosInscrito.id);

            if (updateError) {
                mostrarNotificacao('Erro ao registrar interesse no certificado. Tente novamente.', 'erro');
                console.error('Erro ao atualizar status do certificado:', updateError);
                fecharModal();
                return;
            }

            // Em seguida, chama a Edge Function para gerar o boleto
            const { data, error: invokeError } = await supabase.functions.invoke('create-asaas-charge', {
                body: dadosInscrito, // Envia o objeto completo com os dados
            });

            if (invokeError) {
                mostrarNotificacao('Erro ao gerar boleto. Por favor, tente novamente mais tarde.', 'erro');
                console.error('Erro ao invocar create-asaas-charge:', invokeError);
            } else if (data && data.invoiceUrl) {
                window.open(data.invoiceUrl, '_blank'); // Abre o link do boleto
            }
        }
        fecharModal();
    };

    novoBotaoNao.onclick = fecharModal;
}

/**
 * Exibe um modal de erro com uma mensagem personalizada.
 * @param {string} mensagem - A mensagem de erro a ser exibida.
 */
export async function mostrarModalErro(mensagem) {
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

/**
 * Exibe um modal de sucesso genérico com título e mensagem personalizáveis.
 * @param {string} titulo - O título do modal.
 * @param {string} mensagem - A mensagem do modal.
 */
export async function mostrarModalSucesso(titulo, mensagem) {
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
 * Exibe um modal de sucesso para o login.
 * @param {string} mensagem - A mensagem de sucesso a ser exibida.
 */
export async function mostrarModalSucessoLogin(mensagem) {
    // Reutilizando o modal de sucesso genérico para o login
    await mostrarModalSucesso('Login Realizado com Sucesso!', mensagem);
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
            const { data, error } = await supabase
                .from('cadastro_workshop')
                .select('nome_completo, cargo_funcao, cpf, empresa, telefone, municipio, cep')
                .eq('email', email)
                // Adiciona ordenação para pegar o mais recente e limita a 1 resultado
                // para garantir que .single() não falhe se houver duplicados.
                .order('created_at', { ascending: false })
                .limit(1)
                .single(); // .single() agora é seguro

            if (data && !error) {
                // Se encontrou dados, preenche o formulário
                form.elements['nome'].value = data.nome_completo || '';
                form.elements['cargo'].value = data.cargo_funcao || '';
                const inputCPF = form.elements['cpf'];
                if (inputCPF && data.cpf) {
                    inputCPF.value = data.cpf;
                    // Dispara o evento 'input' para que a máscara seja aplicada
                    inputCPF.dispatchEvent(new Event('input', { bubbles: true }));
                }
                form.elements['empresa'].value = data.empresa || '';
                const inputCEP = form.elements['cep'];
                if (inputCEP && data.cep) {
                    inputCEP.value = data.cep;
                    // Dispara o evento 'input' para que a máscara seja aplicada
                    inputCEP.dispatchEvent(new Event('input', { bubbles: true }));
                }
                form.elements['municipio'].value = data.municipio || '';

                const inputTelefone = form.elements['telefone'];
                if (inputTelefone && data.telefone) {
                    inputTelefone.value = data.telefone;
                    // Dispara o evento 'input' para que a máscara de telefone seja aplicada
                    inputTelefone.dispatchEvent(new Event('input', { bubbles: true }));
                }
                mostrarNotificacao('Detectamos um cadastro anterior e preenchemos alguns campos para você!', 'aviso');
            }
        }
    });
}