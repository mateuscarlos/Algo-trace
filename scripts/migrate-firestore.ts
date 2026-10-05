import 'dotenv/config';
import path from 'node:path';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getFirebaseAuth } from '../server/firebase-admin.js';
import { TraceStore, isFirestoreTrace, type StoredTrace } from '../server/trace-store.js';

async function main(): Promise<void> {
  const auth = getFirebaseAuth();
  const firestore = getFirestore(auth.app);
  const snapshot = await firestore.collection('traces').get();

  const traces: StoredTrace[] = snapshot.docs.map((document) => {
    const data: unknown = document.data();
    if (!isFirestoreTrace(data)) {
      throw new Error(`Invalid Firestore document: ${document.id}`);
    }

    const savedAt = data.savedAt instanceof Timestamp
      ? data.savedAt.toDate().toISOString()
      : data.savedAt;
    if (
      typeof data.userId !== 'string'
      || typeof data.title !== 'string'
      || typeof savedAt !== 'string'
      || typeof data.trace !== 'object'
      || data.trace === null
      || (data.category !== undefined && typeof data.category !== 'string')
      || (data.tags !== undefined
        && (!Array.isArray(data.tags) || !data.tags.every((tag) => typeof tag === 'string')))
    ) {
      throw new Error(`Firestore document ${document.id} is missing required fields or its userId.`);
    }

    return {
      id: document.id,
      userId: data.userId,
      title: data.title,
      savedAt,
      trace: data.trace,
      ...(data.category ? { category: data.category } : {}),
      ...(Array.isArray(data.tags) && data.tags.length ? { tags: data.tags } : {}),
    };
  });

  const dataDir = process.env.DATA_DIR || './data';
  const store = new TraceStore(path.join(dataDir, 'traces.json'));
  const result = store.importTraces(traces);
  console.log(
    `Migração concluída: ${result.imported} importados, ${result.skipped} já existentes. `
    + 'Os documentos do Firestore não foram alterados.',
  );
}

main().catch((error: unknown) => {
  console.error('Falha na migração Firestore → JSON local:', error);
  process.exitCode = 1;
});
