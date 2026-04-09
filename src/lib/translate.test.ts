import test from 'node:test';
import assert from 'node:assert';
import { translateDescription } from './translate.ts';

test('translateDescription - Common algorithm phrases', () => {
  const cases = [
    ['Initialize an empty list', 'Inicializar um(a) vazio(a) list'],
    ['Initialize the counter', 'Inicializar the counter'],
    ['to store unique numbers encountered so far', 'para armazenar números únicos encontrados até agora'],
    ['to store data', 'para armazenar data'],
    ['Iterate through the array', 'Iterar pelo array'],
    ['First element is 1', 'O primeiro elemento é 1'],
    ['Check if element exists', 'Verificar se element exists'],
    ['is already in the list', 'já está no(a) list'],
    ['is already present', 'já está presente'],
    ['is in the box', 'está no(a) the box'],
    ['It is not found', 'Não está found'],
    ['It IS here', 'Ele JÁ here'],
    ['Add 5 to the set', 'Adicionar 5 ao(à) conjunto'],
    ['Move to the next element', 'Mover para o próximo elemento'],
    ['Move to the last element', 'Mover para o último elemento'],
    ['Since we found it', 'Como we found it'],
    ['was found in the set', 'foi encontrado no conjunto'],
    ['a duplicate exists', 'existe um duplicado'],
    ['Return Value of function', 'Valor de Retorno of function'],
    ['Return the result', 'Retornar the result'],
    ['empty hash set', 'hash set vazio'],
    ['hash set', 'hash set'],
    ['new set', 'new conjunto'],
  ];

  for (const [input, expected] of cases) {
    assert.strictEqual(translateDescription(input), expected, `Failed for input: ${input}`);
  }
});

test('translateDescription - Heuristic for Portuguese (isPt)', () => {
  assert.strictEqual(translateDescription('Vazio é o conjunto'), 'Vazio é o conjunto');
  assert.strictEqual(translateDescription('Adicionar um item'), 'Adicionar um item');
  assert.strictEqual(translateDescription('Próximo passo'), 'Próximo passo');
});

test('translateDescription - Mixed casing', () => {
  assert.strictEqual(translateDescription('INITIALIZE AN EMPTY'), 'Inicializar um(a) vazio(a)');
  assert.strictEqual(translateDescription('RETURN VALUE'), 'Valor de Retorno');
  assert.strictEqual(translateDescription('it is not'), 'Não está');
});

test('translateDescription - Multiple replacements', () => {
  assert.strictEqual(
    translateDescription('Initialize an empty hash set to store values'),
    'Inicializar um(a) vazio(a) hash set para armazenar values'
  );
});

test('translateDescription - No match', () => {
  assert.strictEqual(translateDescription('Hello world'), 'Hello world');
});
