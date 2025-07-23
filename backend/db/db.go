package db

import (
	"log"

	"github.com/i-am-ashwin/spydr-crawler/backend/models"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func ConnectToDB(dsn string) *gorm.DB {
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to db: %v", err)
	}
	return db
}
func AutoMigrate(db *gorm.DB) {
	log.Println("Running database migrations")
	err := db.AutoMigrate(&models.CrawlJob{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}
	log.Println("Database migrations completed")
}
