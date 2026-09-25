require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  await db.query(`CREATE DATABASE IF NOT EXISTS cardapio_v10 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await db.query(`USE cardapio_v10`);
  await db.query(`CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(128) NOT NULL,
    expires INT UNSIGNED NOT NULL,
    data MEDIUMTEXT,
    PRIMARY KEY (session_id)
  )`);

  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'cardápiopro121314', 12);
  await db.execute(
    `INSERT INTO usuarios (usuario, senha_hash) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE senha_hash = VALUES(senha_hash)`,
    [process.env.ADMIN_USER || 'admin', hash]
  );

  console.log('Banco, tabela e usuário administrador configurados.');
  await db.end();
})().catch(err => { console.error(err); process.exit(1); });
