import type { RequestHandler } from 'express';
import { getFirebaseAuth } from './firebase-admin.js';

function isInvalidTokenError(error: unknown): boolean {
  if (!(error instanceof Error) || !('code' in error)) return false;
  const code = error.code;
  return typeof code === 'string' && [
    'auth/argument-error',
    'auth/invalid-id-token',
    'auth/id-token-expired',
    'auth/id-token-revoked',
  ].includes(code);
}

export const requireFirebaseAuth: RequestHandler = async (req, res, next) => {
  const authorization = req.get('authorization');
  const match = authorization?.match(/^Bearer ([^\s]+)$/i);
  if (!match) {
    res.status(401).json({ error: 'Token de autenticação não fornecido' });
    return;
  }

  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(match[1]);
    res.locals.userId = decodedToken.uid;
    next();
  } catch (error) {
    if (isInvalidTokenError(error)) {
      res.status(401).json({ error: 'Token de autenticação inválido ou expirado' });
      return;
    }

    console.error('Falha ao verificar token Firebase', error);
    res.status(503).json({ error: 'Serviço de autenticação temporariamente indisponível' });
  }
};
