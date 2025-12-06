FROM node:22-alpine

WORKDIR /app

# 1) Dependências
COPY package.json package-lock.json* ./
RUN npm install

# 2) Configs do Tailwind/PostCSS
COPY tailwind.config.cjs postcss.config.cjs ./

# 3) Arquivos do Vite
COPY index.html ./
COPY vite.config.* ./
COPY src ./src
COPY public ./public

# 4) Build
RUN npm run build

# 5) Preview server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
