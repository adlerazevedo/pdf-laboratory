/**
 * Sinalizador simples "existe trabalho não salvo nesta sessão" — usado só
 * para decidir se avisamos o usuário antes de recarregar/fechar a aba.
 * Não persiste nada; existe apenas em memória, e é reiniciado ao limpar a sessão.
 */
let active = false;

export function markSessionActive(): void {
  active = true;
}

export function hasActiveWork(): boolean {
  return active;
}

export function resetSessionActivity(): void {
  active = false;
}
