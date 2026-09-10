// Converte erros técnicos (banco de dados / rede) em mensagens amigáveis,
// sem expor detalhes internos como nomes de tabelas, colunas ou constraints.

const DB_ERROR_MAP: Record<string, string> = {
  '23502': 'Preencha todos os campos obrigatórios.',
  '23503': 'Não é possível concluir: este item está sendo usado em outro registro.',
  '23505': 'Este código já está cadastrado.',
  '23514': 'Dados inválidos. Verifique as informações e tente novamente.',
  '22001': 'Um dos campos tem texto muito longo.',
  '22003': 'Valor numérico fora do limite permitido.',
  '22P02': 'Dados inválidos. Verifique as informações e tente novamente.',
  '42501': 'Você não tem permissão para esta ação. Faça login novamente.',
  'PGRST301': 'Sua sessão expirou. Faça login novamente.',
};

// Mensagens vindas do banco (funções internas) traduzidas para o usuário
const RAISED_MAP: Record<string, string> = {
  NOT_AUTHENTICATED: 'Sua sessão expirou. Faça login novamente.',
  INSUFFICIENT_STOCK: 'Estoque insuficiente.',
  PRODUCT_NOT_FOUND: 'Produto não encontrado.',
  INVALID_TYPE: 'Tipo de movimentação inválido.',
  INVALID_QUANTITY: 'Informe uma quantidade válida.',
};

function looksTechnical(message: string): boolean {
  return /constraint|relation|column|duplicate key|violates|syntax|schema|permission denied for|row-level|pgrst|jwt|supabase|function .*\(/i.test(
    message,
  );
}

export function getErrorMessage(err: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  const anyErr = err as any;

  // Log completo apenas no console para diagnóstico
  if (err) console.error('Erro:', err);

  if (!anyErr) return fallback;

  const raw = typeof anyErr === 'string' ? anyErr : String(anyErr.message ?? '');

  for (const key of Object.keys(RAISED_MAP)) {
    if (raw.includes(key)) return RAISED_MAP[key];
  }

  const code = anyErr.code as string | undefined;
  if (code && DB_ERROR_MAP[code]) return DB_ERROR_MAP[code];

  // Erro de banco/rede (tem code, details ou hint) => mensagem genérica
  if (code || anyErr.details || anyErr.hint) return fallback;

  if (!raw) return fallback;
  if (looksTechnical(raw)) return fallback;

  // Mensagens escritas pelo próprio sistema podem ser exibidas
  return raw;
}
