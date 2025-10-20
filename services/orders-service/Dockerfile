FROM node:20-alpine
WORKDIR /app

COPY services/orders-service/package.json ./package.json
RUN npm install --only=production --fetch-timeout=600000 --network-concurrency=1

COPY services/users-service/prisma ./prisma/
RUN npx prisma generate

COPY services/orders-service/src ./src
COPY common ./common

ENV PORT=3002
EXPOSE 3002
CMD ["npm","start"]
