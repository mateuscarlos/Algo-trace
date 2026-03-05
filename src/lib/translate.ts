/** Traduz descrições em inglês para PT-BR, preservando palavras reservadas de programação */
const translationMap: [RegExp, string][] = [
  // Common algorithm descriptions
  [/\bInitialize an empty\b/gi, 'Inicializar um(a) vazio(a)'],
  [/\bInitialize\b/gi, 'Inicializar'],
  [/\bto store unique numbers encountered so far\b/gi, 'para armazenar números únicos encontrados até agora'],
  [/\bto store\b/gi, 'para armazenar'],
  [/\bIterate through the array\b/gi, 'Iterar pelo array'],
  [/\bFirst element is\b/gi, 'O primeiro elemento é'],
  [/\bCheck if\b/gi, 'Verificar se'],
  [/\bis already in the\b/gi, 'já está no(a)'],
  [/\bis already present\b/gi, 'já está presente'],
  [/\bis in\b/gi, 'está no(a)'],
  [/\bIt is not\b/gi, 'Não está'],
  [/\bIt IS\b/gi, 'Ele JÁ'],
  [/\bAdd\b/gi, 'Adicionar'],
  [/\bto the\b/gi, 'ao(à)'],
  [/\bMove to the next element\b/gi, 'Mover para o próximo elemento'],
  [/\bMove to the last element\b/gi, 'Mover para o último elemento'],
  [/\bSince\b/gi, 'Como'],
  [/\bwas found in the set\b/gi, 'foi encontrado no conjunto'],
  [/\ba duplicate exists\b/gi, 'existe um duplicado'],
  [/\bReturn\b/gi, 'Retornar'],
  [/\bReturn Value\b/gi, 'Valor de Retorno'],
  [/\bempty hash set\b/gi, 'hash set vazio'],
  [/\bhash set\b/gi, 'hash set'],
  [/\bset\b/gi, 'conjunto'],
];

export function translateDescription(text: string): string {
  // Check if text is already in Portuguese (simple heuristic)
  const ptKeywords = ['inicializar', 'verificar', 'adicionar', 'iterar', 'retornar', 'mover', 'próximo', 'vazio'];
  const lowerText = text.toLowerCase();
  const isPt = ptKeywords.some((kw) => lowerText.includes(kw));
  if (isPt) return text;

  let result = text;
  for (const [pattern, replacement] of translationMap) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
