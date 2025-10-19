/**
 * @file Gerencia a criação e controle dos players de vídeo do YouTube.
 */

/**
 * Configura os players de vídeo do YouTube para o fundo e para a seção "Sobre".
 */
export function configurarPlayersYoutube() {
    // Esta função será chamada pela API do YouTube quando ela estiver pronta.
    window.onYouTubeIframeAPIReady = function() {
        
        // Função auxiliar para criar um player.
        const criarPlayer = (idElemento, idVideo, opcoesPlayer) => {
            if (!document.getElementById(idElemento)) return null;

            return new YT.Player(idElemento, {
                videoId: idVideo,
                playerVars: {
                    controls: 0, showinfo: 0, modestbranding: 1, loop: 1,
                    fs: 0, cc_load_policy: 0, iv_load_policy: 3, autohide: 0,
                    mute: 1, playlist: idVideo, // 'playlist' é necessário para o loop funcionar.
                    ...opcoesPlayer // Sobrescreve as configurações padrão.
                }
            });
        };

        // Player para o vídeo de fundo da seção de início.
        const playerFundo = criarPlayer('youtube-player', '9lJSGvqRjUc', {
            autoplay: 1,
            start: 50,
            end: 112
        });
        if (playerFundo) {
            playerFundo.addEventListener('onReady', (evento) => evento.target.playVideo());
        }

        // Player para o vídeo da seção "Sobre".
        const playerSobre = criarPlayer('planning-video-player', 'IhK0ju7oE_U', {
            autoplay: 0, // Não inicia automaticamente.
            mute: 0,     // Inicia com som.
            rel: 0       // Não mostra vídeos relacionados no final.
        });

        const botaoPlayCustom = document.getElementById('custom-play-button');

        if (playerSobre && botaoPlayCustom) {
            botaoPlayCustom.addEventListener('click', () => {
                playerSobre.playVideo();
            });

            playerSobre.addEventListener('onStateChange', (evento) => {
                // Esconde o botão de play quando o vídeo está tocando.
                const estaTocando = evento.data === YT.PlayerState.PLAYING;
                botaoPlayCustom.classList.toggle('hidden', estaTocando);
            });
        }
    };
}