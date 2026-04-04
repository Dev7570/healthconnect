FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY server.js .
COPY .env* ./

EXPOSE 5000

CMD ["npm", "start"]
