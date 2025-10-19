/**
 * @file Gerencia componentes de interface do usuário (UI), como contagem regressiva e zoom de imagem.
 */

/**
 * Configura e exibe uma contagem regressiva até a data do evento.
 */
export function configurarContagemRegressiva() {
    const elementoContador = document.getElementById('countdown-timer');
    if (!elementoContador) return;

    elementoContador.innerHTML = `
        <div class="countdown-item"><span id="cd-dias" class="countdown-number">0</span><span class="countdown-label">Dias</span></div>
        <div class="countdown-item"><span id="cd-horas" class="countdown-number">0</span><span class="countdown-label">Horas</span></div>
        <div class="countdown-item"><span id="cd-minutos" class="countdown-number">0</span><span class="countdown-label">Min</span></div>
        <div class="countdown-item"><span id="cd-segundos" class="countdown-number">0</span><span class="countdown-label">Seg</span></div>
    `;
    const elDias = document.getElementById('cd-dias');
    const elHoras = document.getElementById('cd-horas');
    const elMinutos = document.getElementById('cd-minutos');
    const elSegundos = document.getElementById('cd-segundos');

    if (!elDias || !elHoras || !elMinutos || !elSegundos) return;

    const dataEvento = new Date(2025, 10, 13).getTime(); // Mês 10 é Novembro (0-11)

    const intervalo = setInterval(() => {
        const agora = new Date().getTime();
        const distancia = dataEvento - agora;
        
        if (distancia >= 0) {
            elDias.textContent = Math.floor(distancia / (1000 * 60 * 60 * 24));
            elHoras.textContent = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            elMinutos.textContent = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
            elSegundos.textContent = Math.floor((distancia % (1000 * 60)) / 1000);
        } else {
            clearInterval(intervalo);
            elementoContador.innerHTML = `<p class="font-bold text-lg">O EVENTO COMEÇOU!</p>`;
        }
    }, 1000);
}

/**
 * Configura a funcionalidade de clique para ampliar a imagem do palestrante.
 */
export function configurarZoomImagem() {
    const imagemPalestrante = document.getElementById('speaker-image-paula');
    const overlay = document.getElementById('image-zoom-overlay');
    const imagemAmpliada = document.getElementById('zoomed-image');

    if (!imagemPalestrante || !overlay || !imagemAmpliada) return;

    const abrirZoom = () => {
        imagemAmpliada.src = imagemPalestrante.src;
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    };

    const fecharZoom = () => {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
        setTimeout(() => {
            imagemAmpliada.src = ""; // Limpa a imagem para economizar memória
        }, 300);
    };

    imagemPalestrante.addEventListener('click', abrirZoom);
    overlay.addEventListener('click', fecharZoom);
}