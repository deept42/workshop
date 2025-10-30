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
    if (paineis.length === 0) return; // Se não houver painéis, não faz nada.

    const opcoesObservador = {
        root: null,
        rootMargin: '-50% 0px -50% 0px', // Ativa quando o painel está no meio da tela
        threshold: 0
    };

    const observador = new IntersectionObserver((entradas) => {
        entradas.forEach(entrada => {
            if (entrada.isIntersecting) {
                const idSecaoAtiva = entrada.target.id;
                // Seleciona todos os links de navegação que apontam para a seção ativa
                const linksCorrespondentes = document.querySelectorAll(`.nav-link-main[href="#${idSecaoAtiva}"], .nav-link-mobile[href="#${idSecaoAtiva}"]`);
                
                // Remove a classe de todos os links para garantir que apenas um esteja ativo
                document.querySelectorAll('.nav-link-main, .nav-link-mobile').forEach(link => link.classList.remove('active-link'));
                // Adiciona a classe ao link correto
                linksCorrespondentes.forEach(link => link.classList.add('active-link'));
                
                // Adiciona a classe 'is-visible' para disparar a animação de entrada.
                entrada.target.querySelectorAll('.animate-on-scroll').forEach(el => el.classList.add('is-visible'));
            } else {
                // Opcional: Remove a classe quando o painel sai da tela para re-animar se o usuário voltar.
                entrada.target.querySelectorAll('.animate-on-scroll').forEach(el => el.classList.remove('is-visible'));
            }
        });
    }, opcoesObservador);

    // Observa todos os painéis.
    paineis.forEach(painel => observador.observe(painel));
}

/**
 * Anima os números dos cards de destaque (contadores) quando eles entram na tela.
 */
export function configurarAnimacaoContadores() {
    const contadores = document.querySelectorAll('.highlight-number');
    if (contadores.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = +el.getAttribute('data-target');
                let current = 0;
                const increment = target / 100; // Controla a velocidade da animação

                const updateCounter = () => {
                    if (current < target) {
                        current += increment;
                        el.innerText = Math.ceil(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        el.innerText = target;
                    }
                };

                updateCounter();
                observer.unobserve(el); // Anima apenas uma vez
            }
        });
    }, {
        threshold: 0.5 // Inicia a animação quando 50% do elemento estiver visível
    });

    contadores.forEach(contador => {
        observer.observe(contador);
    });
}
