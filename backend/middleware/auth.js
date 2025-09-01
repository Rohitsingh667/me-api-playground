export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Basic ')) {
    return res.status(401).set('WWW-Authenticate', 'Basic realm="Write Access"').json({ error: 'Authentication required' });
  }
  const base64 = authHeader.replace('Basic ', '');
  let decoded;
  try {
    decoded = Buffer.from(base64, 'base64').toString('utf-8');
  } catch (e) {
    return res.status(400).json({ error: 'Invalid authorization header' });
  }
  const [user, pass] = decoded.split(':');
  const expectedUser = process.env.BASIC_USER || 'admin';
  const expectedPass = process.env.BASIC_PASS || 'admin';
  if (user === expectedUser && pass === expectedPass) return next();
  return res.status(403).json({ error: 'Forbidden' });
}
