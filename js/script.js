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

    // --- 5. FUNÇÃO PARA OS BOTÕES DE NAVEGAÇÃO LATERAL ---
    function setupSideNavButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (!prevBtn || !nextBtn) return;

        prevBtn.addEventListener('click', () => {
            folderContainer.scrollBy({ left: -window.innerWidth, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            folderContainer.scrollBy({ left: window.innerWidth, behavior: 'smooth' });
        });
    }

    // --- 6. FUNÇÃO PARA O MENU HAMBÚRGUER ---
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

    // --- 7. FUNÇÃO PARA CONTAGEM REGRESSIVA ---
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
        setupSideNavButtons();
        setupMobileMenu();
        setupCountdown();
    }
});
