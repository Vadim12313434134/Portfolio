import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 8081;
const JWT_SECRET = 'dev_super_secret_jwt_key_change_me';
const TOKEN_EXPIRES_IN = '7d';

// Временное in-memory хранилище пользователей
const users = [
  { id: 1, username: 'user', password: 'User', role: 'user' },
  { id: 2, username: 'admin', password: 'Admin', role: 'admin' },
];

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`\n=== ${req.method} ${req.url} ===`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

const createToken = (user) => jwt.sign(
  { id: user.id, username: user.username, role: user.role },
  JWT_SECRET,
  { expiresIn: TOKEN_EXPIRES_IN },
);

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Токен отсутствует' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Токен невалиден или истёк' });
  }
};

app.post('/auth/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Укажите username и password' });
  }

  const existing = users.find((u) => u.username === username);
  if (existing) {
    return res.status(409).json({ message: 'Пользователь уже существует' });
  }

  const newUser = {
    id: users.length + 1,
    username,
    password,
    role: 'user',
  };
  users.push(newUser);

  const token = createToken(newUser);
  return res.status(201).json({
    message: 'Регистрация успешна',
    token,
    user: { id: newUser.id, username: newUser.username, role: newUser.role },
  });
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Укажите username и password' });
  }

  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Неверный логин или пароль' });
  }

  const token = createToken(user);
  return res.status(200).json({
    message: 'Успешная авторизация',
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

app.get('/auth/me', authMiddleware, (req, res) => {
  res.status(200).json({ user: req.user });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Сервер JWT работает',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log('📋 Доступные пользователи:');
  users.forEach((u) => console.log(`   - ${u.username} / ${u.password}`));
  console.log(`\n📌 Эндпоинты:`);
  console.log('   POST /auth/register - регистрация + JWT');
  console.log('   POST /auth/login - вход + JWT');
  console.log('   GET /auth/me - проверка токена');
  console.log('   GET /health - проверка работы\n');
});