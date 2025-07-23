FROM node:22-alpine

#required for Next.js on alphine
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci || npm install


EXPOSE 3000
CMD [ "npm", "run", "dev", "--", "-p", "3000", "-H", "0.0.0.0" ]
