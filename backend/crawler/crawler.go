package crawler

import (
	"errors"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"golang.org/x/net/html"
)

type Result struct {
	Title          string
	H1             int
	H2             int
	H3             int
	H4             int
	H5             int
	H6             int
	InternalLinks  int
	ExternalLinks  int
	BrokenLinks    int
	HasLoginForm   bool
	HTMLVersion    string
	ScreenshotPath string
}

func Crawl(targetURL string) (Result, error) {
	htmlContent, err := fetchWebpage(targetURL)
	if err != nil {
		return Result{}, err
	}

	node, err := parseHTML(htmlContent)
	if err != nil {
		return Result{}, err
	}
	screenshotPath, err := TakeScreenshot(targetURL)
	if err != nil {
		return Result{}, err
	}
	result := extractPageInfo(node)
	result.ScreenshotPath = screenshotPath
	links := extractLinks(node)
	analyzeLinkMetrics(&result, links, targetURL)
	result.HTMLVersion = detectHTMLVersion(htmlContent)

	return result, nil
}

func fetchWebpage(targetURL string) (string, error) {
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(targetURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return "", errors.New("fetch status " + resp.Status)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(bodyBytes), nil
}

func parseHTML(htmlContent string) (*html.Node, error) {
	return html.Parse(strings.NewReader(htmlContent))
}

func extractPageInfo(node *html.Node) Result {
	result := Result{}

	walkThroughHtmlNodes(node, func(n *html.Node) {
		if n.Type != html.ElementNode {
			return
		}

		tag := strings.ToLower(n.Data)
		switch tag {
		case "title":
			if n.FirstChild != nil {
				result.Title = strings.TrimSpace(n.FirstChild.Data)
			}
		case "form":
			if hasPasswordInput(n) {
				result.HasLoginForm = true
			}
		case "h1":
			result.H1++
		case "h2":
			result.H2++
		case "h3":
			result.H3++
		case "h4":
			result.H4++
		case "h5":
			result.H5++
		case "h6":
			result.H6++
		}
	})

	return result
}

func extractLinks(node *html.Node) []string {
	var links []string

	walkThroughHtmlNodes(node, func(n *html.Node) {
		if n.Type == html.ElementNode && strings.ToLower(n.Data) == "a" {
			for _, attr := range n.Attr {
				if attr.Key == "href" && attr.Val != "" {
					links = append(links, attr.Val)
				}
			}
		}
	})

	return links
}

func walkThroughHtmlNodes(node *html.Node, runFunction func(*html.Node)) {
	queue := []*html.Node{node}

	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]
		runFunction(current)
		for child := current.FirstChild; child != nil; child = child.NextSibling {
			queue = append(queue, child)
		}
	}
}

func analyzeLinkMetrics(result *Result, links []string, baseURL string) {
	if len(links) == 0 {
		return
	}

	baseHost := hostOf(baseURL)
	client := &http.Client{Timeout: 10 * time.Second}

	for _, link := range links {
		if isSkippableLink(link) {
			continue
		}

		if isInternal(link, baseHost) {
			result.InternalLinks++
		} else {
			result.ExternalLinks++
		}

		absoluteLink := absoluteURL(link, baseURL)
		if isBrokenLink(client, absoluteLink) {
			result.BrokenLinks++
		}
	}
}

func isSkippableLink(link string) bool {
	link = strings.TrimSpace(strings.ToLower(link))
	return link == "" ||
		link == "#" ||
		strings.HasPrefix(link, "javascript:") ||
		strings.HasPrefix(link, "mailto:") ||
		strings.HasPrefix(link, "tel:")
}

func isBrokenLink(client *http.Client, url string) bool {
	statusCode := headStatus(client, url)
	return statusCode >= 400 && statusCode != 0
}

func hostOf(raw string) string {
	parsedUrl, err := url.Parse(raw)
	if err != nil {
		return ""
	}
	return parsedUrl.Host
}

func absoluteURL(link, base string) string {
	parsedUrl, err := url.Parse(link)
	if err != nil {
		return link
	}
	if parsedUrl.IsAbs() {
		return link
	}
	baseUrl, _ := url.Parse(base)
	return baseUrl.ResolveReference(parsedUrl).String()
}

func isInternal(link, baseHost string) bool {
	parsedUrl, err := url.Parse(link)
	if err != nil {
		return false
	}
	if !parsedUrl.IsAbs() {
		return true
	}
	return parsedUrl.Host == baseHost
}

func headStatus(client *http.Client, u string) int {
	req, _ := http.NewRequest(http.MethodHead, u, nil)
	req.Header.Set("User-Agent", "spydr-crawler/1.0")
	resp, err := client.Do(req)
	if err != nil {
		return 0
	}
	resp.Body.Close()
	return resp.StatusCode
}

func hasPasswordInput(form *html.Node) bool {
	var found bool

	walkThroughHtmlNodes(form, func(n *html.Node) {
		if found || n.Type != html.ElementNode || n.Data != "input" {
			return
		}

		for _, attr := range n.Attr {
			if attr.Key == "type" && strings.ToLower(attr.Val) == "password" {
				found = true
				return
			}
		}
	})

	return found
}
func detectHTMLVersion(htmlSource string) string {
	doctypePattern := `(?i)<!DOCTYPE\s+([^>]+)>`
	re := regexp.MustCompile(doctypePattern)
	matches := re.FindStringSubmatch(htmlSource)

	if len(matches) < 2 {
		return "Unknown"
	}

	doctype := strings.ToLower(strings.TrimSpace(matches[1]))

	switch {
	case doctype == "html":
		return "HTML5"
	case strings.Contains(doctype, "xhtml 1.0 strict"):
		return "XHTML 1.0 Strict"
	case strings.Contains(doctype, "xhtml 1.0 transitional"):
		return "XHTML 1.0 Transitional"
	case strings.Contains(doctype, "xhtml 1.0 frameset"):
		return "XHTML 1.0 Frameset"
	case strings.Contains(doctype, "xhtml 1.1"):
		return "XHTML 1.1"
	case strings.Contains(doctype, "html 4.01 strict"):
		return "HTML 4.01 Strict"
	case strings.Contains(doctype, "html 4.01 transitional"):
		return "HTML 4.01 Transitional"
	case strings.Contains(doctype, "html 4.01 frameset"):
		return "HTML 4.01 Frameset"
	default:
		return "Unknown"
	}
}
