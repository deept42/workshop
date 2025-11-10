// Carrossel de Palestrantes com Timer e Autoplay
export function configurarCarrosselPalestrantes() {
    const carouselTrack = document.getElementById('speakers-carousel-track');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    const indicatorsContainer = document.getElementById('carousel-indicators');
    
    if (!carouselTrack) return;
    
    // Dados dos palestrantes
    const speakers = [
        {
            name: 'Paula Scardino',
            photo: 'https://i.ibb.co/TMjGrYrG/200506-Paula-Scardino-0108-1.jpg',
            bio: [
                'Coordenação Nacional NBR 14.787 e 16.577 ABNT.',
                'Membro do Grupo de Trabalho Tripartite da NR-33.',
                'Comendadora Prevencionista 2024.',
                { type: 'link', text: 'www.paulascardino.com.br', url: 'http://www.paulascardino.com.br' }
            ]
        },
        {
            name: 'Maj QOBM Anderson Gomes das Neves',
            photo: 'https://i.ibb.co/fz1vFrxD/Whats-App-Image-2025-10-27-at-17-25-56.jpg',
            bio: [
                'Graduado em Segurança Pública pela Academia Policial Militar do Guatupê (2009).',
                'Major do Corpo de Bombeiros Militar do Paraná.',
                'Presta serviços na Coordenadoria Estadual de Proteção e Defesa Civil desde 2017, tendo atuado como chefe do Centro Estadual de gerenciamento de riscos e desastres.',
                'Possui especialização sobre gestão de Risco de Desastres para sustentabilidade e resiliência (Disaster Risk Reduction for Sustainability and Resilience) pela Agência de Cooperação Internacional do Japão - JICA (2018).',
                'É instrutor dos cursos de formação e especialização do Corpo de Bombeiros e Polícia, dentre eles as disciplinas de Climatologia e Fenômenos Naturais para o Curso de Formação de Oficiais.',
                'É graduado em Física pela Universidade Federal do Paraná e Teologia pela Faculdade Batista do Paraná.'
            ]
        },
        {
            name: 'Rogerio da Silva Felipe',
            photo: 'https://i.ibb.co/9kDX0jjM/Whats-App-Image-2025-10-27-at-17-24-57-1.jpg',
            bio: [
                'Geólogo - Núcleo de Especialistas da CEDEC PR.',
                'Especialista GTU, Gestão em Técnica Urbana.'
            ]
        },
        {
            name: 'Luciene Pimentel',
            photo: 'https://i.ibb.co/p6j773pM/Whats-App-Image-2025-10-27-at-17-25-17-1.jpg',
            bio: [
                'Ph.D. pela Universidade de Newcastle na Inglaterra (1997).',
                'Pós-doutora na Pontifícia Universidade Católica do Paraná (PUCPR) em Gestão e Tecnologias Ambientais.',
                'Professora do Programa de Pós-Graduação em Gestão Urbana (PPGTU/PUCPR).',
                'Coordenadora local na PUCPR da participação na Rede NAPI – Emergências Climáticas fomentada pela Fundação Araucária.',
                'Os interesses de pesquisa se voltam sobretudo para a Gestão e Redução dos Riscos de Desastres Climáticos nas Cidades dentro dos princípios do desenvolvimento sustentável, resiliência e do sócio-ambientalismo.',
                'Atualmente, é Vice-Presidente da ABES-PR (Associação Brasileira de Engenharia Sanitária no Paraná).'
            ]
        },
        {
            name: 'Cap QOBM Marcos Vidal da Silva Júnior',
            photo: 'https://ui-avatars.com/api/?name=Marcos+Vidal&background=062E51&color=fff&size=128',
            bio: [
                'Chefe de Gabinete e Assessor de Comunicação Social da Coordenadoria Estadual da Defesa Civil.',
                'Graduado em Segurança Pública pela Academia Policial Militar do Guatupê (2010).',
                'É Capitão do Corpo de Bombeiros Militar do Paraná. Presta serviços na Coordenadoria Estadual de Proteção e Defesa Civil desde 2012, tendo atuado no desenvolvimento de planejamento para preparação e resposta a desastres, assessoria de imprensa e chefia de gabinete.',
                'Foi representante da instituição em diversos Comitês Interinstitucionais.',
                'Possui especialização sobre Trabalho com Comunidades para Mitigação do Risco de Desastres (Raising Awareness for Disaster Risk Reduction) pela Agência de Cooperação Internacional do Japão - JICA (2014).',
                'Possui MBA em Relações Internacionais pela FGV (2022).',
                'É instrutor dos cursos de formação e especialização do Corpo de Bombeiros e Polícia Militar, dentre eles as disciplinas de Defesa Civil para o Curso de Formação de Oficiais.',
                'É doutorando em Meio Ambiente e Desenvolvimento pela UFPR.'
            ]
        },
        {
            name: 'Fernanda de Souza Sezerino',
            photo: 'https://i.ibb.co/LXRHCC6q/Whats-App-Image-2025-10-27-at-17-28-24.jpg',
            bio: [
                'Gestora Ambiental e Geógrafa, especialista em Gestão Pública e Mestra em Desenvolvimento Territorial Sustentável pela UFPR.',
                'Atualmente é docente do Instituto Federal do Paraná- campus Paranaguá, doutoranda em Geografia na UFPR e atua como Gestora de Projetos no Laboratório de Geoprocessamento e Estudos Ambientais (LAGEAMB-UFPR).',
                'Coordenou o Plano Municipal de Redução de Riscos de Paranaguá, financiado pelo Ministério das Cidades.',
                'Desenvolve pesquisas em Planejamento ambiental, Ordenamento territorial, Gestão integrada de riscos, Políticas Públicas socioambientais e Justiça Ambiental.'
            ]
        },
        {
            name: 'Rangel Ancelotti',
            photo: 'https://i.ibb.co/KxQdDrcN/Whats-App-Image-2025-10-27-at-17-27-58.jpg',
            bio: [
                'Professor da UFPR.',
                'Oceanógrafo, Mestre em sistemas costeiros e oceânicos e Doutor em meio ambiente e desenvolvimento.'
            ]
        },
        {
            name: 'Cel QOBM Ivan Ricardo Fernandes',
            photo: 'https://i.ibb.co/hR4Ft7GL/Whats-App-Image-2025-10-27-at-17-26-33.jpg',
            bio: [
                'Coordenador Executivo da Defesa Civil Estadual.',
                'Doutor em Meio Ambiente e Desenvolvimento Urbano.',
                'Mestre em Engenharia da Construção Civil.',
                'Graduado em Física e Engenharia Civil.'
            ]
        },
        {
            name: 'Ana Flávia Fogaça Zilli',
            photo: 'https://i.ibb.co/p6j773pM/Whats-App-Image-2025-10-27-at-17-25-17-1.jpg',
            bio: [
                'Mestranda no Programa de Pós-Graduação em Gestão Urbana da Pontifícia Universidade Católica do Paraná (PUCPR).',
                'É graduada em Gestão Pública pelo Instituto Federal do Paraná (IFPR) e especialista em Gestão de Cidades Inteligentes pelo Instituto Municipal de Administração Pública de Curitiba (IMAP).',
                'Atua como Analista da Informação no Instituto de Pesquisa e Planejamento Urbano de Curitiba (IPPUC), na Diretoria do Hipervisor Curitiba, desenvolvendo pesquisas aplicadas e análises de dados voltadas à gestão pública, planejamento urbano e governança.',
                'Tem interesse em temas relacionados à resiliência urbana, cidades inteligentes, participação cidadã e uso de dados para políticas públicas baseadas em evidências.'
            ]
        },
        {
            name: 'Luís Augusto Moraes Tavares',
            photo: 'https://i.ibb.co/XrWmqzLD/Whats-App-Image-2025-10-27-at-17-25-35-3.jpg',
            bio: [
                'Designer de produto.',
                'Bolsista de iniciação científica em Arquitetura e Urbanismo no Grupo de Estudos Cidades Verdes.'
            ]
        },
        {
            name: 'Edemilson de Barros',
            photo: 'https://i.ibb.co/XZPw4S2N/Whats-App-Image-2025-10-27-at-17-27-29-1.jpg',
            bio: [
                'Coronel do Corpo de Bombeiros do Paraná.',
                'Atualmente é Subcomandante Geral do CBMPR.',
                'Possui formação em História pela UFPR.',
                'Especializado em operações de busca e salvamento, resgate em montanha, gestão de incidentes médicos, operações com produtos perigosos, e espaços confinados.',
                'Realizou treinamentos no Brasil, Inglaterra e Estados Unidos, incluindo cursos na FAB, TRANSPETRO e OXIGEN.',
                'Atua há mais de 20 anos como instrutor em disciplinas técnicas no Corpo de Bombeiros.',
                'Foi instrutor da Força Nacional de Segurança Pública e professor convidado em cursos de pós-graduação na PUC/PR e UNIVILLE/SC, na área de emergências ambientais.',
                'Autor do e-book de atendimento a emergência com produtos perigosos publicado em 2020.'
            ]
        },
        {
            name: 'Cel QOBM Antônio Schinda',
            photo: 'https://i.ibb.co/m5J6zrgk/Whats-App-Image-2025-10-27-at-17-27-45.jpg',
            bio: [
                'Possui Doutorado em Ciências Policiais de Segurança e Ordem Pública (Curso Superior de Polícia) realizado no Centro de Altos Estudos em Segurança (CAES) da Polícia Militar do Estado de São Paulo concluído no ano de 2021.',
                'Mestrado em Educação pela Universidade do Oeste do Paraná concluído em 2013.',
                'Possui cursos complementares de Primeiros Socorros, Mergulhador de Resgate, Resgate em Corredeira, Combate a Incêndios Florestal, Combate a Incêndio Urbano, Resgate em Montanha, Resgate com Jet-Ski, Condutor de Embarcação Pública, Instrutor de Mergulho Autônomo Internacional pela PADI.'
            ]
        },
        {
            name: 'Rodrigo Brych',
            photo: 'https://i.ibb.co/8hLTsv0/Whats-App-Image-2025-10-29-at-10-00-17.jpg',
            bio: [
                'Coordenador de Obras da concessionária Arteris Litoral Sul.'
            ]
        },
        {
            name: 'Felipe Zacharias',
            photo: 'https://i.ibb.co/rDTskmT/Whats-App-Image-2025-10-28-at-15-20-43.jpg',
            bio: [
                'Assessor Especialista de Saúde e Segurança do Trabalho.',
                'Gestor Público.'
            ]
        },
        {
            name: 'Maj QOBM Luis Eduardo Zarpellon',
            photo: 'https://ui-avatars.com/api/?name=Luis+Zarpellon&background=062E51&color=fff&size=128',
            bio: [
                'Sub Cmt da Escola Superior de Bombeiros.'
            ]
        },
        {
            name: 'Cap QOBM Pedro Rocha de Faria',
            photo: 'https://i.ibb.co/9kcJXX85/Whats-App-Image-2025-11-03-at-15-48-57.jpg',
            bio: [
                'Integrante do Grupo de Operações de Socorro Tático do CBMPR.',
                'Geógrafo pela UFPR.'
            ]
        },
        {
            name: 'Bruna Nagel',
            photo: 'https://i.ibb.co/Z6zD7F00/Whats-App-Image-2025-11-03-at-10-58-52.jpg',
            bio: [
                'Coordenadora de Projetos da concessionária Arteris litoral Sul.'
            ]
        },
        {
            name: 'Angelo Mazzuchi Ferreira',
            photo: 'https://i.ibb.co/V0MsC91Y/Whats-App-Image-2025-10-27-at-17-28-10.jpg',
            bio: [
                'Promotor de Justiça titular da Promotoria de Justiça de Defesa da Saúde Pública de Curitiba e RM.'
            ]
        },
        {
            name: 'Marco Aurélio Nunes da Rocha',
            photo: 'https://i.ibb.co/RwLh43X/Whats-App-Image-2025-11-04-at-11-15-26.jpg',
            bio: [
                'Técnico em Segurança e em Controle Ambiental.',
                'Graduado em Química e em Segurança, Licenciado em Biologia e em Pedagogia.',
                'Mestre em Prevenção de Riscos.',
                'Pós-Graduado em Gerenciamento de Emergências e Desastres, em Segurança e Higiene Ocupacional, em Toxicologia Geral e em Segurança contra Incêndio e Pânico.',
                'Accredited by The Nautical Institute em On Scene Commander (MAC 4 - IMO 2).',
                'Certificado e acreditado como Instrutor NFPA 1041 (TEEX/USA) e como Instrutor de ICS 320 (Witt O\'brien\'s).',
                'Profissional atuando a mais de 25 anos na coordenação e atendimento a emergências industriais em terra e mar, atualmente ocupa o cargo de Gerente Setorial do Terminal da Transpetro.'
            ]
        },
        {
            name: 'Sidnei Furtado Fernandes',
            photo: 'https://ui-avatars.com/api/?name=Sidnei+Furtado&background=062E51&color=fff&size=128',
            bio: [
                'Professor (Campinas).'
            ]
        },
        {
            name: 'Marcelo Possamai',
            photo: 'https://i.ibb.co/GvzVxwjg/Whats-App-Image-2025-10-29-at-07-50-12.jpg',
            bio: [
                'Gerente de Operações.'
            ]
        }
    ];
    
    // Gerar cards dinamicamente
    carouselTrack.innerHTML = '';
    speakers.forEach((speaker, index) => {
        const card = document.createElement('div');
        card.className = `speaker-card-modern ${index === 0 ? 'active' : ''}`;
        card.setAttribute('data-index', index);
        
        const bioHTML = speaker.bio.map(item => {
            if (typeof item === 'object' && item.type === 'link') {
                return `<li><a href="${item.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline font-semibold">${item.text}</a></li>`;
            }
            return `<li>${item}</li>`;
        }).join('');
        
        card.innerHTML = `
            <div class="speaker-card-header">
                <div class="speaker-photo-wrapper">
                    <img src="${speaker.photo}" alt="Foto do(a) Palestrante ${speaker.name}" class="speaker-photo-modern">
                </div>
                <div class="speaker-header-info">
                    <h3 class="speaker-name-modern">${speaker.name}</h3>
                    <p class="speaker-title-modern">PALESTRANTE</p>
                </div>
            </div>
            <div class="speaker-card-body">
                <div class="speaker-bio-modern">
                    <ul class="speaker-bio-list">
                        ${bioHTML}
                    </ul>
                </div>
                <!-- Barra de Progresso do Timer - Agora dentro do card -->
                <div class="carousel-progress-container">
                    <div class="carousel-progress-bar" data-progress-bar="${index}"></div>
                </div>
            </div>
        `;
        
        carouselTrack.appendChild(card);
    });
    
    const cards = Array.from(carouselTrack.querySelectorAll('.speaker-card-modern'));
    if (cards.length === 0) return;
    
    let currentIndex = 0;
    let autoRotateTimeout;
    let isPaused = false;
    const autoRotateDelay = 5000; // 5 segundos
    
    // Criar indicadores
    cards.forEach((_, index) => {
        const indicator = document.createElement('button');
        indicator.className = 'carousel-indicator';
        indicator.setAttribute('aria-label', `Ir para palestrante ${index + 1}`);
        indicator.addEventListener('click', () => goToSlide(index));
        indicatorsContainer.appendChild(indicator);
    });
    
    const indicators = Array.from(indicatorsContainer.querySelectorAll('.carousel-indicator'));
    
    function updateCarousel() {
        // Atualizar cards
        cards.forEach((card, index) => {
            card.classList.toggle('active', index === currentIndex);
        });
        
        // Atualizar indicadores
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });
        
        // Resetar barra de progresso do card ativo
        resetProgressBar();
        startProgressBar();
    }
    
    function getCurrentProgressBar() {
        const activeCard = cards[currentIndex];
        if (!activeCard) return null;
        return activeCard.querySelector(`[data-progress-bar="${currentIndex}"]`);
    }
    
    function resetProgressBar() {
        const progressBar = getCurrentProgressBar();
        if (!progressBar) return;
        progressBar.style.transition = 'width 0s';
        progressBar.style.width = '0%';
        void progressBar.offsetWidth; // Force reflow
    }
    
    function startProgressBar() {
        const progressBar = getCurrentProgressBar();
        if (!progressBar) return;
        progressBar.style.transition = `width ${autoRotateDelay / 1000}s linear`;
        progressBar.style.width = '100%';
    }
    
    function goToSlide(index) {
        if (index < 0) index = cards.length - 1;
        if (index >= cards.length) index = 0;
        currentIndex = index;
        updateCarousel();
        resetAutoRotate();
    }
    
    function nextSlide() {
        goToSlide(currentIndex + 1);
    }
    
    function prevSlide() {
        goToSlide(currentIndex - 1);
    }
    
    function resetAutoRotate() {
        clearTimeout(autoRotateTimeout);
        if (!isPaused) {
            autoRotateTimeout = setTimeout(nextSlide, autoRotateDelay);
        }
    }
    
    function pauseAutoRotate() {
        isPaused = true;
        clearTimeout(autoRotateTimeout);
        const progressBar = getCurrentProgressBar();
        if (progressBar) {
            progressBar.style.animationPlayState = 'paused';
            progressBar.style.transition = 'none';
        }
    }
    
    function resumeAutoRotate() {
        isPaused = false;
        resetAutoRotate();
        const progressBar = getCurrentProgressBar();
        if (progressBar) {
            progressBar.style.animationPlayState = 'running';
        }
    }
    
    // Event listeners
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    
    // Pausar ao passar o mouse
    const carouselContainer = carouselTrack.closest('.speakers-carousel-modern');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', pauseAutoRotate);
        carouselContainer.addEventListener('mouseleave', resumeAutoRotate);
    }
    
    // Inicializar
    updateCarousel();
    resetAutoRotate();
}

