/**
 * @file Gerencia interações de UI específicas, como players de vídeo customizados.
 */

/**
 * Configura um player de vídeo customizado com uma sobreposição de "play".
 * Ao clicar na sobreposição, o vídeo inicia e os controles nativos são exibidos.
 */
export function configurarPlayerCustomizado() {
    const container = document.getElementById('planning-video-container');
    if (!container) return;

    const video = container.querySelector('#sobre-video');
    const overlay = container.querySelector('#video-sobre-overlay');

    if (!video || !overlay) return;

    overlay.addEventListener('click', () => {
        // Esconde a sobreposição
        overlay.classList.add('opacity-0', 'pointer-events-none');
        // Adiciona os controles nativos ao vídeo
        video.controls = true;
        // Inicia a reprodução do vídeo
        video.play();
    });
}