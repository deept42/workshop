/**
 * @file script.js
 * @description Controla a interatividade da página de formato "folder".
 */

// Aguarda o carregamento completo do HTML antes de executar os scripts.
document.addEventListener('DOMContentLoaded', () => {

    const folderContainer = document.getElementById('folder-container');
    const panels = document.querySelectorAll('.folder-panel');
    
    // Seleciona TODOS os links da página que apontam para uma âncora (#)
    // Isso inclui o menu principal, o botão de inscrição e os links internos.
    const allNavLinks = document.querySelectorAll('a[href^="#"]'); // 1. Não utilizado, mas mantido para clareza

    // Variável de estado compartilhada para controlar o arrasto
    let isDragging = false;

    // --- 1. FUNÇÃO PARA ROLAGEM HORIZONTAL COM O MOUSE ---
    // Converte a rolagem vertical do mouse em rolagem horizontal.
    function handleHorizontalScroll(event) {
        // A verificação `event.deltaY !== 0` previne disparos em touchpads.
        if (event.deltaY !== 0) {
            event.preventDefault();
            folderContainer.scrollLeft += event.deltaY;
        }
    }

    // --- 2. FUNÇÃO PARA NAVEGAÇÃO SUAVE PELOS LINKS ---
    // Faz os links do menu rolarem a página para a seção correta.
    function setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(link => { // 2. Seleção direta para evitar variável não utilizada
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const targetId = this.getAttribute('href');
                const targetPanel = document.querySelector(targetId);
                
                if (targetPanel) {
                    // Usando scrollIntoView para uma rolagem mais robusta e garantida.
                    // O comportamento 'smooth' já está definido no CSS, mas podemos reforçar aqui.
                    targetPanel.scrollIntoView({ behavior: 'smooth', inline: 'start' });
                }
            });
        });
    }

    // --- 3. FUNÇÃO PARA ATUALIZAR O LINK ATIVO NO MENU ---
    // Observa qual painel está visível e destaca o link correspondente.
    function updateActiveNavLink() {
        const observerOptions = {
            root: folderContainer,
            threshold: 0.5 // O painel deve estar 50% visível
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Pega o link do menu principal que corresponde ao painel visível
                const activeLink = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);

                // Seleciona todos os elementos para animar dentro do painel atual
                const elementsToAnimate = entry.target.querySelectorAll('.animate-on-scroll');

                if (entry.isIntersecting) {
                    // Primeiro, remove a classe ativa de todos os links do menu
                    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active-link'));
                    if (activeLink) {
                        // Adiciona a classe se o href do link corresponder ao ID do painel visível
                        activeLink.classList.add('active-link');
                    }
                    // Adiciona a classe 'is-visible' para disparar a animação
                    elementsToAnimate.forEach(el => el.classList.add('is-visible'));
                } else {
                    // Opcional: Remove a classe quando o painel sai da tela para re-animar se o usuário voltar
                    elementsToAnimate.forEach(el => el.classList.remove('is-visible')); // 3. Chave extra removida
                }
            });
        }, observerOptions);

        panels.forEach(panel => observer.observe(panel));
    }

    // --- 4. FUNÇÃO PARA NAVEGAÇÃO PELO TECLADO ---
    // Permite usar as setas Esquerda e Direita para navegar.
    function setupKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            // Calcula a largura de um painel (100vw)
            const panelWidth = window.innerWidth;
            if (event.key === 'ArrowRight') {
                folderContainer.scrollBy({ left: panelWidth, behavior: 'smooth' });
            } else if (event.key === 'ArrowLeft') {
                folderContainer.scrollBy({ left: -panelWidth, behavior: 'smooth' });
            }
        });
    }

    // --- 5. FUNÇÃO PARA ROLAGEM COM ARRASTO DO MOUSE ---
    // Simula o comportamento de "arrastar para rolar" de telas de toque.
    function setupDragToScroll() {
        let isDown = false;
        let startX;
        let scrollLeft;

        folderContainer.addEventListener('mousedown', (e) => {
            isDown = true;
            isDragging = false; // Reseta o estado de arrasto a cada clique
            folderContainer.classList.add('active-drag'); // Adiciona classe para feedback visual (cursor)
            startX = e.pageX - folderContainer.offsetLeft;
            scrollLeft = folderContainer.scrollLeft;
        });

        folderContainer.addEventListener('mouseleave', () => {
            if (!isDown) return;
            isDown = false;
            folderContainer.classList.remove('active-drag');
        });

        folderContainer.addEventListener('mouseup', () => {
            if (!isDown) return;
            const wasDragging = isDragging; // Salva o estado de arrasto
            isDown = false;
            isDragging = false; // Reseta o estado de arrasto
            folderContainer.classList.remove('active-drag');
            // Se não estava arrastando, permite que o evento de clique prossiga.
            // Se estava, o clique já foi prevenido no 'mousemove'.
        });

        folderContainer.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            // Previne o comportamento padrão (como seleção de texto) apenas se o arrasto começar.
            const x = e.pageX - folderContainer.offsetLeft;
            const walk = x - startX;

            // Só começa a arrastar se o mouse se mover por mais de 5 pixels
            if (Math.abs(walk) > 5) {
                e.preventDefault(); // CORRETO: Previne o padrão apenas quando o arrasto é confirmado.
                isDragging = true;
                folderContainer.scrollLeft = scrollLeft - walk * 2; // O multiplicador *2 aumenta a sensibilidade
            }
        });
    }

    // --- 6. FUNÇÃO PARA NAVEGAÇÃO POR CLIQUE NAS LATERAIS ---
    // Permite clicar nos lados da tela para navegar entre os painéis.
    function setupSideClickNavigation() {
        folderContainer.addEventListener('click', (event) => {
            // Ignora o clique se o usuário estava arrastando ou clicou em um elemento interativo.
            if (isDragging || event.target.closest('a, button, input, select, form')) {
                return;
            }

            const screenWidth = window.innerWidth;
            const clickX = event.clientX;
            
            // CORREÇÃO: Define as áreas de clique para 20% em cada lado, igual ao cursor.
            const leftClickArea = screenWidth * 0.20;
            const rightClickArea = screenWidth * 0.80;

            const panelWidth = window.innerWidth;

            if (clickX < leftClickArea) {
                // Clicou na área esquerda
                folderContainer.scrollBy({ left: -panelWidth, behavior: 'smooth' });
            } else if (clickX > rightClickArea) {
                // Clicou na área direita
                folderContainer.scrollBy({ left: panelWidth, behavior: 'smooth' });
            }
        });
    }

    // --- 7. FUNÇÃO PARA CURSOR DINÂMICO NAS LATERAIS ---
    // Muda o cursor para uma seta apenas nas bordas da tela.
    function setupDynamicCursor() {
        // SVGs para as setas (preta e branca)
        const arrowRightBlack = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>') 16 16, auto`; // 4.
        const arrowLeftBlack = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>') 16 16, auto`; // 5.
        const arrowRightWhite = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>') 16 16, auto`; // 6.
        const arrowLeftWhite = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>') 16 16, auto`; // 7.

        folderContainer.addEventListener('mousemove', (event) => {
            // Se o mouse estiver sobre um elemento interativo, usa o cursor padrão dele.
            if (event.target.closest('a, button, input, select, form')) {
                folderContainer.style.cursor = 'auto';
                return;
            }

            const screenWidth = window.innerWidth;
            const mouseX = event.clientX;

            // Define as áreas de ativação do cursor (20% em cada lado)
            const leftZone = screenWidth * 0.20;
            const rightZone = screenWidth * 0.80;

            // Verifica se o painel atual tem fundo escuro (pela classe .hero-bg)
            const isDarkBg = event.target.closest('.hero-bg');

            if (mouseX < leftZone) {
                folderContainer.style.cursor = isDarkBg ? arrowLeftWhite : arrowLeftBlack;
            } else if (mouseX > rightZone) {
                folderContainer.style.cursor = isDarkBg ? arrowRightWhite : arrowRightBlack;
            } else {
                // No meio da tela, o cursor volta ao normal
                folderContainer.style.cursor = 'auto';
            }
        });
    }

    // --- 8. FUNÇÃO PARA O MENU HAMBÚRGUER ---
    // Controla a abertura e fechamento do menu em telas pequenas.
    function setupMobileMenu() {
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileLinks = document.querySelectorAll('.mobile-link');

        if (!hamburgerBtn || !mobileMenu) return;

        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
            // Força o navegador a aplicar a transição de opacidade
            setTimeout(() => mobileMenu.style.opacity = mobileMenu.classList.contains('open') ? '1' : '0', 10);
        });

        // Fecha o menu ao clicar em um link
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                mobileMenu.style.opacity = '0';
            });
        });
    }

    // --- 9. FUNÇÃO PARA CONTAGEM REGRESSIVA ---
    // Mostra um contador até a data do evento.
    function setupCountdown() {
        const countdownElement = document.getElementById('countdown-timer');
        if (!countdownElement) return;

        // Define a data do evento (13 de Novembro do ano corrente)
        const eventDate = new Date(new Date().getFullYear(), 10, 13).getTime(); // Mês 10 é Novembro (0-11)

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = eventDate - now;

            // Cálculos de tempo
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Monta o HTML do contador
            countdownElement.innerHTML = `
                <div class="countdown-item"><span class="countdown-number">${days}</span><span class="countdown-label">Dias</span></div>
                <div class="countdown-item"><span class="countdown-number">${hours}</span><span class="countdown-label">Horas</span></div>
                <div class="countdown-item"><span class="countdown-number">${minutes}</span><span class="countdown-label">Min</span></div>
                <div class="countdown-item"><span class="countdown-number">${seconds}</span><span class="countdown-label">Seg</span></div>
            `;

            // Se a contagem terminar, exibe uma mensagem
            if (distance < 0) {
                clearInterval(interval);
                const container = document.getElementById('countdown-container');
                if (container) {
                    container.innerHTML = `<div class="countdown-wrapper px-6 py-3 text-white font-bold text-lg">É HOJE! O EVENTO COMEÇOU!</div>`;
                }
            }
        }, 1000);
    }

    // --- INICIALIZAÇÃO ---
    // Adiciona os "escutadores" de eventos se os elementos existirem.
    if (folderContainer) {
        folderContainer.addEventListener('wheel', handleHorizontalScroll, { passive: false });
        setupSmoothScrolling();
        updateActiveNavLink();
        setupKeyboardNavigation();
        setupDragToScroll();
        setupSideClickNavigation();
        setupDynamicCursor();
        setupMobileMenu();
        setupCountdown();
    }
});
