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
    const formLogin = document.getElementById('login-form');
    if (!formLogin) return;

    formLogin.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const email = formLogin.elements['login-email'].value;
        const password = formLogin.elements['login-password'].value;
        const botaoEntrar = formLogin.querySelector('button[type="submit"]');

        botaoEntrar.disabled = true;
        botaoEntrar.textContent = 'Verificando...';

        // Tenta fazer o login com o Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            // Se houver erro, mostra o modal de erro personalizado.
            mostrarNotificacao('Usuário ou senha inválidos.', 'erro');
            console.error('Erro de autenticação:', error.message);
            botaoEntrar.disabled = false;
            botaoEntrar.textContent = 'Entrar';
        } else {
            // Se o login for bem-sucedido, mostra o modal de sucesso.
            // A UI será atualizada pelo 'onAuthStateChange'.
            mostrarNotificacao(`Login realizado com sucesso! Bem-vindo, ${data.user.email}.`, 'sucesso');
            // Redireciona para o painel de administração após um breve delay
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1500); // 1.5 segundos para o usuário ler o modal
        }
    });
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