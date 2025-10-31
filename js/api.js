/**
 * @file Módulo de API para interagir com o Supabase.
 * @description Centraliza todas as chamadas ao banco de dados relacionadas aos inscritos.
 */

import { supabase } from './supabaseClient.js';

/**
 * Busca todos os inscritos no banco de dados.
 * @returns {Promise<Array>} Uma lista de inscritos.
 * @throws {Error} Se a busca falhar.
 */
export async function fetchInscritos() {
    const { data, error } = await supabase
        .from('cadastro_workshop')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar inscritos:', error);
        throw new Error('Não foi possível carregar os dados dos inscritos.');
    }
    return data;
}

/**
 * Insere um novo inscrito no banco de dados.
 * @param {object} inscritoData - Os dados do novo inscrito.
 * @returns {Promise<object>} Os dados do inscrito inserido.
 * @throws {Error} Se a inserção falhar.
 */
export async function addInscrito(inscritoData) {
    const { data, error } = await supabase
        .from('cadastro_workshop')
        .insert([inscritoData])
        .select()
        .single();

    if (error) {
        console.error('Erro ao adicionar inscrito:', error);
        throw error; // Lança o erro para ser tratado pela UI
    }
    return data;
}

/**
 * Atualiza um inscrito existente.
 * @param {string} id - O ID do inscrito a ser atualizado.
 * @param {object} updates - Os campos a serem atualizados.
 * @returns {Promise<object>} Os dados do inscrito atualizado.
 * @throws {Error} Se a atualização falhar.
 */
export async function updateInscrito(id, updates) {
    const { data, error } = await supabase
        .from('cadastro_workshop')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Erro ao atualizar inscrito:', error);
        throw new Error('Não foi possível salvar as alterações.');
    }
    return data;
}

/**
 * Atualiza múltiplos inscritos de uma vez.
 * @param {string[]} ids - Array de IDs dos inscritos a serem atualizados.
 * @param {object} updates - Os campos a serem atualizados.
 * @throws {Error} Se a atualização falhar.
 */
export async function updateInscritosBatch(ids, updates) {
    const { error } = await supabase
        .from('cadastro_workshop')
        .update(updates)
        .in('id', ids);

    if (error) {
        console.error('Erro ao atualizar inscritos em lote:', error);
        throw new Error('Não foi possível completar a ação em lote.');
    }
}

/**
 * Deleta inscritos permanentemente.
 * @param {string[]} ids - Array de IDs dos inscritos a serem deletados.
 * @throws {Error} Se a exclusão falhar.
 */
export async function deleteInscritosPermanently(ids) {
    const { error } = await supabase
        .from('cadastro_workshop')
        .delete()
        .in('id', ids);

    if (error) {
        console.error('Erro ao deletar inscritos:', error);
        throw new Error('Não foi possível excluir os itens permanentemente.');
    }
}

/**
 * Busca um único inscrito pelo seu ID.
 * @param {string} id - O ID do inscrito.
 * @returns {Promise<object>} Os dados do inscrito.
 */
export async function fetchInscritoById(id) {
    return supabase.from('cadastro_workshop').select('*').eq('id', id).single();
}