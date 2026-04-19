FROM node:22-alpine AS builder
WORKDIR /app

ARG EXPO_PUBLIC_API_URL=http://localhost:3000
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx expo export --platform web --output-dir dist-web

FROM nginx:1.27-alpine
COPY --from=builder /app/dist-web /usr/share/nginx/html
EXPOSE 80
