/**
 * @file Controla as animações de rolagem e a atualização dos indicadores de navegação.
 */

/**
 * Usa o IntersectionObserver para:
 * 1. Atualizar qual link está ativo nos menus de navegação.
 * 2. Disparar animações de elementos quando eles entram na tela.
 */
export function atualizarLinkNavegacaoAtivo() {
    const paineis = document.querySelectorAll('.folder-panel');
    if (paineis.length === 0) return;

    let ultimosLinksAtivos = [];
    const indicadorNavEsquerda = document.getElementById('nav-indicator');
    const indicadorNavDireita = document.getElementById('nav-indicator-right');

    const opcoesObservador = {
        root: null,
        threshold: 0.5 // O painel deve estar 50% visível para ser considerado ativo.
    };

    const observador = new IntersectionObserver((entradas) => {
        entradas.forEach(entrada => {
            const elementosParaAnimar = entrada.target.querySelectorAll('.animate-on-scroll');

            if (entrada.isIntersecting) {
                const idAlvo = entrada.target.id;
                const linkAtivo = document.querySelector(`.nav-link[href="#${idAlvo}"]`);
                const todosLinksAlvo = document.querySelectorAll(`a[href="#${idAlvo}"]`);
                
                // Otimização: Remove a classe apenas dos links que estavam ativos antes.
                ultimosLinksAtivos.forEach(link => link.classList.remove('active-link'));
                
                // Adiciona a classe ativa a todos os links correspondentes (desktop e mobile).
                todosLinksAlvo.forEach(link => link.classList.add('active-link'));
                ultimosLinksAtivos = Array.from(todosLinksAlvo);

                // Move o indicador da navegação esquerda.
                const navEsquerda = document.getElementById('side-nav');
                if (indicadorNavEsquerda && linkAtivo && navEsquerda.contains(linkAtivo)) {
                    indicadorNavEsquerda.style.opacity = '1';
                    indicadorNavEsquerda.style.top = `${linkAtivo.offsetTop}px`;
                    indicadorNavEsquerda.style.height = `${linkAtivo.offsetHeight}px`;
                }

                // Move o indicador da navegação direita.
                const navDireita = document.getElementById('side-nav-right');
                const linkAtivoDireita = navDireita ? navDireita.querySelector(`.nav-link[href="#${idAlvo}"]`) : null;
                if (indicadorNavDireita && linkAtivoDireita) {
                    indicadorNavDireita.style.opacity = '1';
                    indicadorNavDireita.style.top = `${linkAtivoDireita.offsetTop}px`;
                    indicadorNavDireita.style.height = `${linkAtivoDireita.offsetHeight}px`;
                }

                // Adiciona a classe 'is-visible' para disparar a animação de entrada.
                elementosParaAnimar.forEach(el => el.classList.add('is-visible'));
            } else {
                // Opcional: Remove a classe quando o painel sai da tela para re-animar se o usuário voltar.
                elementosParaAnimar.forEach(el => el.classList.remove('is-visible'));
            }
        });
    }, opcoesObservador);

    // Observa todos os painéis.
    paineis.forEach(painel => observador.observe(painel));
}

/**
 * Recalcula a posição dos indicadores de navegação quando o tamanho dos menus muda
 * (ex: devido ao zoom do navegador ou da ferramenta de acessibilidade).
 */
export function configurarRecalculoIndicadorAoRedimensionar() {
    const navEsquerda = document.getElementById('side-nav');
    const navDireita = document.getElementById('side-nav-right');

    if (!window.ResizeObserver || !navEsquerda || !navDireita) return;

    const observador = new ResizeObserver(() => {
        // Encontra o link ativo para saber qual indicador ajustar.
        const linkAtivo = document.querySelector('.nav-link.active-link');
        if (linkAtivo) {
            // Atualiza o indicador esquerdo.
            const indicadorEsquerdo = document.getElementById('nav-indicator');
            if (indicadorEsquerdo && navEsquerda.contains(linkAtivo)) {
                indicadorEsquerdo.style.top = `${linkAtivo.offsetTop}px`;
            }

            // Atualiza o indicador direito.
            const indicadorDireita = document.getElementById('nav-indicator-right');
            if (indicadorDireita) {
                indicadorDireita.style.top = `${linkAtivo.offsetTop}px`;
            }
        }
    });

    if (navEsquerda) observador.observe(navEsquerda);
    if (navDireita) observador.observe(navDireita);
}