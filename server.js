require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = Number(process.env.PORT || 3000);

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET não configurado no .env');
}

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
};
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,  


const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

const sessionStore = new MySQLStore({
  ...dbConfig,
  clearExpired: true,
  checkExpirationInterval: 900000,
  expiration: 86400000
});

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  name: 'cardapio.sid',
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8
  }
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Não autenticado' });
  return res.redirect('/login.html');
}

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ id: req.session.userId, usuario: req.session.usuario });
});

app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const usuario = String(req.body.usuario || '').trim();
    const senha = String(req.body.senha || '');

    if (!usuario || !senha) return res.status(400).json({ error: 'Preencha usuário e senha.' });

    const [rows] = await pool.execute(
      'SELECT id, usuario, senha_hash FROM usuarios WHERE usuario = ? LIMIT 1',
      [usuario]
    );

    if (!rows.length || !(await bcrypt.compare(senha, rows[0].senha_hash))) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    req.session.regenerate(err => {
      if (err) return res.status(500).json({ error: 'Não foi possível iniciar a sessão.' });
      req.session.userId = rows[0].id;
      req.session.usuario = rows[0].usuario;
      req.session.save(err2 => {
        if (err2) return res.status(500).json({ error: 'Não foi possível salvar a sessão.' });
        res.json({ ok: true });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

app.post('/api/logout', requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('cardapio.sid');
    res.json({ ok: true });
  });
});

// Everything under the dashboard is protected.
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public'), {
  index: false
}));

app.get('/login.html', (req, res) => {
  if (req.session && req.session.userId) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
  console.log(`Cardápio Pro V10 rodando em http://localhost:${PORT}`);
});
