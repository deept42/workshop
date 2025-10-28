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
 * Configura um player de vídeo customizado com uma sobreposição de "play".
 * Agora, inicializa o player de vídeo da Cloudinary.
 */
export function configurarPlayerCustomizado() {
    // Verifica se o SDK da Cloudinary está disponível
    if (typeof cloudinary === 'undefined') {
        console.error('SDK do player da Cloudinary não foi carregado.');
        return;
    }
    
    // Inicializa o player da Cloudinary
    const cld = cloudinary.Cloudinary.new({ cloud_name: 'dto462zj6' });
    cld.videoPlayer('sobre-player', {
        publicId: 'sobre_fftc7h',
        fluid: true, // Torna o player responsivo
        controls: true,
        // Define as novas cores para o player
        colors: { base: '#FF0000', accent: '#FF0007' }
    });
}

/**
 * Configura a abertura de um modal com a biografia completa do palestrante.
 */
export function configurarModalPalestrante() {
    const modal = document.getElementById('speaker-bio-modal');
    if (!modal) return;

    const closeBtn = document.getElementById('speaker-modal-close-btn');
    const modalPhoto = document.getElementById('modal-speaker-photo');
    const modalName = document.getElementById('modal-speaker-name');
    const modalTitle = document.getElementById('modal-speaker-title');
    const modalBio = document.getElementById('modal-speaker-bio');

    const openModal = (badge) => {
        // Coleta os dados do card do palestrante
        const photoSrc = badge.querySelector('.badge-photo')?.src;
        const name = badge.querySelector('.badge-name')?.textContent;
        const title = badge.querySelector('.badge-title')?.textContent;
        const bioHtml = badge.querySelector('.bio-full')?.innerHTML;

        // Preenche o modal com os dados
        if (modalPhoto) modalPhoto.src = photoSrc || '';
        if (modalName) modalName.textContent = name || 'Nome não encontrado';
        if (modalTitle) modalTitle.textContent = title || 'Título não encontrado';
        if (modalBio) modalBio.innerHTML = bioHtml || '<p>Biografia não disponível.</p>';

        // Exibe o modal
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('visible'), 10); // Adiciona a classe para a transição de opacidade
    };

    const closeModal = () => {
        modal.classList.remove('visible');
        // Aguarda a transição de opacidade terminar antes de esconder o elemento
        modal.addEventListener('transitionend', () => {
            modal.classList.add('hidden');
        }, { once: true });
    };

    // Adiciona evento de clique para cada botão "Ver Bio"
    document.querySelectorAll('.toggle-bio-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const badge = btn.closest('.speaker-badge');
            if (badge) openModal(badge);
        });
    });

    // Eventos para fechar o modal
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        // Fecha se clicar no overlay (fundo), mas não no conteúdo
        if (e.target === modal) {
            closeModal();
        }
    });
}
