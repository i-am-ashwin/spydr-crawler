FROM node:22-alpine

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci || npm install

COPY . .

RUN mkdir -p .next/cache && \
    chown -R node:node /app && \
    chmod -R 755 /app

USER node

EXPOSE 3000

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]