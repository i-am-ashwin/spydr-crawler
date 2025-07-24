package main

import (
	"log"
	"os"

	"github.com/i-am-ashwin/spydr-crawler/backend/db"
	"github.com/i-am-ashwin/spydr-crawler/backend/http"
	"github.com/i-am-ashwin/spydr-crawler/backend/worker"
)

func main() {
	port := getEnv("PORT", "8080")
	dataBase := db.ConnectToDB(getEnv("DB_URL", "app:app@tcp(db:3306)/crawler?parseTime=true&charset=utf8mb4&loc=UTC"))
	db.AutoMigrate(dataBase)

	// Start worker pool
	pool := worker.CrawlerWorkerPool(dataBase)
	pool.Start()

	// Setup HTTP router with worker pool
	router := http.SetupRouter(dataBase, pool)

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
