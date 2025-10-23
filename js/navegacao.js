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
            // Ignora links que são apenas âncoras vazias (usados em botões de acessibilidade, etc.)
            // ou que não têm um alvo válido no documento.
            if (href === '#' || !document.querySelector(href)) return;

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
 * Adiciona um atalho de navegação para rolar para a próxima seção com o clique do meio do mouse.
 */
export function configurarNavegacaoMouseMeio() {
    document.addEventListener('mousedown', (evento) => {
        // A classe 'active-link' é adicionada ao link de navegação pela função 'atualizarLinkNavegacaoAtivo'.
        const linkAtivo = document.querySelector('.nav-link.active-link');
        if (evento.button === 1) { // Botão do meio do mouse
            evento.preventDefault(); 
            const painelVisivel = linkAtivo ? document.querySelector(linkAtivo.getAttribute('href')) : null;
            if (painelVisivel) {
                const proximoPainel = painelVisivel.nextElementSibling;
                if (proximoPainel && proximoPainel.classList.contains('folder-panel')) {
                    proximoPainel.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    });
}

/**
 * Gerencia a funcionalidade do menu hambúrguer para dispositivos móveis.
 */
export function configurarMenuMobile() {
    const botaoHamburger = document.getElementById('hamburger-btn');
    const menuOverlay = document.getElementById('mobile-menu');
    const linksMobile = document.querySelectorAll('.mobile-link');

    if (!botaoHamburger || !menuOverlay) return;

    botaoHamburger.addEventListener('click', () => {
        menuOverlay.classList.toggle('open');
    });

    linksMobile.forEach(link => {
        link.addEventListener('click', () => {
            menuOverlay.classList.remove('open');
        });
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

/**
 * Configura o botão de logout para chamar a função de logout do Supabase.
 * @param {Function} callbackLogout - A função a ser executada ao clicar no botão.
 */
export function configurarBotaoLogout(callbackLogout) {
    const botaoLogout = document.getElementById('logout-btn');
    if (botaoLogout) {
        botaoLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof callbackLogout === 'function') {
                callbackLogout();
            }
        });
    }
}