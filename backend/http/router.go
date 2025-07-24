package http

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/i-am-ashwin/spydr-crawler/backend/worker"
	"gorm.io/gorm"
)

func SetupRouter(db *gorm.DB, pool *worker.WorkerPool) *gin.Engine {
	r := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Cache-Control"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	r.Use(cors.New(config))

	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })
	handlers := &Handlers{DB: db, WorkerPool: pool}

	r.POST("/api/crawl", handlers.CreateCrawlJob)
	r.GET("/api/crawl/:id", handlers.GetCrawlJob)
	r.GET("/api/crawl/list", handlers.ListCrawlJobs)
	r.GET("/api/crawl/updates", handlers.CrawlJobUpdatesSSE)
	r.POST("/api/crawl/:id/stop", handlers.StopCrawlJob)
	r.DELETE("/api/crawl/:id", handlers.DeleteCrawlJob)

	return r
}
