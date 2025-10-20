/**
 * @file Script de teste dedicado para a autenticação de login com o Supabase.
 * @description Este arquivo isola a lógica de login para facilitar a depuração.
 */

import { supabase } from './supabaseClient.js';

/**
 * Executa uma série de testes de login e exibe os resultados detalhados no console.
 */
export async function rodarTesteDeLogin() {
    const resultadosDiv = document.getElementById('test-results');
    resultadosDiv.innerHTML = '<h2>Resultados do Teste (verifique o console para detalhes):</h2>';

    console.log("--- INICIANDO TESTE DE LOGIN SUPABASE ---");

    // --- CENÁRIO 1: TENTATIVA DE LOGIN COM CREDENCIAIS CORRETAS ---
    // IMPORTANTE: Substitua com um e-mail e senha que VOCÊ SABE que existem no seu Supabase Auth.
    const emailCorreto = "admin@exemplo.com"; // <-- TROQUE AQUI
    const senhaCorreta = "senha-segura-123";   // <-- TROQUE AQUI

    console.log(`[CENÁRIO 1] Tentando login com usuário CORRETO: ${emailCorreto}`);
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: emailCorreto,
            password: senhaCorreta,
        });

        if (error) {
            console.error("[CENÁRIO 1] FALHOU! Ocorreu um erro ao tentar logar com credenciais que deveriam ser corretas.");
            console.error("OBJETO DE ERRO COMPLETO:", error);
            resultadosDiv.innerHTML += `<p style="color: red;">Cenário 1 (Correto) FALHOU: ${error.message}</p>`;
        } else {
            console.log("[CENÁRIO 1] SUCESSO! Login realizado.");
            console.log("DADOS DO USUÁRIO:", data.user);
            resultadosDiv.innerHTML += `<p style="color: green;">Cenário 1 (Correto) SUCESSO!</p>`;
        }
    } catch (e) {
        console.error("[CENÁRIO 1] Exceção capturada:", e);
    }

    console.log("-------------------------------------------------");

    // --- CENÁRIO 2: TENTATIVA DE LOGIN COM CREDENCIAIS INCORRETAS ---
    console.log(`[CENÁRIO 2] Tentando login com usuário INCORRETO: usuario.falso@naoexiste.com`);
    const { error: errorIncorreto } = await supabase.auth.signInWithPassword({
        email: "usuario.falso@naoexiste.com",
        password: "senha-errada-123",
    });

    console.log("[CENÁRIO 2] O Supabase retornou um erro (o que é o esperado).");
    console.log("OBJETO DE ERRO COMPLETO:", errorIncorreto);
    resultadosDiv.innerHTML += `<p style="color: blue;">Cenário 2 (Incorreto) retornou o erro esperado: ${errorIncorreto.message}</p>`;

    console.log("--- TESTE FINALIZADO ---");
}