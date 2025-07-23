
FROM golang:1.24.5-bullseye

RUN apt-get update && apt-get install -y chromium wget ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

RUN go install github.com/air-verse/air@latest

ENV CHROME_BIN=/usr/bin/chromium

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod tidy

COPY . .

RUN mkdir -p /app/data/screenshots

EXPOSE 8080

CMD ["air", "-c", ".air.toml"]
