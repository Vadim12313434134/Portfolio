# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
RUN npm run build

# Production image
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY server ./server
COPY --from=frontend-build /app/dist ./dist

RUN mkdir -p server/uploads server/data \
  && if [ ! -f server/data/projects.json ]; then echo '[]' > server/data/projects.json; fi

EXPOSE 3000

CMD ["node", "server/index.js"]
