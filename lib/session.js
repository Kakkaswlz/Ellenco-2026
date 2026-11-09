const crypto = require('crypto');

const configuredSecret = process.env.SESSION_SECRET;
if (process.env.NODE_ENV === 'production' && !configuredSecret) {
    throw new Error('SESSION_SECRET must be set in production.');
}
const secret = configuredSecret || crypto.randomBytes(32).toString('hex');
const SESSION_TTL_SECONDS = 12 * 60 * 60;

function issueSession(user) {
    const payload = Buffer.from(JSON.stringify({
        id: Number(user.id),
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
    })).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    return `${payload}.${signature}`;
}

function verifySession(token) {
    if (!token || typeof token !== 'string') return null;
    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra) return null;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest();
    let actual;
    try { actual = Buffer.from(signature, 'base64url'); } catch { return null; }
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
    try {
        const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!Number.isInteger(claims.id) || claims.id <= 0 || !Number.isInteger(claims.exp) || claims.exp <= Math.floor(Date.now() / 1000)) return null;
        return claims;
    } catch {
        return null;
    }
}

module.exports = { issueSession, verifySession };
