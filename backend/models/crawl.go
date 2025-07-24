package models

import (
	"time"

	"gorm.io/gorm"
)

type JobStatus string

const (
	StatusQueued   JobStatus = "queued"
	StatusRunning  JobStatus = "running"
	StatusDone     JobStatus = "done"
	StatusError    JobStatus = "error"
	StatusCanceled JobStatus = "canceled"
)

type CrawlJob struct {
	ID                uint           `gorm:"primaryKey" json:"id"`
	URL               string         `gorm:"size:2048;not null" json:"url"`
	Title             string         `json:"title"`
	HTMLVersion       string         `json:"htmlVersion"`
	H1                int            `json:"h1"`
	H2                int            `json:"h2"`
	H3                int            `json:"h3"`
	H4                int            `json:"h4"`
	H5                int            `json:"h5"`
	H6                int            `json:"h6"`
	InternalLinks     int            `json:"internalLinks"`
	ExternalLinks     int            `json:"externalLinks"`
	InaccessibleLinks int            `json:"inaccessibleLinks"`
	HasLoginForm      bool           `json:"hasLoginForm"`
	ScreenshotPath    string         `json:"screenshotPath"`
	Status            JobStatus      `gorm:"type:enum('queued','running','done','error','canceled');default:'queued'" json:"status"`
	ErrorMessage      string         `json:"errorMessage"`
	CreatedAt         time.Time      `json:"createdAt"`
	UpdatedAt         time.Time      `json:"updatedAt"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`
}
