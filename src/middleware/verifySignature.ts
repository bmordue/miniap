import { Request, Response, NextFunction } from 'express';
import * as httpSignature from 'http-signature';
import { actor } from '../staticData';

const verifySignature = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const parsedSignature = httpSignature.parseRequest(req);
    const publicKey = actor.publicKey?.publicKeyPem;

    if (!publicKey) {
      res.status(400).json({ error: 'Public key not found' });
      return;
    }

    const verified = httpSignature.verifySignature(parsedSignature, publicKey);

    if (!verified) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    next();
  } catch (error) {
    res.status(400).json({ error: 'Signature verification failed' });
  }
};

export default verifySignature;
