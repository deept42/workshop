/**
 * @file Manages all client-side interactivity for the workshop single-page website.
 * @description Controla a interatividade da página de formato "folder".
 */

// --- INFORMAÇÃO NOVA A ADICIONAR ---
// 1. Configuração da conexão com o Supabase
const SUPABASE_URL = 'https://onqettyqcdyutkticrab.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucWV0dHlxY2R5dXRrdGljcmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Njg5OTksImV4cCI6MjA3NjI0NDk5OX0.LZJhIX3f0Jd3TxVo-YGHBVpiejLimGo-ClACeipilqc';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// --- FIM DA INFORMAÇÃO NOVA ---

// Aguarda o carregamento completo do HTML antes de executar os scripts.
document.addEventListener('DOMContentLoaded', () => {

    const folderContainer = document.getElementById('folder-container');
    const panels = document.querySelectorAll('.folder-panel');
    let currentVisiblePanel = null; // Variável para rastrear o painel visível
    
    /**
     * Configures anchor link navigation to scroll instantly to the target section on click.
     * para a seção correspondente ao clicar em um link.
     */
    function setupSmoothScrolling() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        if (anchorLinks.length === 0) return;

        anchorLinks.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const targetId = this.getAttribute('href');
                const targetPanel = document.querySelector(targetId);
                
                if (targetPanel && typeof targetPanel.scrollIntoView === 'function') {
                    // Garante a rolagem suave que foi definida no CSS.
                    targetPanel.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    /**
     * Uses IntersectionObserver to track visible panels.
     * 1. Updates the active link in the navigation menu.
     * 2. Triggers scroll-based animations for elements.
     */
    function updateActiveNavLink() {
        if (panels.length === 0) return;

        let lastActiveLinks = [];

        const observerOptions = {
            root: null, // Observa em relação ao viewport do navegador (CORREÇÃO)
            threshold: 0.5 // O painel deve estar 50% visível
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Seleciona todos os elementos para animar dentro do painel atual
                const elementsToAnimate = entry.target.querySelectorAll('.animate-on-scroll');

                if (entry.isIntersecting) {
                    currentVisiblePanel = entry.target; // Atualiza o painel visível

                    const activeLinks = document.querySelectorAll(`a[href="#${entry.target.id}"]`);
                    
                    // Otimização: Remove a classe apenas dos links ativos anteriormente.
                    lastActiveLinks.forEach(link => link.classList.remove('active-link'));
                    
                    // Adiciona a classe ativa a todos os links correspondentes (desktop e mobile)
                    activeLinks.forEach(link => link.classList.add('active-link'));
                    lastActiveLinks = Array.from(activeLinks);

                    // Adiciona a classe 'is-visible' para disparar a animação
                    elementsToAnimate.forEach(el => el.classList.add('is-visible'));
                } else {
                    // Opcional: Remove a classe quando o painel sai da tela para re-animar se o usuário voltar
                    elementsToAnimate.forEach(el => el.classList.remove('is-visible'));
                }
            });
        }, observerOptions);

        // Use a single observer for all panels for better performance
        panels.forEach(panel => observer.observe(panel));
    }

    /**
     * Manages the mobile hamburger menu functionality.
     * Toggles visibility and closes the menu when a link is clicked.
     */
    function setupMobileMenu() {
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileLinks = document.querySelectorAll('.mobile-link');

        if (!hamburgerBtn || !mobileMenu) return;

        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('open'); // Apenas alterna a classe. O CSS faz o resto.
        });

        // Fecha o menu ao clicar em um link
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
            });
        });
    }

    /**
     * Sets up and displays a countdown timer until the event date.
     * Optimized to only update DOM elements when their values change.
     */
    function setupCountdown() {
        const countdownElement = document.getElementById('countdown-timer');
        if (!countdownElement) return;

        countdownElement.innerHTML = `
            <div class="countdown-item"><span id="cd-days" class="countdown-number">0</span><span class="countdown-label">Dias</span></div>
            <div class="countdown-item"><span id="cd-hours" class="countdown-number">0</span><span class="countdown-label">Horas</span></div>
            <div class="countdown-item"><span id="cd-minutes" class="countdown-number">0</span><span class="countdown-label">Min</span></div>
            <div class="countdown-item"><span id="cd-seconds" class="countdown-number">0</span><span class="countdown-label">Seg</span></div>
        `;
        const daysEl = document.getElementById('cd-days');
        const hoursEl = document.getElementById('cd-hours');
        const minutesEl = document.getElementById('cd-minutes');
        const secondsEl = document.getElementById('cd-seconds');

        if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

        let lastValues = {};
        
        // Define a data do evento (13 de Novembro do ano corrente)
        const eventDate = new Date(new Date().getFullYear(), 10, 13).getTime(); // Mês 10 é Novembro (0-11)

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = eventDate - now;
            
            if (distance >= 0) {
                const values = {
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                };

                // Otimização: Atualiza o DOM apenas se o valor mudou
                if (lastValues.seconds !== values.seconds) {
                    daysEl.textContent = values.days;
                    hoursEl.textContent = values.hours;
                    minutesEl.textContent = values.minutes;
                    secondsEl.textContent = values.seconds;
                    lastValues = values;
                }
            } else {
                // Se a contagem terminar, para o intervalo e exibe a mensagem
                clearInterval(interval);
                const topBarContent = countdownElement.parentNode;
                if (topBarContent && countdownElement) {
                    // Non-destructive update: hide timer and show message
                    countdownElement.style.display = 'none';
                    const message = document.createElement('p');
                    message.className = 'font-bold text-lg';
                    message.textContent = 'É HOJE! O EVENTO COMEÇOU!';
                    // Insert message where the timer was to better maintain layout
                    topBarContent.insertBefore(message, countdownElement.nextSibling);
                }
            }
        }, 1000);
    }

    /**
     * Implements autocomplete functionality for the city input field.
     * This function filters a list of cities and displays a limited number of suggestions
     * to improve performance and user experience.
     */
    function setupAutocomplete() {
        // Adiciona uma verificação para garantir que todos os elementos necessários existem.
        const container = document.querySelector('.autocomplete-container');
        if (!container) return;
        const input = document.getElementById('municipio-input');
        const suggestionsContainer = document.getElementById('municipio-suggestions');
        if (!input || !suggestionsContainer) return;

        const cidadesParana = [
            "Abatiá", "Adrianópolis", "Agudos do Sul", "Almirante Tamandaré", "Altamira do Paraná", "Alto Paraíso", "Alto Paraná", "Alto Piquiri", "Altônia", "Alvorada do Sul",
            "Amaporã", "Ampére", "Anahy", "Andirá", "Ângulo", "Antonina", "Antônio Olinto", "Apucarana", "Arapongas", "Arapoti", "Arapuã", "Araruna", "Araucária", "Ariranha do Ivaí",
            "Assaí", "Assis Chateaubriand", "Astorga", "Atalaia", "Balsa Nova", "Bandeirantes", "Barbosa Ferraz", "Barra do Jacaré", "Barracão", "Bela Vista da Caroba", "Bela Vista do Paraíso",
            "Bituruna", "Boa Esperança", "Boa Esperança do Iguaçu", "Boa Ventura de São Roque", "Boa Vista da Aparecida", "Bocaiúva do Sul", "Bom Jesus do Sul", "Bom Sucesso", "Bom Sucesso do Sul",
            "Borrazópolis", "Braganey", "Brasilândia do Sul", "Cafeara", "Cafelândia", "Cafezal do Sul", "Califórnia", "Cambará", "Cambé", "Cambira", "Campina da Lagoa", "Campina do Simão",
            "Campina Grande do Sul", "Campo Bonito", "Campo do Tenente", "Campo Largo", "Campo Magro", "Campo Mourão", "Cândido de Abreu", "Candói", "Cantagalo", "Capanema", "Capitão Leônidas Marques",
            "Carambeí", "Carlópolis", "Cascavel", "Castro", "Catanduvas", "Centenário do Sul", "Cerro Azul", "Céu Azul", "Chopinzinho", "Cianorte", "Cidade Gaúcha", "Clevelândia", "Colombo",
            "Colorado", "Congonhinhas", "Conselheiro Mairinck", "Contenda", "Corbélia", "Cornélio Procópio", "Coronel Domingos Soares", "Coronel Vivida", "Corumbataí do Sul", "Cruz Machado",
            "Cruzeiro do Iguaçu", "Cruzeiro do Oeste", "Cruzeiro do Sul", "Cruzmaltina", "Curitiba", "Curiúva", "Diamante do Norte", "Diamante do Sul", "Diamante D'Oeste", "Dois Vizinhos",
            "Douradina", "Doutor Camargo", "Doutor Ulysses", "Enéas Marques", "Engenheiro Beltrão", "Entre Rios do Oeste", "Esperança Nova", "Espigão Alto do Iguaçu", "Farol", "Faxinal",
            "Fazenda Rio Grande", "Fênix", "Fernandes Pinheiro", "Figueira", "Flor da Serra do Sul", "Floraí", "Floresta", "Florestópolis", "Flórida", "Formosa do Oeste", "Foz do Iguaçu",
            "Foz do Jordão", "Francisco Alves", "Francisco Beltrão", "General Carneiro", "Godoy Moreira", "Goioerê", "Goioxim", "Grandes Rios", "Guaíra", "Guairaçá", "Guamiranga", "Guapirama",
            "Guaporema", "Guaraci", "Guaraniaçu", "Guarapuava", "Guaraqueçaba", "Guaratuba", "Honório Serpa", "Ibaiti", "Ibema", "Ibiporã", "Icaraíma", "Iguaraçu", "Iguatu", "Imbaú", "Imbituva",
            "Inácio Martins", "Inajá", "Indianópolis", "Ipiranga", "Iporã", "Iracema do Oeste", "Irati", "Iretama", "Itaguajé", "Itaipulândia", "Itambaracá", "Itambé", "Itapejara d'Oeste",
            "Itaperuçu", "Itaúna do Sul", "Ivaí", "Ivaiporã", "Ivaté", "Ivatuba", "Jaboti", "Jacarezinho", "Jaguapitã", "Jaguariaíva", "Jandaia do Sul", "Janiópolis", "Japira", "Japurá",
            "Jardim Alegre", "Jardim Olinda", "Jataizinho", "Jesuítas", "Joaquim Távora", "Jundiaí do Sul", "Juranda", "Jussara", "Kaloré", "Lapa", "Laranjal", "Laranjeiras do Sul", "Leópolis",
            "Lidianópolis", "Lindoeste", "Loanda", "Lobato", "Londrina", "Luiziana", "Lunardelli", "Lupionópolis", "Mallet", "Mamborê", "Mandaguaçu", "Mandaguari", "Mandirituba", "Manfrinópolis",
            "Mangueirinha", "Manoel Ribas", "Marechal Cândido Rondon", "Maria Helena", "Marialva", "Marilândia do Sul", "Marilena", "Mariluz", "Maringá", "Mariópolis", "Maripá", "Marmeleiro",
            "Marquinho", "Marumbi", "Matelândia", "Matinhos", "Mato Rico", "Mauá da Serra", "Medianeira", "Mercedes", "Mirador", "Miraselva", "Missal", "Moreira Sales", "Morretes", "Munhoz de Melo",
            "Nossa Senhora das Graças", "Nova Aliança do Ivaí", "Nova América da Colina", "Nova Aurora", "Nova Cantu", "Nova Esperança", "Nova Esperança do Sudoeste", "Nova Fátima", "Nova Laranjeiras",
            "Nova Londrina", "Nova Olímpia", "Nova Prata do Iguaçu", "Nova Santa Bárbara", "Nova Santa Rosa", "Nova Tebas", "Novo Itacolomi", "Ortigueira", "Ourizona", "Ouro Verde do Oeste",
            "Paiçandu", "Palmas", "Palmeira", "Palmital", "Palotina", "Paraíso do Norte", "Paranacity", "Paranaguá", "Paranapoema", "Paranavaí", "Pato Bragado", "Pato Branco", "Paula Freitas",
            "Paulo Frontin", "Peabiru", "Perobal", "Pérola", "Pérola d'Oeste", "Piên", "Pinhais", "Pinhal de São Bento", "Pinhalão", "Pinhão", "Piraí do Sul", "Piraquara", "Pitanga", "Pitangueiras",
            "Planaltina do Paraná", "Planalto", "Ponta Grossa", "Pontal do Paraná", "Porecatu", "Porto Amazonas", "Porto Barreiro", "Porto Rico", "Porto Vitória", "Prado Ferreira", "Pranchita",
            "Presidente Castelo Branco", "Primeiro de Maio", "Prudentópolis", "Quarto Centenário", "Quatiguá", "Quatro Barras", "Quatro Pontes", "Quedas do Iguaçu", "Querência do Norte",
            "Quinta do Sol", "Quitandinha", "Ramilândia", "Rancho Alegre", "Rancho Alegre D'Oeste", "Realeza", "Rebouças", "Renascença", "Reserva", "Reserva do Iguaçu", "Ribeirão Claro",
            "Ribeirão do Pinhal", "Rio Azul", "Rio Bom", "Rio Bonito do Iguaçu", "Rio Branco do Ivaí", "Rio Branco do Sul", "Rio Negro", "Rolândia", "Roncador", "Rondon", "Rosário do Ivaí",
            "Sabáudia", "Salgado Filho", "Salto do Itararé", "Salto do Lontra", "Santa Amélia", "Santa Cecília do Pavão", "Santa Cruz de Monte Castelo", "Santa Fé", "Santa Helena", "Santa Inês",
            "Santa Isabel do Ivaí", "Santa Izabel do Oeste", "Santa Lúcia", "Santa Maria do Oeste", "Santa Mariana", "Santa Mônica", "Santa Tereza do Oeste", "Santa Terezinha de Itaipu",
            "Santana do Itararé", "Santo Antônio da Platina", "Santo Antônio do Caiuá", "Santo Antônio do Paraíso", "Santo Antônio do Sudoeste", "Santo Inácio", "São Carlos do Ivaí",
            "São Jerônimo da Serra", "São João", "São João do Caiuá", "São João do Ivaí", "São João do Triunfo", "São Jorge d'Oeste", "São Jorge do Ivaí", "São Jorge do Patrocínio",
            "São José da Boa Vista", "São José das Palmeiras", "São José dos Pinhais", "São Manoel do Paraná", "São Mateus do Sul", "São Miguel do Iguaçu", "São Pedro do Iguaçu",
            "São Pedro do Ivaí", "São Pedro do Paraná", "São Sebastião da Amoreira", "São Tomé", "Sapopema", "Sarandi", "Saudade do Iguaçu", "Sengés", "Serranópolis do Iguaçu", "Sertaneja",
            "Sertanópolis", "Siqueira Campos", "Sulina", "Tamarana", "Tamboara", "Tapejara", "Tapira", "Teixeira Soares", "Telêmaco Borba", "Terra Boa", "Terra Rica", "Terra Roxa", "Tibagi",
            "Tijucas do Sul", "Toledo", "Tomazina", "Três Barras do Paraná", "Tunas do Paraná", "Tuneiras do Oeste", "Tupãssi", "Turvo", "Ubiratã", "Umuarama", "União da Vitória", "Uniflor",
            "Uraí", "Ventania", "Vera Cruz do Oeste", "Verê", "Virmond", "Vitorino", "Wenceslau Braz", "Xambrê"
        ];

        // Optimization: Create a normalized list once for faster filtering
        const normalizedCidades = cidadesParana.map(city => ({ original: city, lower: city.toLowerCase() }));

        input.addEventListener('input', () => {
            const value = input.value.toLowerCase();
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.classList.remove('hidden');

            if (value.length === 0) {
                suggestionsContainer.classList.add('hidden');
                return;
            }

            const filteredCities = normalizedCidades.filter(city => city.lower.startsWith(value));

            filteredCities.slice(0, 5).forEach(city => {
                const suggestionItem = document.createElement('div');
                suggestionItem.classList.add('suggestion-item');
                suggestionItem.textContent = city.original;
                suggestionItem.addEventListener('click', () => {
                    input.value = city.original;
                    suggestionsContainer.classList.add('hidden');
                });
                suggestionsContainer.appendChild(suggestionItem);
            });

            if (filteredCities.length === 0) {
                suggestionsContainer.classList.add('hidden');
            }
        });

        // Close the suggestions list if the user clicks outside of it
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.autocomplete-container')) {
                suggestionsContainer.classList.add('hidden');
            }
        });
    }

    /**
     * Adds a navigation shortcut to scroll to the next section via middle mouse button click.
     */
    function setupMiddleMouseNavigation() {
        document.addEventListener('mousedown', (event) => {
            if (event.button === 1) {
                event.preventDefault(); 
                if (currentVisiblePanel) {
                    const nextPanel = currentVisiblePanel.nextElementSibling;
                    if (nextPanel && nextPanel.classList.contains('folder-panel')) {
                        nextPanel.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }
        });
    }

    /**
     * Controls the width of the scroll progress bar based on the container's scroll position.
     */
    function setupScrollProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        if (!progressBar || !folderContainer) return;

        folderContainer.addEventListener('scroll', () => {
            const scrollTop = folderContainer.scrollTop;
            const scrollHeight = folderContainer.scrollHeight;
            const clientHeight = folderContainer.clientHeight;

            // Previne divisão por zero se o conteúdo não for rolável
            if (scrollHeight <= clientHeight) return;

            const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
            
            progressBar.style.width = `${scrollPercent}%`;
        });
    }

    /**
     * Sets up real-time validation for the lead generation form.
     */
    /**
     * Sets up form submission to Supabase with validation.
     */
    function setupFormValidation() {
        const form = document.getElementById('lead-form');
        const formMessages = document.getElementById('form-messages');
        const submitButton = form.querySelector('button[type="submit"]');

        if (!form || !formMessages || !submitButton) return;

        // Tornamos a função 'async' para poder usar 'await'
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            formMessages.innerHTML = ''; // Limpa mensagens anteriores
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';

            const nome = form.elements['nome'].value.trim();
            const empresa = form.elements['empresa'].value.trim();
            const email = form.elements['email'].value.trim();
            const telefone = form.elements['telefone'].value.trim();
            const municipio = form.elements['municipio'].value.trim();
            const consent = form.elements['consent'].checked;
            const dia13 = form.elements['dia13'].checked;
            const dia14 = form.elements['dia14'].checked;

            // Validação (seu código original, mantido)
            if (!nome || !empresa || !email || !municipio) {
                displayMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Inscrever-se Agora';
                return;
            }

            if (!validateEmail(email)) {
                displayMessage('Por favor, insira um endereço de e-mail válido.', 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Inscrever-se Agora';
                return;
            }

            if (telefone && !validateTelefone(telefone)) {
                displayMessage('Por favor, insira um telefone válido (10 ou 11 dígitos).', 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Inscrever-se Agora';
                return;
            }

            if (!dia13 && !dia14) {
                displayMessage('Por favor, selecione pelo menos um dia de participação.', 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Inscrever-se Agora';
                return;
            }

            if (!consent) {
                displayMessage('Você precisa concordar com os termos para se inscrever.', 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Inscrever-se Agora';
                return;
            }

            // --- CÓDIGO DE ENVIO PARA O SUPABASE ---
            const { data, error } = await supabaseClient
                .from('cadastro_workshop') // Nome da sua tabela
                .insert([{
                    // ATENÇÃO: Verifique se os nomes à esquerda correspondem EXATAMENTE às suas colunas no Supabase
                    nome_completo: nome,            // CORRIGIDO: Usando o nome da coluna da sua tabela
                    empresa: empresa,               // Verifique este
                    email: email,                   // Verifique este
                    telefone: telefone,             // Verifique este
                    municipio: municipio,           // Verifique este
                    participa_dia_13: dia13,        // Verifique este
                    participa_dia_14: dia14,        // Verifique este
                    concorda_comunicacoes: consent, // Verifique este
                    quer_certificado: false,        // Verifique este
                    status_pagamento: 'nao_solicitado' // Verifique este
                }])
                .select(); // Adiciona .select() para retornar o registro criado

            // --- LÓGICA APÓS O ENVIO ---
            if (error) {
                // --- NOVA FUNÇÃO DE ERRO DETALHADO ---
                console.error('Objeto completo do erro do Supabase:', error);

                // Verifica se o erro é de e-mail duplicado (código '23505' do PostgreSQL)
                if (error.code === '23505') {
                    displayMessage('Este e-mail já foi cadastrado. Por favor, utilize outro.', 'error');
                } else {
                    // Para todos os outros erros, mostra uma mensagem genérica
                    displayMessage('Ocorreu um erro na inscrição. Tente novamente.', 'error');
                    console.error('Detalhes do erro:', error.message);
                }
                
                submitButton.disabled = false;
                submitButton.textContent = 'Inscrever-se Agora';
            } else {
                displayMessage('Inscrição realizada com sucesso!', 'success');
                if (typeof form.reset === 'function') {
                    form.reset();
                }

                // Pega o ID do novo registro para usar no modal de certificado
                const newRecordId = data ? data[0].id : null;
                
                requestAnimationFrame(() => {
                    showCertificateModal(newRecordId); // Passa o ID para o modal
                }, 500);

                setTimeout(() => {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Inscrever-se Agora';
                }, 3000);
            }
        });
        
        // --- MODIFICAR A FUNÇÃO DO MODAL ---
        // A função precisa aceitar o ID do registro
        async function showCertificateModal(recordId) {
            const modal = document.getElementById('certificate-modal');
            const modalContent = document.getElementById('certificate-modal-content');
            const btnYes = document.getElementById('cert-btn-yes');
            const btnNo = document.getElementById('cert-btn-no');

            if (!modal || !btnYes || !btnNo) return;

            requestAnimationFrame(() => {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                if (modalContent) modalContent.style.transform = 'scale(1)';
            });

            const closeModal = () => {
                if (modalContent) modalContent.style.transform = 'scale(0.95)';
                setTimeout(() => modal.classList.add('hidden'), 300);
            };

            // Clone e substitua os botões para remover event listeners antigos
            const newBtnYes = btnYes.cloneNode(true);
            btnYes.parentNode.replaceChild(newBtnYes, btnYes);
            const newBtnNo = btnNo.cloneNode(true);
            btnNo.parentNode.replaceChild(newBtnNo, btnNo);

            newBtnYes.onclick = async () => {
                if (recordId) {
                    // Atualiza o registro no Supabase
                    const { error } = await supabaseClient
                        .from('cadastro_workshop')
                        .update({ quer_certificado: true, status_pagamento: 'pendente' })
                        .eq('id', recordId); // Atualiza apenas o registro correto
                    if (error) {
                        console.error('Erro ao atualizar para o certificado:', error.message);
                        // Opcional: Informar o usuário que houve um erro na atualização
                    }
                }
                window.open('https://www.asaas.com/c/p9v42o92yos25x75', '_blank');
                closeModal();
            };

            newBtnNo.onclick = () => {
                closeModal();
            };
        }

        function displayMessage(message, type) {
            const messageElement = document.createElement('p');
            messageElement.textContent = message;
            messageElement.className = type === 'error' ? 'form-message-error' : 'form-message-success';
            formMessages.appendChild(messageElement);
        }

        function validateEmail(email) {
            // Expressão regular simples para validação de e-mail
            const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        }

        function validateTelefone(telefone) {
            // Remove todos os caracteres não numéricos
            const digitsOnly = telefone.replace(/\D/g, '');
            // Verifica se o número de dígitos está entre 10 e 11
            return /^\d{10,11}$/.test(digitsOnly);
        }
    }

    /**
     * Applies a real-time input mask to the phone number field (e.g., (XX) XXXXX-XXXX).
     */
    function setupPhoneMask() {
        const phoneInput = document.getElementById('telefone');
        if (!phoneInput) return;

        phoneInput.addEventListener('input', (event) => {
            const input = event.target;
            let value = input.value.replace(/\D/g, ''); // Keep only digits

            if (value.length > 11) {
                value = value.slice(0, 11);
            }

            let formattedValue = '';
            if (value.length > 0) {
                formattedValue = `(${value.slice(0, 2)}`;
            }
            if (value.length > 2) {
                const part2Length = value.length > 10 ? 5 : 4; // 5 digits for mobile, 4 for landline
                formattedValue += `) ${value.slice(2, 2 + part2Length)}`;
            }
            if (value.length > 6) {
                const part2Length = value.length > 10 ? 5 : 4;
                formattedValue += `-${value.slice(2 + part2Length)}`;
            }
            input.value = formattedValue;
        });
    }

    /**
     * Sets up YouTube video players.
     */
    function setupYouTubePlayers() {
        // Função para criar um player. Pode ser reutilizada.
        const createPlayer = (elementId, videoId, playerVars) => {
            if (!document.getElementById(elementId)) return null;

            return new YT.Player(elementId, {
                videoId: videoId,
                playerVars: {
                    // Default settings
                    controls: 0,
                    showinfo: 0,
                    modestbranding: 1,
                    loop: 1,
                    fs: 0,
                    cc_load_policy: 0,
                    iv_load_policy: 3,
                    autohide: 0,
                    mute: 1,
                    playlist: videoId, // Required for the loop to work
                    ...playerVars // Sobrescreve as configurações padrão
                }
            });
        };

        // This function will be called by the YouTube API script once it's loaded
        window.onYouTubeIframeAPIReady = function() {
            // Player para a seção de início (fundo)
            const backgroundPlayer = createPlayer('youtube-player', '9lJSGvqRjUc', {
                autoplay: 1,
                start: 10,
                end: 112
            });
            if (backgroundPlayer) {
                backgroundPlayer.addEventListener('onReady', (event) => event.target.playVideo());
            }

            // Player para a seção "Sobre" (planejamento)
            const planningPlayer = createPlayer('planning-video-player', 'IhK0ju7oE_U', {
                autoplay: 0, // Não inicia automaticamente
                mute: 0,     // Inicia com som
                controls: 0, // Esconde os controles nativos
                rel: 0       // Não mostra vídeos relacionados no final
            });

            const customPlayButton = document.getElementById('custom-play-button');

            if (planningPlayer && customPlayButton) {
                customPlayButton.addEventListener('click', () => { // Adiciona verificação de função
                    planningPlayer.playVideo();
                });

                planningPlayer.addEventListener('onStateChange', (event) => {
                    // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
                    if (event.data === YT.PlayerState.PLAYING) {
                        customPlayButton.classList.add('hidden');
                    } else {
                        customPlayButton.classList.remove('hidden');
                    }
                });
            }
        };
    }

    /**
     * Sets up click-to-zoom functionality for specified images.
     */
    function setupImageZoom() {
        const speakerImage = document.getElementById('speaker-image-paula');
        const overlay = document.getElementById('image-zoom-overlay');
        const zoomedImage = document.getElementById('zoomed-image');

        if (!speakerImage || !overlay || !zoomedImage) return;

        speakerImage.addEventListener('click', () => {
            zoomedImage.src = speakerImage.src;
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        });

        overlay.addEventListener('click', () => {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
            // Optional: clear src to prevent loading image in the background
            setTimeout(() => {
                zoomedImage.src = "";
            }, 300); // Delay matches CSS transition
        });
    }

    // --- INITIALIZATION ---
    if (folderContainer) {
        setupSmoothScrolling();
        updateActiveNavLink();
        setupMobileMenu();
        setupCountdown();
        setupAutocomplete();
        setupMiddleMouseNavigation();
        setupScrollProgressBar();
        setupFormValidation();
        setupPhoneMask();
        setupYouTubePlayers();
        setupImageZoom();
    }
});
