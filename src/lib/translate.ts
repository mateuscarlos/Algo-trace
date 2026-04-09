/** Traduz descrições em inglês para PT-BR, preservando palavras reservadas de programação */
const translationMap: [RegExp, string][] = [
  // Common algorithm descriptions - ordered from most specific to least specific
  [/\bto store unique numbers encountered so far\b/gi, 'para armazenar números únicos encontrados até agora'],
  [/\bMove to the next element\b/gi, 'Mover para o próximo elemento'],
  [/\bMove to the last element\b/gi, 'Mover para o último elemento'],
  [/\bIterate through the array\b/gi, 'Iterar pelo array'],
  [/\bwas found in the set\b/gi, 'foi encontrado no conjunto'],
  [/\bis already in the\b/gi, 'já está no(a)'],
  [/\bInitialize an empty\b/gi, 'Inicializar um(a) vazio(a)'],
  [/\ba duplicate exists\b/gi, 'existe um duplicado'],
  [/\bFirst element is\b/gi, 'O primeiro elemento é'],
  [/\bis already present\b/gi, 'já está presente'],
  [/\bempty hash set\b/gi, 'hash set vazio'],
  [/\bReturn Value\b/gi, 'Valor de Retorno'],
  [/\bInitialize\b/gi, 'Inicializar'],
  [/\bto store\b/gi, 'para armazenar'],
  [/\bCheck if\b/gi, 'Verificar se'],
  [/\bhash set\b/gi, 'hash set'], // SPECIFIC PHRASE PRESERVED
  [/\bIt is not\b/gi, 'Não está'],
  [/\bto the\b/gi, 'ao(à)'],
  [/\bReturn\b/gi, 'Retornar'],
  [/\bis in\b/gi, 'está no(a)'],
  [/\bIt IS\b/gi, 'Ele JÁ'],
  [/\bSince\b/gi, 'Como'],
  [/\bAdd\b/gi, 'Adicionar'],
  [/\b(?<!hash )set\b/gi, 'conjunto'], // ONLY REPLACE IF NOT PRECEDED BY 'hash '
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
