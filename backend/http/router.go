package http

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/i-am-ashwin/spydr-crawler/backend/middleware"
	"github.com/i-am-ashwin/spydr-crawler/backend/worker"
	"gorm.io/gorm"
)

func SetupRouter(db *gorm.DB, pool *worker.WorkerPool) *gin.Engine {
	r := gin.Default()

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Cache-Control", "Authorization"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	r.Use(cors.New(config))

	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })
	r.POST("/api/auth/login", middleware.Login)

	handlers := &Handlers{DB: db, WorkerPool: pool}
	protected := r.Group("/api")
	protected.Use(middleware.JWTAuthMiddleware())
	{
		protected.POST("/crawl", handlers.CreateCrawlJob)
		protected.GET("/crawl/:id", handlers.GetCrawlJob)
		protected.GET("/crawl/list", handlers.ListCrawlJobs)
		protected.GET("/crawl/updates", handlers.CrawlJobUpdatesSSE)
		protected.POST("/crawl/:id/stop", handlers.StopCrawlJob)
		protected.DELETE("/crawl/:id", handlers.DeleteCrawlJob)
		protected.GET("/crawl/:id/screenshot", handlers.GetScreenshot)
		protected.POST("/crawl/bulk/create", handlers.BulkCreateCrawlJobs)
		protected.POST("/crawl/bulk/delete", handlers.BulkDeleteCrawlJobs)
		protected.POST("/crawl/bulk/stop", handlers.BulkStopCrawlJobs)
	}

	return r
}
