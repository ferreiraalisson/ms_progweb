FROM node:20-alpine
WORKDIR /app

COPY services/orders-service/package.json ./package.json
COPY services/orders-service/package-lock.json ./package-lock.json
RUN npm install --only=production

COPY services/orders-service/src ./src
COPY services/orders-service/prisma ./prisma
COPY services/orders-service/.env ./.env
COPY common ./common

# Gera o Prisma Client
RUN npx prisma generate

ENV PORT=3002
EXPOSE 3002
CMD npx prisma generate && npx prisma migrate deploy && npm start
