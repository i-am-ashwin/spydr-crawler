# Spydr Crawler dashboard
A full-stack web application that crawls websites and provides detailed insights about their structure, links, and technical details.

## Features

- **URL Crawler**: Submit any website URL for comprehensive crawling and analysis
- **Real-time Processing**: Track crawl progress with live status updates (queued → running → done)
- **Interactive Dashboard**: Browse results in a sortable, searchable table with pagination
- **Detailed Reports**: Click any result to view in-depth analysis including screeshot,link breakdown and chart
- **Bulk Operations**: Select multiple URLs for batch re-analysis, deletion or stopping based on current status

## What Gets Analyzed

For each submitted URL, the crawler extracts:
- Screenshot
- HTML version (HTML5, HTML4, etc.)
- Page title
- Heading tag counts (H1, H2, H3, etc.)
- Internal vs external link analysis
- Broken link detection (4xx/5xx responses)
- Login form presence
- Processing status and timestamps

## Tech Stack

**Frontend**
- Next.js with TypeScript
- Zustand for state management
- React with hooks
- Tailwind CSS for styling
- Recharts for data visualization
- Tanstack table for sortable table
- Jest + React Testing Library

**Backend**
- Go with Gin framework
- GORM for database operations
- MySQL for data persistence
- JWT authentication
- chromedp for headless brower plugin
- Structured error handling

## Getting Started

### Prerequisites
- Docker V28+
### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd web-crawler
```

2. Build run docker containers.
```bash
docker compose up --build
```
### Demo



<video controls src="demo.webm" title="Demo"></video>

### Environment Variables

**Backend (.env.example)**
```
PORT=8080
DB_URL="app:app@tcp(db:3306)/crawler?parseTime=true&charset=utf8mb4&loc=UTC"
JWT_SECRET=your-jwt-secret
ADMIN_USERNAME=your-username
ADMIN_PASSWORD=your-password
SCREENSHOT_DIR="/app/data/screenshots"
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Usage

    1. Open http://localhost:3000 in your browser
    2. Login with the demo username and password
    3. Enter a website URL in the input field
    4. Click "Crawl" to start crawling
    5. Monitor the progress on the result page.
    6. Click any completed row on the results page to view detailed analysis
    7. Use search and filters to find specific results
    8. Select multiple items for bulk actions

## API Endpoints
- `POST /api/auth/login` - Authenticate a user.
- `POST /api/crawl` - Submit URL for analysis
- `GET /api/crawl/list` - Fetch results with search/filter/pagination/sort
- `GET /api/crawl/updates` - Fetch latest updates as Server sent events
- `GET /api/crawl/:id` - Get detailed analysis for specific URL
- `DELETE /api/crawl/:id` - Remove analysis result
- `POST /crawl/:id/stop` - Stop a currently queued analysis
- `GET /crawl/:id/screenshot` - Get screeshot for a specific crawl analysis
- `POST /crawl/bulk/create` - create a list of URLS
- `POST /crawl/bulk/delete` - delete a list of analysis
- `POST /crawl/bulk/stop` - stop a list of analysis


## Testing

Run the test suite:
```bash
# Frontend tests
cd frontend
npm run test
```

## Project Structure

```
├── backend/
│   ├── api/          # Application entry point
│   ├── crawler/      # Business logic
│   ├── db/           # Database connection
│   ├── http/         # HTTP request handlers
│   ├── middleware/   # Authentication middleware
│   ├── models/       # Database modles
│   ├── worker/       # Pool workers for concurrency
├── frontend/src
│           ├── components/     # React components
│           ├── app/            # Next.js pages
│           ├── lib/            # Stores and utility functions
│           ├── providers/      # React Providers
│           └── __tests__/      # Test files
└── README.md
```

## Development Notes

- Database queries are optimized with appropriate indexes
- Error states are handled gracefully throughout the UI
- Mobile-responsive design works on all screen sizes