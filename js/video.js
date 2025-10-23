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

    };
}