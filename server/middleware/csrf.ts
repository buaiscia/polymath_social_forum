import type { NextFunction, Request, Response } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const extractOrigin = (req: Request) => {
  if (typeof req.headers.origin === 'string') {
    return req.headers.origin;
  }

  const referer = req.headers.referer;
  if (typeof referer !== 'string' || referer.trim() === '') {
    return null;
  }

  try {
    const url = new URL(referer);
    return url.origin;
  } catch {
    return null;
  }
};

export const csrfProtection = (allowedOrigins: string[]) => {
  const whitelist = new Set(allowedOrigins.filter(Boolean));

  return (req: Request, res: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      return next();
    }

    if (whitelist.size === 0) {
      return next();
    }

    const origin = extractOrigin(req);
    if (!origin) {
      return res.status(403).json({ message: 'Missing Origin or Referer header.' });
    }

    if (whitelist.has(origin)) {
      return next();
    }

    return res.status(403).json({ message: 'Invalid request origin.' });
  };
};
