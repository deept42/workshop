/**
 * @file Gerencia a exibição de notificações (toasts) na interface.
 * @description Esta implementação constrói as notificações usando classes do Tailwind CSS diretamente,
 * evitando a necessidade de CSS personalizado e conflitos de estilo.
 */

/**
 * Mapeia os tipos de notificação para classes de cor do Tailwind e ícones.
 * @type {Object<string, {icon: string, colorClass: string}>}
 */
const TIPOS_NOTIFICACAO = {
    sucesso: { icon: 'check_circle', colorClass: 'bg-green-500' }, // Verde
    erro: { icon: 'error', colorClass: 'bg-red-500' },          // Vermelho
    aviso: { icon: 'warning', colorClass: 'bg-amber-500' },      // Amarelo
    info: { icon: 'info', colorClass: 'bg-slate-500' }        // Cinza
};

/**
 * Exibe uma notificação (toast) no canto da tela.
 * @param {string} mensagem - A mensagem a ser exibida.
 * @param {'sucesso'|'erro'|'aviso'|'info'} [tipo='info'] - O tipo de notificação.
 * @param {number} [duracao=4000] - Duração em milissegundos que a notificação fica na tela.
 */
export function mostrarNotificacao(mensagem, tipo = 'info', duracao = 4000) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const config = TIPOS_NOTIFICACAO[tipo] || TIPOS_NOTIFICACAO.info;

    // Cria o elemento da notificação
    const toast = document.createElement('div');

    // Aplica todas as classes de estilo do Tailwind
    toast.className = `
        flex items-center gap-4 p-4 rounded-lg shadow-lg text-white
        transform transition-all duration-300 ease-out
        translate-x-full opacity-0
        ${config.colorClass}
    `;

    // Define o conteúdo interno (ícone e texto)
    toast.innerHTML = `
        <span class="material-symbols-outlined text-2xl">${config.icon}</span>
        <div>
            <p class="font-bold text-sm">${mensagem}</p>
        </div>
    `;

    container.appendChild(toast);

    // Animação de entrada
    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    }, 50); // Pequeno delay para garantir que a transição CSS seja aplicada

    // Animação de saída e remoção do DOM
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duracao);
}

// Para uso global rápido, se necessário (opcional)
window.notificar = mostrarNotificacao;