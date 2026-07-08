const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookie = require('cookie');

const COOKIE_NAME = 'ar_session';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Falta la variable de entorno JWT_SECRET.');
  }
  return secret;
}

function createSessionCookie(user) {
  const token = jwt.sign(
    { sub: user.id, username: user.username, nombre: user.nombre, rol: user.rol || 'editor' },
    getSecret(),
    { expiresIn: '7d' }
  );
  return cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

function clearSessionCookie() {
  return cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

function getUserFromReq(req) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, getSecret());
  } catch (err) {
    return null;
  }
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// Helper para proteger páginas del lado del servidor (getServerSideProps)
function requireUser(req) {
  const user = getUserFromReq(req);
  if (!user) return null;
  return user;
}

// Helper para proteger páginas/API exclusivas del administrador
function requireAdmin(req) {
  const user = getUserFromReq(req);
  if (!user || user.rol !== 'admin') return null;
  return user;
}

module.exports = {
  COOKIE_NAME,
  createSessionCookie,
  clearSessionCookie,
  getUserFromReq,
  hashPassword,
  verifyPassword,
  requireUser,
  requireAdmin,
};
