/**
 * @file Centraliza a criação do cliente Supabase para ser usado em toda a aplicação.
 */

const SUPABASE_URL = 'https://onqettyqcdyutkticrab.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucWV0dHlxY2R5dXRrdGljcmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Njg5OTksImV4cCI6MjA3NjI0NDk5OX0.LZJhIX3f0Jd3TxVo-YGHBVpiejLimGo-ClACeipilqc';

// Cria e exporta uma única instância do cliente Supabase.
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);