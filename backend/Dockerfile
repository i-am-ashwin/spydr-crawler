FROM golang:1.24.5-bullseye AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/api ./api

FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y chromium wget ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN=/usr/bin/chromium

WORKDIR /app
COPY --from=builder /bin/api /app/api

RUN mkdir -p /app/data/screenshots
EXPOSE 8080
CMD ["/app/api"]
