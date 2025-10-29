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
            <button id="mobile-menu-close-btn" class="absolute top-4 right-4 text-white p-2">
                <span class="material-symbols-outlined text-4xl">close</span>
            </button>
            <nav class="flex flex-col items-center gap-6 text-center">
                <a href="#inicio" class="nav-link-mobile">Início</a>
                <a href="#sobre" class="nav-link-mobile">Sobre</a>
                <a href="#programacao" class="nav-link-mobile">Programação</a>
                <a href="#palestrantes" class="nav-link-mobile">Palestrantes</a>
                <a href="#inscricao" class="nav-link-mobile">Inscrição</a>
            </nav>
        `;
        mobileMenuOverlay.classList.remove('hidden');

        // Adiciona listeners aos novos elementos
        document.getElementById('mobile-menu-close-btn').addEventListener('click', closeMenu);
        mobileMenuOverlay.querySelectorAll('.nav-link-mobile').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    };

    const closeMenu = () => {
        mobileMenuOverlay.classList.add('hidden');
        mobileMenuOverlay.innerHTML = ''; // Limpa o conteúdo para remover listeners
    };

    hamburgerBtn.addEventListener('click', openMenu);

    // Fecha o menu com a tecla 'Esc'
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !mobileMenuOverlay.classList.contains('hidden')) {
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