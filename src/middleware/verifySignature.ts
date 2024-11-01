import { Request, Response, NextFunction } from 'express';
import * as httpSignature from 'http-signature';
import { getPublicKey } from '../services/userService';

const verifySignature = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedSignature = httpSignature.parseRequest(req);
    const publicKey = await getPublicKey(req.params.username);

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
