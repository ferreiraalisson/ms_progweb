FROM node:20-alpine
WORKDIR /app

COPY services/users-service/package.json ./package.json
COPY services/users-service/package-lock.json ./package-lock.json
RUN npm install 

COPY services/users-service/src ./src
COPY services/users-service/prisma ./prisma
COPY services/users-service/.env ./.env
COPY common ./common

RUN npx prisma generate

ENV PORT=3001
EXPOSE 3001

CMD npx prisma generate && npx prisma migrate deploy && npm start
