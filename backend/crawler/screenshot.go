package crawler

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/chromedp/chromedp"
)

func TakeScreenshot(url string) (string, error) {
	dir := os.Getenv("SCREENSHOT_DIR")
	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	var buf []byte
	err := chromedp.Run(ctx,
		chromedp.Navigate(url),
		chromedp.Sleep(2*time.Second),
		chromedp.CaptureScreenshot(&buf),
	)
	if err != nil {
		log.Printf("Error taking screenshot %s: %v", url, err)
		return "", err
	}

	slug := urlToSlug(url)
	name := fmt.Sprintf("%d-%v.png", time.Now().UnixNano(), slug)
	path := filepath.Join(dir, name)

	if err := os.WriteFile(path, buf, 0644); err != nil {
		log.Printf("Error error saving screenshot %s: %v", path, err)
		return "", err
	}

	return name, nil
}
func urlToSlug(url string) string {
	slug := regexp.MustCompile(`^https?://`).ReplaceAllString(url, "")

	slug = regexp.MustCompile(`^www\.`).ReplaceAllString(slug, "")

	slug = regexp.MustCompile(`[^a-zA-Z0-9]+`).ReplaceAllString(slug, "-")

	slug = strings.Trim(slug, "-")

	slug = strings.ToLower(slug)

	if len(slug) > 20 {
		slug = slug[:20]
	}

	slug = strings.TrimSuffix(slug, "-")

	return slug
}
