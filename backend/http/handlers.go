package http

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/i-am-ashwin/spydr-crawler/backend/models"
	"github.com/i-am-ashwin/spydr-crawler/backend/worker"
	"gorm.io/gorm"
)

type Handlers struct {
	DB         *gorm.DB
	WorkerPool *worker.WorkerPool
}

type createCrawlJobReq struct {
	URL string `json:"url" binding:"required,url"`
}

type paginatedResponse struct {
	Data   interface{} `json:"data"`
	Total  int64       `json:"total"`
	Limit  int         `json:"limit"`
	Offset int         `json:"offset"`
}

func (h *Handlers) CreateCrawlJob(ctx *gin.Context) {
	var req createCrawlJobReq
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(400, gin.H{"error": err.Error()})
		return
	}

	job := models.CrawlJob{
		URL:    req.URL,
		Status: models.StatusQueued,
	}

	if err := h.DB.Create(&job).Error; err != nil {
		ctx.JSON(500, gin.H{"error": "Failed to create crawl job"})
		return
	}

	ctx.JSON(201, job)
}
func (h *Handlers) ListCrawlJobs(ctx *gin.Context) {
	var jobs []models.CrawlJob
	db := h.DB

	if status := ctx.Query("status"); status != "" {
		db = db.Where("status = ?", status)
	}

	if search := ctx.Query("search"); search != "" {
		searchPattern := "%" + search + "%"
		db = db.Where(
			"title LIKE ? OR url LIKE ? OR html_version LIKE ? OR status LIKE ?",
			searchPattern, searchPattern, searchPattern, searchPattern,
		)
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

	sortBy := ctx.DefaultQuery("sortBy", "created_at")
	sortOrder := ctx.DefaultQuery("sortOrder", "desc")

	validSortFields := map[string]string{
		"title":       "title",
		"status":      "status",
		"updatedAt":   "updated_at",
		"htmlVersion": "html_version",
		"createdAt":   "created_at",
		"url":         "url",
	}

	dbSortField, isValid := validSortFields[sortBy]
	if !isValid {
		dbSortField = "created_at"
	}

	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "desc"
	}

	orderClause := dbSortField + " " + strings.ToUpper(sortOrder)

	var total int64
	if err := db.Model(&models.CrawlJob{}).Count(&total).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := db.Limit(limit).Offset(offset).Order(orderClause).Find(&jobs).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := paginatedResponse{
		Data:   jobs,
		Total:  total,
		Limit:  limit,
		Offset: offset,
	}

	ctx.JSON(http.StatusOK, response)
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

func (h *Handlers) CrawlJobUpdatesSSE(ctx *gin.Context) {
	ctx.Header("Content-Type", "text/event-stream")
	ctx.Header("Cache-Control", "no-cache")
	ctx.Header("Connection", "keep-alive")
	ctx.Header("Access-Control-Allow-Headers", "Cache-Control")
	ctx.Header("Access-Control-Allow-Origin", "http://localhost:3000")

	clientChan := make(chan bool)

	go func() {
		<-ctx.Request.Context().Done()
		clientChan <- true
	}()

	var lastUpdate time.Time

	h.sendLatestCrawlJobs(ctx, &lastUpdate)

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-clientChan:
			return
		case <-ticker.C:
			h.sendLatestCrawlJobs(ctx, &lastUpdate)
			ctx.Writer.Flush()
		}
	}
}

func (h *Handlers) sendLatestCrawlJobs(ctx *gin.Context, lastUpdate *time.Time) {
	var job models.CrawlJob
	query := h.DB.Order("updated_at DESC").Limit(1)
	if !lastUpdate.IsZero() {
		query = query.Where("updated_at > ?", *lastUpdate)
	}

	if err := query.First(&job).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			fmt.Fprintf(ctx.Writer, "event: ping\n")
			fmt.Fprintf(ctx.Writer, "data: {\"timestamp\": \"%s\"}\n\n", time.Now().Format(time.RFC3339))
			return
		}
		fmt.Fprintf(ctx.Writer, "event: error\n")
		fmt.Fprintf(ctx.Writer, "data: {\"error\": \"Failed to fetch crawl job\"}\n\n")
		return
	}

	*lastUpdate = job.UpdatedAt

	jobJSON, err := json.Marshal(job)
	if err != nil {
		fmt.Fprintf(ctx.Writer, "event: error\n")
		fmt.Fprintf(ctx.Writer, "data: {\"error\": \"Failed to parse job data\"}\n\n")
		return
	}

	fmt.Fprintf(ctx.Writer, "event: crawl_job_update\n")
	fmt.Fprintf(ctx.Writer, "data: %s\n\n", string(jobJSON))
}

func (h *Handlers) StopCrawlJob(ctx *gin.Context) {
	jobID := ctx.Param("id")

	var job models.CrawlJob
	if err := h.DB.First(&job, jobID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if job.Status == models.StatusRunning {
		if h.WorkerPool.CancelJob(job.ID) {
			ctx.JSON(http.StatusOK, gin.H{"message": "Running job cancelled"})
			return
		}
	}

	if job.Status == models.StatusQueued {
		job.Status = models.StatusCanceled

		if err := h.DB.Save(&job).Error; err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, gin.H{"message": "Queued job cancelled"})
		return
	}

	ctx.JSON(http.StatusBadRequest, gin.H{"error": "Job cannot be stopped"})
}

func (h *Handlers) DeleteCrawlJob(ctx *gin.Context) {
	jobID := ctx.Param("id")

	var job models.CrawlJob
	if err := h.DB.First(&job, jobID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if job.Status == models.StatusRunning {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete running job. Stop it first."})
		return
	}

	if err := h.DB.Delete(&job).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Job deleted successfully"})
}

func (h *Handlers) GetScreenshot(ctx *gin.Context) {
	jobID := ctx.Param("id")
	id, err := strconv.Atoi(jobID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid job ID"})
		return
	}

	var job models.CrawlJob
	if err := h.DB.First(&job, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if job.ScreenshotPath == "" {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "No screenshot available for this job"})
		return
	}

	screenshotDir := os.Getenv("SCREENSHOT_DIR")
	filePath := filepath.Join(screenshotDir, job.ScreenshotPath)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Screenshot file not found"})
		return
	}
	ctx.Header("Content-Type", "image/png")
	ctx.Header("Cache-Control", "public, max-age=3600")

	ctx.File(filePath)
}
