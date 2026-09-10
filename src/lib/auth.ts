import { supabase } from '@/integrations/supabase/client';

// O sistema usa um usuário único. O nome de usuário é convertido em um
// e-mail interno; a validação da senha acontece no servidor (Auth).
const EMAIL_DOMAIN = '@estoquejb.app';

function toEmail(user: string): string {
  const value = user.trim().toLowerCase();
  return value.includes('@') ? value : `${value}${EMAIL_DOMAIN}`;
}

export async function login(user: string, pass: string): Promise<boolean> {
  const { error } = await supabase.auth.signInWithPassword({
    email: toEmail(user),
    password: pass,
  });
  if (error) {
    console.error('Falha no login:', error.message);
    return false;
  }
  return true;
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function isAuthenticated(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  return !!data.user;
}
