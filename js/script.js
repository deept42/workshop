/**
 * @file script.js
 * @description Controla a interatividade da página de formato "folder".
 */

// Aguarda o carregamento completo do HTML antes de executar os scripts.
document.addEventListener('DOMContentLoaded', () => {

    const folderContainer = document.getElementById('folder-container');
    const panels = document.querySelectorAll('.folder-panel');
    let currentVisiblePanel = null; // Variável para rastrear o painel visível
    
    /**
     * Configura a navegação por links âncora, fazendo a página rolar instantaneamente
     * para a seção correspondente ao clicar em um link.
     */
    function setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const targetId = this.getAttribute('href');
                const targetPanel = document.querySelector(targetId);
                
                if (targetPanel) {
                    // Usando scrollIntoView para uma rolagem mais robusta e garantida.
                    // O comportamento 'auto' (ou a ausência de 'behavior') garante o "snap" instantâneo.
                    targetPanel.scrollIntoView({ inline: 'start' });
                }
            });
        });
    }

    /**
     * Utiliza IntersectionObserver para:
     * 1. Rastrear o painel visível e atualizar o link ativo no menu de navegação.
     * 2. Disparar animações de entrada para os elementos dentro do painel visível.
     */
    function updateActiveNavLink() {
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

        panels.forEach(panel => observer.observe(panel));
    }

    /**
     * Controla a funcionalidade do menu hambúrguer para dispositivos móveis,
     * incluindo a abertura, fechamento e o clique nos links.
     */
    function setupMobileMenu() {
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileLinks = document.querySelectorAll('.mobile-link');

        if (!hamburgerBtn || !mobileMenu) return;

        hamburgerBtn.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('open');
            // Controla a transição de opacidade
            mobileMenu.style.opacity = isOpen ? '1' : '0';
        });

        // Fecha o menu ao clicar em um link
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                mobileMenu.style.opacity = '0';
            });
        });
    }

    /**
     * Configura e exibe um contador regressivo até a data do evento.
     * Otimizado para atualizar apenas os valores que mudam a cada segundo.
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
                const container = document.querySelector('.top-bar-content');
                if (container) {
                    container.innerHTML = `<p class="font-bold text-lg">É HOJE! O EVENTO COMEÇOU!</p>`;
                }
            }
        }, 1000);
    }

    /**
     * Implementa a funcionalidade de autocompletar para o campo de municípios.
     * Limita as sugestões para melhorar a performance e a usabilidade.
     */
    function setupAutocomplete() {
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

        input.addEventListener('input', () => {
            const value = input.value.toLowerCase();
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.classList.remove('hidden');

            if (value.length === 0) {
                suggestionsContainer.classList.add('hidden');
                return;
            }

            const filteredCities = cidadesParana.filter(city => city.toLowerCase().startsWith(value));

            filteredCities.slice(0, 5).forEach(city => {
                const suggestionItem = document.createElement('div');
                suggestionItem.classList.add('suggestion-item');
                suggestionItem.textContent = city;
                suggestionItem.addEventListener('click', () => {
                    input.value = city;
                    suggestionsContainer.classList.add('hidden');
                });
                suggestionsContainer.appendChild(suggestionItem);
            });

            if (filteredCities.length === 0) {
                suggestionsContainer.classList.add('hidden');
            }
        });

        document.addEventListener('click', (event) => {
            if (!event.target.closest('.autocomplete-container')) {
                suggestionsContainer.classList.add('hidden');
            }
        });
    }

    /**
     * Adiciona um atalho de navegação com o botão do meio do mouse.
     */
    function setupMiddleMouseNavigation() {
        document.addEventListener('mousedown', (event) => {
            if (event.button === 1) {
                event.preventDefault(); 
                if (currentVisiblePanel) {
                    const nextPanel = currentVisiblePanel.nextElementSibling;
                    if (nextPanel && nextPanel.classList.contains('folder-panel')) {
                        nextPanel.scrollIntoView({ inline: 'start' });
                    }
                }
            }
        });
    }

    /**
     * Controla a barra de progresso no topo da página.
     */
    function setupScrollProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        if (!progressBar || !folderContainer) return;

        folderContainer.addEventListener('scroll', () => {
            const scrollTop = folderContainer.scrollTop;
            const scrollHeight = folderContainer.scrollHeight;
            const clientHeight = folderContainer.clientHeight;
            
            const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
            
            progressBar.style.width = `${scrollPercent}%`;
        });
    }

    // --- INICIALIZAÇÃO ---
    if (folderContainer) {
        setupSmoothScrolling();
        updateActiveNavLink();
        setupMobileMenu();
        setupCountdown();
        setupAutocomplete();
        setupMiddleMouseNavigation();
        setupScrollProgressBar();
    }
});
