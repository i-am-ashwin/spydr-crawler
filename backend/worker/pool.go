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
	workerCount     int
	stopChan        chan bool
	activeJobs      map[uint]context.CancelFunc
	activeJobsMutex sync.RWMutex
}

func CrawlerWorkerPool(db *gorm.DB, workerCount int) *WorkerPool {
	return &WorkerPool{
		db:          db,
		workerCount: workerCount,
		stopChan:    make(chan bool),
		activeJobs:  make(map[uint]context.CancelFunc),
	}
}

func (pool *WorkerPool) Start() {
	for i := 0; i < pool.workerCount; i++ {
		go pool.worker(i)
	}
	log.Printf("Started %d workers", pool.workerCount)
}

func (pool *WorkerPool) Stop() {
	for i := 0; i < pool.workerCount; i++ {
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
	log.Printf("Worker %d started", id)

	for {
		select {
		case <-pool.stopChan:
			log.Printf("Worker %d stopped", id)
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
	err := tx.Where("status = ?", models.StatusQueued).
		Order("created_at ASC").
		First(&job).Error

	if err != nil {
		tx.Rollback()
		if err != gorm.ErrRecordNotFound {
			log.Printf("Worker %d: Error finding job: %v", workerID, err)
		}
		return
	}

	job.Status = models.StatusRunning
	if err := tx.Save(&job).Error; err != nil {
		tx.Rollback()
		log.Printf("Worker %d: Error updating job status: %v", workerID, err)
		return
	}

	tx.Commit()
	log.Printf("Worker %d: Processing job %d (%s)", workerID, job.ID, job.URL)

	ctx, cancel := context.WithCancel(context.Background())

	pool.activeJobsMutex.Lock()
	pool.activeJobs[job.ID] = cancel
	pool.activeJobsMutex.Unlock()

	defer func() {
		pool.activeJobsMutex.Lock()
		delete(pool.activeJobs, job.ID)
		pool.activeJobsMutex.Unlock()
	}()

	result, err := pool.crawl(ctx, job.URL)

	if ctx.Err() != nil {
		job.Status = models.StatusCanceled
		job.ErrorMessage = "Job was cancelled"
	} else if err != nil {
		job.Status = models.StatusError
		job.ErrorMessage = err.Error()
	} else {
		job.Status = models.StatusDone
		job.Title = result.Title
		job.H1 = result.H1
		job.H2 = result.H2
		job.H3 = result.H3
		job.H4 = result.H4
		job.H5 = result.H5
		job.H6 = result.H6
		job.InternalLinks = result.InternalLinks
		job.ExternalLinks = result.ExternalLinks
		job.InaccessibleLinks = result.BrokenLinks
		job.HasLoginForm = result.HasLoginForm
	}

	if err := pool.db.Save(&job).Error; err != nil {
		log.Printf("Worker %d: Error saving job results: %v", workerID, err)
	} else {
		log.Printf("Worker %d: Completed job %d", workerID, job.ID)
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
