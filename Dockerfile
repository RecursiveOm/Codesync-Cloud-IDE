# Build frontend

FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY ./frontend .

RUN npm install

RUN npm run build


# Build backend

FROM node:22-alpine

WORKDIR /app

COPY ./Backend .

RUN npm install


COPY --from=frontend-builder /app/dist ./public


EXPOSE 3000

CMD ["node", "server.js"]