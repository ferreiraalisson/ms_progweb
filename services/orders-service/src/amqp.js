// import amqplib from 'amqplib';

// export async function createChannel(url, exchange) {
//   const conn = await amqplib.connect(url);
//   const ch = await conn.createChannel();
//   await ch.assertExchange(exchange, 'topic', { durable: true });
//   return { conn, ch };
// }

// services/orders-service/src/amqp.js

import amqplib from 'amqplib';

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 5000; // 5 segundos

async function connectWithRetry(url) {
  let retries = 0;
  while (true) {
    try {
      const conn = await amqplib.connect(url);
      
      conn.on('error', (err) => {
        console.error('[AMQP] connection error', err.message);
        process.exit(1); // Encerra para que o Docker possa reiniciar o contêiner
      });
      conn.on('close', () => {
        console.error('[AMQP] connection closed');
        process.exit(1);
      });
      
      console.log('[AMQP] Connected successfully!');
      return conn;
    } catch (err) {
      retries++;
      console.error(`[AMQP] Connection failed. Retrying in ${RETRY_DELAY_MS / 1000}s... (${retries}/${MAX_RETRIES})`);
      if (retries >= MAX_RETRIES) {
        console.error('[AMQP] Max retries reached. Exiting.');
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

export async function createChannel(url, exchange) {
  const conn = await connectWithRetry(url);
  const ch = await conn.createChannel();
  await ch.assertExchange(exchange, 'topic', { durable: true });
  return { conn, ch };
}