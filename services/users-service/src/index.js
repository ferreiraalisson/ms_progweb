import express from 'express';
import morgan from 'morgan';
import { nanoid } from 'nanoid';
import { createChannel } from './amqp.js';
import { ROUTING_KEYS } from '../common/events.js';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3001;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE = process.env.EXCHANGE || 'app.topic';

// In-memory "DB"
// const users = new Map();

let amqp = null;
(async () => {
  try {
    amqp = await createChannel(RABBITMQ_URL, EXCHANGE);
    console.log('[users] AMQP connected');
  } catch (err) {
    console.error('[users] AMQP connection failed:', err.message);
  }
})();

app.get('/health', (req, res) => res.json({ ok: true, service: 'users' }));

app.get('/', async (req, res) => {
  // res.json(Array.from(users.values()));
  const allUsers = await prisma.user.findMany();
  res.status(200).json(allUsers);
});

app.post('/', async (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' });

  
  // const user = { id, name, email, createdAt: new Date().toISOString() };
  // users.set(id, user);

  // Publish event
  try {
    const id = `u_${nanoid(6)}`;
    const user = await prisma.user.create({
      data: { id: id, name, email },
    });

    if (amqp?.ch) {
      const payload = Buffer.from(JSON.stringify(user));
      amqp.ch.publish(EXCHANGE, ROUTING_KEYS.USER_CREATED, payload, { persistent: true });
      console.log('[users] published event:', ROUTING_KEYS.USER_CREATED, user);
    }

    res.status(201).json(user);
  } catch (err) {
    if (err.code === 'P2002') {
      // P2002 é o código do Prisma para "Unique constraint failed"
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('[users] publish error:', err.message);
    res.status(500).json({ error: 'Erro ao tentar criar usuário' });
  }
});

app.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: id},
  });
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
});

// IMPLEMENTAR O ATUALIZAR - PUT
app.put('/:id', async (req, res) => {

  const id = req.params.id;

  // const verify = await prisma.user.findUnique(id);
  // if (!verify) return res.status(404).json({ error: 'not found' });
  
  const { name, email } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' });

  // const updated = { id, name, email, updatedAt: new Date().toISOString() };
  // users.set(id, updated);

  //Implementar o publish event
  try {

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: { name, email },
    });

    if (amqp?.ch){
        const newload = Buffer.from(JSON.stringify(updateduser));
        amqp.ch.publish(EXCHANGE, ROUTING_KEYS.USER_UPDATED, newload, { persistent: true});
        console.log('[users] published event:', ROUTING_KEYS.USER_UPDATED, updatedUser);
    }
    
    res.status(200).json(updatedUser);

  } catch (error) {
    // CORREÇÃO: Tratamento de erro específico do Prisma
    if (error.code === 'P2025') {
      // P2025 é o código para "Record to update not found."
      return res.status(404).json({ error: 'not found' });
    }
    if (error.code === 'P2002') {
      // Trata o caso de tentar atualizar para um email que já existe
      return res.status(409).json({ error: 'Email already in use by another user' });
    }
    console.error('[users] publish error:', error.message);
    res.status(500).json({ error: 'Não foi possível atualizar!' })
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[users] listening on http://0.0.0.0:${PORT}`);
});
