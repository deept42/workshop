/**
 * @file Gerencia os controles de acessibilidade, como o ajuste de tamanho da fonte.
 */

/**
 * Configura os botões para aumentar, diminuir e resetar o tamanho da fonte da página.
 */
export function configurarControlesAcessibilidade() {
    const botaoAumentar = document.getElementById('font-increase-btn');
    const botaoDiminuir = document.getElementById('font-decrease-btn');
    const botaoResetar = document.getElementById('font-reset-btn');
    const elementoHtml = document.documentElement;

    if (!botaoAumentar || !botaoDiminuir || !botaoResetar) return;

    const passoMinimo = -3; // Limite de redução (ex: 70%)
    const passoMaximo = 4;  // Limite de aumento (ex: 140%)
    let passoAtual = 0;

    const atualizarTamanhoFonte = () => {
        // A cada passo, aumenta/diminui a fonte em 10% do tamanho original.
        const novoTamanho = 100 + (passoAtual * 10);
        elementoHtml.style.fontSize = `${novoTamanho}%`;
    };

    botaoAumentar.addEventListener('click', (e) => {
        e.preventDefault();
        if (passoAtual < passoMaximo) {
            passoAtual++;
            atualizarTamanhoFonte();
        }
    });

    botaoDiminuir.addEventListener('click', (e) => {
        e.preventDefault();
        if (passoAtual > passoMinimo) {
            passoAtual--;
            atualizarTamanhoFonte();
        }
    });

    botaoResetar.addEventListener('click', (e) => {
        e.preventDefault();
        passoAtual = 0;
        elementoHtml.style.fontSize = ''; // Remove o estilo para voltar ao padrão do CSS.
    });
}