/**
 * @file Gerencia a autenticação de administradores usando Supabase Auth.
 */

import { supabase } from './supabaseClient.js';
import { mostrarNotificacao } from './notificacoes.js';
import { mostrarModalErro, mostrarModalSucesso, mostrarModalSucessoLogin } from './formulario.js';

/**
 * Configura o formulário de login para autenticar com o Supabase.
 */
export function configurarLoginAdmin() {
    const attachLoginHandler = (form) => {
        if (!form || form.dataset.loginBound === 'true') return;

        form.dataset.loginBound = 'true';

        form.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const emailInput = form.elements['login-email'];
            const passwordInput = form.elements['login-password'];
            const submitButton = form.querySelector('button[type="submit"]');

            if (!emailInput || !passwordInput || !submitButton) return;

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            const originalButtonContent = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span>Verificando...</span>';

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                mostrarNotificacao('Usuário ou senha inválidos.', 'erro');
                console.error('Erro de autenticação:', error.message);
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonContent;
            } else {
                mostrarNotificacao(`Login realizado com sucesso! Bem-vindo, ${data.user.email}. Redirecionando...`, 'sucesso');
                submitButton.innerHTML = '<span>Redirecionando...</span>';
                window.location.href = 'admin.html';
            }
        });
    };

    document.querySelectorAll('[data-admin-login-form]').forEach(attachLoginHandler);

    window.__attachAdminLoginForm = attachLoginHandler;
}

/**
 * Realiza o logout do usuário no Supabase e exibe um feedback visual.
 */
export async function fazerLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Erro ao fazer logout:', error.message);
        mostrarNotificacao('Ocorreu um erro ao tentar sair. Por favor, tente novamente.', 'erro');
    } else {
        // Apenas exibimos a confirmação de sucesso. O onAuthStateChange cuidará de atualizar a UI.
        mostrarNotificacao('Você saiu da sua conta com sucesso.', 'info');
    }
}