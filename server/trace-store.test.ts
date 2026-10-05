import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { TraceStore } from './trace-store.js';

test('separa listagem, atualização e remoção por usuário', (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'algo-trace-store-'));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const store = new TraceStore(path.join(directory, 'traces.json'));

  const traceA = store.create('uid-a', 'Privado A', { steps: [] });
  store.create('uid-b', 'Privado B', { steps: [] });

  assert.deepEqual(store.listForUser('uid-a').map((trace) => trace.title), ['Privado A']);
  assert.equal(store.getForUser(traceA.id, 'uid-b'), undefined);
  assert.equal(store.updateForUser(traceA.id, 'uid-b', { title: 'Acesso indevido' }), undefined);
  assert.equal(store.deleteForUser(traceA.id, 'uid-b'), false);
  assert.equal(store.getForUser(traceA.id, 'uid-a')?.title, 'Privado A');
});

test('importação é idempotente, preserva o UID e não sobrescreve dados locais', (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'algo-trace-migration-'));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const store = new TraceStore(path.join(directory, 'traces.json'));
  const firestoreTrace = {
    id: 'firestore-id',
    userId: 'firebase-uid',
    title: 'Trace migrado',
    trace: { steps: [] },
    savedAt: '2026-01-01T00:00:00.000Z',
  };

  assert.deepEqual(store.importTraces([firestoreTrace]), { imported: 1, skipped: 0 });
  assert.deepEqual(store.importTraces([firestoreTrace]), { imported: 0, skipped: 1 });
  assert.equal(store.listForUser('firebase-uid')[0].id, 'firestore-id');
  assert.equal(store.listForUser('outro-uid').length, 0);
});

test('recusa arquivo local corrompido sem substituir seu conteúdo', (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'algo-trace-corrupt-'));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, 'traces.json');
  fs.writeFileSync(filePath, '{invalid');
  const store = new TraceStore(filePath);

  assert.throws(() => store.listForUser('uid'), /ilegível/);
  assert.equal(fs.readFileSync(filePath, 'utf8'), '{invalid');
});
