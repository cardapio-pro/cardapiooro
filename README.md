# Cardápio Pro V10 — Node.js + MySQL

## 1. Instalar
Abra o CMD dentro desta pasta e execute:

```bat
npm install
```

## 2. Configurar
Copie `.env.example` para `.env` e coloque a senha do seu MySQL em `DB_PASSWORD`.
Também troque `SESSION_SECRET` por uma chave grande e aleatória.

## 3. Criar banco e usuário do painel
Execute:

```bat
node setup.js
```

Isso cria o banco `cardapio_v10`, as tabelas e o usuário administrador.

Usuário padrão: `admin`
Senha inicial: a definida em `ADMIN_PASSWORD` no `.env`.

## 4. Iniciar
```bat
npm start
```

Depois abra:

http://localhost:3000

## Segurança
A senha do administrador NÃO fica no HTML/JavaScript do navegador.
O servidor compara a senha com um hash bcrypt no MySQL e cria uma sessão protegida por cookie HTTP-only.
O endpoint de login também possui limitação de tentativas.

Para colocar na internet, use HTTPS e mantenha o `.env` fora do controle de versão.
