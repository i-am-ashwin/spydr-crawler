Test task
Introduction
This test task is for the Full-Stack Developer position with a front-end focus. While your primary responsibility will be front-end development, you will also integrate with back-end services.

This exercise has two goals:

For us: To evaluate your production-quality code, API design reasoning, and overall development approach.
For you: To experience the day-to-day work at Sykell through a realistic project.
Code and project ownership
This is purely an exercise; we have no intention of using your submission in production. You retain full ownership of your work and may license it as you see fit. If you choose not to move forward with us, you’re free to open-source it or include it in your portfolio.

Areas of focus
We will evaluate your submission on:

Front-end

UI must be a React Web application
Responsive design (desktop and mobile)
TypeScript
Back-end

Go (Golang)
Framework of your choice (e.g., Gin, Echo, etc.)
MySQL for data storage
General

Reproducible builds (use your preferred vendoring/packaging system)
Consistent error handling and reporting (no crashes under non-critical conditions)
API request to backend must use authorization mechanism
Show a chain of commits representing project progression, including initial scaffolding, incremental feature additions, and any refactoring steps
Automated front-end tests covering few happy-path scenarios
Total implementation time should not exceed 8 hours (feel free to spread this across multiple days)
Note: As this role is front-end focused, the quality and completeness of your React/TypeScript code will carry greater weight.

Task Description
Build a web application that accepts a website URL as input, crawls it and displays key information about that page.

Back-end data collection (per URL):

HTML version
Page title
Count of heading tags by level (H1, H2, etc.)
Number of internal vs. external links
Number of inaccessible links (those returning 4xx or 5xx status codes)
Presence of a login form
Front-end requirements (high → low priority):

URL Management

Add URLs for analysis
Start/stop processing on selected URLs
Results Dashboard

Paginated, sortable table (columns: Title, HTML Version, #Internal Links, etc.)
Column filters and a global search box (fuzzy or prefix matching)
Details View

Click a row to open a detail page showing:

Bar or donut chart of internal vs. external links
List of broken links with status codes
Bulk Actions

Re-run analysis or delete selected URLs via checkboxes
Real-Time Progress

Display crawl status for each URL (queued → running → done / error)
How to submit test task
Create a public GitHub repository and commit your code there.
Include a README.md with clear instructions how to build and run your application.
Email the repository link to careers@sykell.com.