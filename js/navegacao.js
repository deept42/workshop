/**
 * @file Gerencia as funcionalidades de navegação do site.
 */

/**
 * Configura a rolagem suave para links âncora.
 */
export function configurarRolagemSuave() {
    const linksAncora = document.querySelectorAll('a[href^="#"]');
    if (linksAncora.length === 0) return;

    linksAncora.forEach(link => {
        link.addEventListener('click', function(evento) {
            const href = this.getAttribute('href');            
            // Ignora links que:
            // 1. Abrem em uma nova aba (target="_blank").
            // 2. São âncoras vazias (href="#").
            // 3. Não apontam para um elemento válido na página.
            if (this.getAttribute('target') === '_blank' || href === '#' || !document.querySelector(href)) return;

            evento.preventDefault();

            const idAlvo = this.getAttribute('href');
            const painelAlvo = document.querySelector(idAlvo);
            
            if (painelAlvo) {
                painelAlvo.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

/**
 * Gerencia a funcionalidade do menu hambúrguer para dispositivos móveis.
 */
export function configurarMenuMobile() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

    if (!hamburgerBtn || !mobileMenuOverlay) return;

    const openMenu = () => {
        mobileMenuOverlay.innerHTML = `
            <div class="mobile-menu-container">
                <header class="mobile-menu-header">
                    <a href="#inicio" class="mobile-menu-brand">
                        <img src="https://web.celepar.pr.gov.br/drupal/images/sesp/bombeiros/brasao_bombeiros_90x90.png" alt="CBMPR">
                        <span>WMRD-PR</span>
                    </a>
                    <button id="mobile-menu-close-btn" class="text-white p-2" aria-label="Fechar menu">
                        <span class="material-symbols-outlined text-[2.2rem]">close</span>
                    </button>
                </header>

                <nav class="mobile-menu-nav">
                    <a href="#inicio" class="nav-link-mobile nav-link-main"><span class="material-symbols-outlined">home</span><span>Início</span></a>
                    <a href="#sobre" class="nav-link-mobile nav-link-main"><span class="material-symbols-outlined">info</span><span>Sobre</span></a>
                    <a href="#programacao" class="nav-link-mobile nav-link-main"><span class="material-symbols-outlined">calendar_month</span><span>Programação</span></a>
                    <a href="#palestrantes" class="nav-link-mobile nav-link-main"><span class="material-symbols-outlined">mic</span><span>Palestrantes</span></a>
                    <a href="#informacoes" class="nav-link-mobile nav-link-main"><span class="material-symbols-outlined">help_center</span><span>Informações</span></a>
                    <a href="#inscricao" class="nav-link-mobile nav-link-main"><span class="material-symbols-outlined">edit_square</span><span>Inscrição</span></a>
                </nav>

                <div class="mobile-menu-footer">
                    <a href="#inscricao" class="mobile-menu-cta">
                        <span class="material-symbols-outlined">event_available</span>
                        <span>Garanta sua vaga</span>
                    </a>
                </div>
            </div>
        `;
        mobileMenuOverlay.classList.remove('hidden');
        document.body.classList.add('mobile-menu-open');

        // Adiciona listeners aos novos elementos
        document.getElementById('mobile-menu-close-btn').addEventListener('click', closeMenu);
        mobileMenuOverlay.querySelectorAll('.nav-link-mobile').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
        const ctaLink = mobileMenuOverlay.querySelector('.mobile-menu-cta');
        ctaLink?.addEventListener('click', closeMenu);
    };

    const closeMenu = () => {
        mobileMenuOverlay.classList.add('hidden');
        mobileMenuOverlay.innerHTML = ''; // Limpa o conteúdo para remover listeners
        document.body.classList.remove('mobile-menu-open');
    };

    const toggleMenu = () => {
        if (mobileMenuOverlay.classList.contains('hidden')) {
            openMenu();
        } else {
            closeMenu();
        }
    };

    hamburgerBtn.addEventListener('click', toggleMenu);

    // Fecha o menu com a tecla 'Esc'
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !mobileMenuOverlay.classList.contains('hidden')) {
            closeMenu();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024 && !mobileMenuOverlay.classList.contains('hidden')) {
            closeMenu();
        }
    });
}

/**
 * Controla a largura da barra de progresso de rolagem no topo da página.
 */
export function configurarBarraProgressoRolagem() {
    const barraProgresso = document.getElementById('progress-bar');
    if (!barraProgresso) return;

    window.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        // Garante que a altura total do conteúdo seja considerada
        const alturaRolavel = scrollHeight - clientHeight; 
        const porcentagemRolagem = alturaRolavel > 0 ? (scrollTop / alturaRolavel) * 100 : 0;
        barraProgresso.style.width = `${porcentagemRolagem}%`;
    });
}