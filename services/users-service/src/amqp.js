// export async function createChannel(url, exchange) {
//   const conn = await amqplib.connect(url);
//   const ch = await conn.createChannel();
//   await ch.assertExchange(exchange, 'topic', { durable: true });
//   return { conn, ch };
// }

// amqp.js


import amqplib from 'amqplib';

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 5000; // 5 segundos

async function connectWithRetry(url) {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const conn = await amqplib.connect(url);
      console.log('[AMQP] Connected successfully!');
      return conn;
    } catch (err) {
      retries++;
      console.error(`[AMQP] Connection failed. Retrying (${retries}/${MAX_RETRIES})...`);
      if (retries >= MAX_RETRIES) {
        throw err; // Lança o erro após todas as tentativas
      }
      // Espera antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

export async function createChannel(url, exchange) {
  // A conexão agora usará a lógica de retry
  const conn = await connectWithRetry(url);
  
  // Lógica para fechar a conexão graciosamente ao encerrar o processo
  process.once('SIGINT', async () => {
    await conn.close();
  });

  const ch = await conn.createChannel();
  await ch.assertExchange(exchange, 'topic', { durable: true });
  return { conn, ch };
}