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
    const toggleBtn = document.getElementById('nav-mobile-toggle');
    const panel = document.getElementById('mobile-nav-panel');
    const drawer = panel?.querySelector('.mobile-nav-panel__drawer');
    const closeBtn = document.getElementById('mobile-nav-close');

    if (!toggleBtn || !panel || !drawer || !closeBtn) return;

    const openMenu = () => {
        panel.classList.add('is-open');
        panel.setAttribute('aria-hidden', 'false');
        document.body.classList.add('mobile-menu-open');
    };

    const closeMenu = () => {
        if (!panel.classList.contains('is-open')) return;
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('mobile-menu-open');
    };

    toggleBtn.addEventListener('click', () => {
        if (panel.classList.contains('is-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    closeBtn.addEventListener('click', closeMenu);
    panel.addEventListener('click', (event) => {
        if (event.target === panel) {
            closeMenu();
        }
    });

    panel.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && panel.classList.contains('is-open')) {
            closeMenu();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            closeMenu();
        }
    });

    window.__closeMobileMenu = closeMenu;
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