package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/i-am-ashwin/spydr-crawler/backend/models"
	"gorm.io/gorm"
)

type Handlers struct {
	DB *gorm.DB
}
type createCrawlJobReq struct {
	URL string `json:"url" binding:"required,url"`
}

func (h *Handlers) CreateCrawlJob(c *gin.Context) {
	var r createCrawlJobReq
	if err := c.ShouldBindJSON(&r); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	job := models.CrawlJob{URL: r.URL, Status: models.StatusQueued}
	if err := h.DB.Create(&job).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, job)
}
