package http

import (
	"net/http"
	"strconv"

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

func (h *Handlers) CreateCrawlJob(ctx *gin.Context) {
	var req createCrawlJobReq
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	job := models.CrawlJob{URL: req.URL, Status: models.StatusQueued}
	if err := h.DB.Create(&job).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, job)
}
func (h *Handlers) ListCrawlJobs(ctx *gin.Context) {
	var jobs []models.CrawlJob
	db := h.DB
	if status := ctx.Query("status"); status != "" {
		db = db.Where("status = ?", status)
	}
	limitStr := ctx.DefaultQuery("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid limit parameter"})
		return
	}
	offsetStr := ctx.DefaultQuery("offset", "0")
	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid offset parameter"})
		return
	}
	if err := db.Limit(limit).Offset(offset).Order("created_at DESC").Find(&jobs).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, jobs)
}

func (h *Handlers) GetCrawlJob(ctx *gin.Context) {
	var job models.CrawlJob
	if err := h.DB.First(&job, ctx.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, job)
}
