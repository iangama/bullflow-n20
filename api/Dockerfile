FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --only=production

COPY src ./src

ENV NODE_ENV=production

CMD ["npm", "start"]
