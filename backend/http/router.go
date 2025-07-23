package http

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"} // Allow all origins
	r.Use(cors.New(config))
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })
	h := &Handlers{DB: db}
	r.POST("/api/crawl", h.CreateCrawlJob)
	return r
}
