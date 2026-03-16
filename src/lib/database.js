import { supabase } from './supabase';

// ============================================
// AUTH
// ============================================
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ============================================
// PROFILE
// ============================================
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertProfile(userId, profileData) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...profileData, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// TRANSACTIONS
// ============================================
export async function insertTransaction(userId, txn) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({ user_id: userId, ...txn, confirmed: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getTransactions(userId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(name, icon, color)')
    .eq('user_id', userId)
    .gte('transaction_date', since.toISOString().split('T')[0])
    .order('transaction_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getSpendingByCategory(userId, days = 7) {
  const txns = await getTransactions(userId, days);
  const byCategory = {};
  txns.filter(t => t.type === 'expense').forEach(t => {
    const catName = t.categories?.name || 'Other';
    if (!byCategory[catName]) {
      byCategory[catName] = { name: catName, icon: t.categories?.icon || '📦', color: t.categories?.color || '#9CA3AF', total: 0, count: 0 };
    }
    byCategory[catName].total += Number(t.amount);
    byCategory[catName].count += 1;
  });
  return Object.values(byCategory).sort((a, b) => b.total - a.total);
}

// ============================================
// CATEGORIES
// ============================================
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_default', true)
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function getCategoryByName(name) {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .ilike('name', name)
    .limit(1)
    .single();
  if (error) return null;
  return data;
}

// ============================================
// DAILY MOVES
// ============================================
export async function getTodaysMove(userId) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('daily_moves')
    .select('*')
    .eq('user_id', userId)
    .eq('generated_date', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function saveDailyMove(userId, move) {
  const { data, error } = await supabase
    .from('daily_moves')
    .insert({
      user_id: userId,
      move_text: move.move_text,
      move_type: move.move_type,
      potential_savings: move.potential_savings,
      generated_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// CHAT MESSAGES
// ============================================
export async function getChatHistory(userId, limit = 50) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function saveChatMessage(userId, role, content, parsedTransactionId = null) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      role,
      content,
      parsed_transaction_id: parsedTransactionId
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
