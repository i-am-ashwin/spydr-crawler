package worker

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/i-am-ashwin/spydr-crawler/backend/crawler"
	"github.com/i-am-ashwin/spydr-crawler/backend/models"
	"gorm.io/gorm"
)

type WorkerPool struct {
	db              *gorm.DB
	stopChan        chan bool
	activeJobs      map[uint]context.CancelFunc
	activeJobsMutex sync.RWMutex
}

func CrawlerWorkerPool(db *gorm.DB) *WorkerPool {
	return &WorkerPool{
		db:         db,
		stopChan:   make(chan bool),
		activeJobs: make(map[uint]context.CancelFunc),
	}
}

func (pool *WorkerPool) Start() {
	workersCount := 3
	for i := 0; i < workersCount; i++ {
		go pool.worker(i)
	}
}

func (pool *WorkerPool) Stop() {
	workersCount := 3
	for i := 0; i < workersCount; i++ {
		pool.stopChan <- true
	}
}

func (pool *WorkerPool) CancelJob(jobID uint) bool {
	pool.activeJobsMutex.RLock()
	cancelFunc, exists := pool.activeJobs[jobID]
	pool.activeJobsMutex.RUnlock()

	if exists {
		cancelFunc()
		return true
	}
	return false
}

func (pool *WorkerPool) worker(id int) {
	for {
		select {
		case <-pool.stopChan:
			return
		default:
			pool.processNextJob(id)
			time.Sleep(2 * time.Second)
		}
	}
}

func (pool *WorkerPool) processNextJob(workerID int) {
	var job models.CrawlJob

	tx := pool.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	err := tx.Set("gorm:query_option", "FOR UPDATE SKIP LOCKED").
		Where("status = ?", models.StatusQueued).
		Order("created_at ASC").
		First(&job).Error

	if err != nil {
		tx.Rollback()
		if err != gorm.ErrRecordNotFound {
			log.Printf("Worker %d: record not found %v", workerID, err)
		}
		return
	}

	result := tx.Model(&job).Update("status", models.StatusRunning)
	if result.Error != nil {
		tx.Rollback()
		log.Printf("Worker %d: Error job not updated: %v", workerID, result.Error)
		return
	}

	if result.RowsAffected != 1 {
		tx.Rollback()
		log.Printf("Worker %d: multiple rows error", workerID, result.RowsAffected)
		return
	}

	if err := tx.Commit().Error; err != nil {
		log.Printf("Worker %d: error race condition in commit: %v", workerID, err)
		return
	}

	ctx, cancel := context.WithCancel(context.Background())

	pool.activeJobsMutex.Lock()
	pool.activeJobs[job.ID] = cancel
	pool.activeJobsMutex.Unlock()

	defer func() {
		pool.activeJobsMutex.Lock()
		delete(pool.activeJobs, job.ID)
		pool.activeJobsMutex.Unlock()
	}()

	crawlResult, err := pool.crawl(ctx, job.URL)

	if ctx.Err() != nil {
		job.Status = models.StatusCanceled
		job.ErrorMessage = "Job was cancelled"
	} else if err != nil {
		job.Status = models.StatusError
		job.ErrorMessage = err.Error()
	} else {
		job.Status = models.StatusDone
		job.Title = crawlResult.Title
		job.H1 = crawlResult.H1
		job.H2 = crawlResult.H2
		job.H3 = crawlResult.H3
		job.H4 = crawlResult.H4
		job.H5 = crawlResult.H5
		job.H6 = crawlResult.H6
		job.InternalLinks = crawlResult.InternalLinks
		job.ExternalLinks = crawlResult.ExternalLinks
		job.InaccessibleLinks = crawlResult.BrokenLinks
		job.HasLoginForm = crawlResult.HasLoginForm
		job.HTMLVersion = crawlResult.HTMLVersion
		job.ScreenshotPath = crawlResult.ScreenshotPath
	}

	if err := pool.db.Save(&job).Error; err != nil {
		log.Printf("Worker %d: error saving job: %v", workerID, err)
	} else {
		log.Printf("Worker %d: job completed %d", workerID, job.ID)
	}
}

func (pool *WorkerPool) crawl(ctx context.Context, url string) (crawler.Result, error) {
	resultChan := make(chan crawler.Result, 1)
	errorChan := make(chan error, 1)

	go func() {
		result, err := crawler.Crawl(url)
		if err != nil {
			errorChan <- err
		} else {
			resultChan <- result
		}
	}()
	select {
	case <-ctx.Done():
		return crawler.Result{}, ctx.Err()
	case result := <-resultChan:
		return result, nil
	case err := <-errorChan:
		return crawler.Result{}, err
	}
}
