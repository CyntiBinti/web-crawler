# Web Crawler

A robust web crawler implementation that, given a starting URL, systematically visits each URL it finds on the same domain and outputs both the visited URL and links found on that page. The crawler respects robots.txt directives and implements proper web crawling etiquette.

- [Getting Started](#getting-started)
- [Usage](#usage)
- [Technical Overview](#technical-overview)
- [Reflections](#reflections)
  - [Functional Requirements](#functional-requirements)
  - [Technical Highlights](#technical-highlights)
  - [Future Enhancements](#future-enhancements)

## Getting Started

This Node.js script requires Node.js version 18 or higher. To set up the project:

```bash
cd web-crawler && npm install
```

Dependencies:

- `axios`: HTTP client for making requests
- `cheerio`: HTML parsing library

## Usage

Run the crawler by providing a starting URL:

```bash
node index.js https://www.monzo.com/
```

Execute the test suite:

```bash
npm run test
```

## Technical Overview

The crawler implements several key features:

### Queue Management

- Efficient URL queue handling using Set data structures
- Prevents duplicate visits
- Maintains proper domain restrictions

### Robots.txt Compliance

- Parses and respects robots.txt directives
- Filters out disallowed paths

### Error Handling

- Comprehensive input validation
- Graceful handling of failed requests
- Detailed error logging

### URL Processing

- Handles both absolute and relative URLs
- Validates URLs before processing
- Filters out binary files (PDF, MP3, JPG, etc.)

## Reflections

Hello 👋 I'm Cynthia, and thanks for the opportunity to interview with Monzo. This was an enjoyably challenging task, balancing robustness and pragmatism within the time constraints.

### Functional Requirements

I feel my solution successfully meets all the core requirements:

✓ Visits each URL on the same domain
✓ Prints visited URLs and found links
✓ Restricts to one subdomain
✓ Custom implementation without crawler frameworks
✓ Uses permitted libraries only for HTML parsing
✓ Comprehensive test coverage

### Technical Highlights

#### Robust Architecture

- Clear separation of concerns
- Modular design with single-responsibility functions
- Comprehensive JSDoc documentation
- Consistent error handling patterns

#### Safety Features

- Rate limiting to prevent server overload
- Content-Type validation before HTML parsing
- Graceful failure handling with detailed logging
- Domain restriction enforcement

#### Performance Considerations

- Efficient Set-based duplicate detection
- Optimised URL queue management
- Memory-efficient processing

#### Developer Experience

- Detailed console logging for debugging
- Clear error messages with specific failure reasons
- Well-structured codebase for maintainability

### Future Enhancements

- URL Re-directs: Doesn't handle re-directs e.g. `'https://monzo.com/'` vs `'https://www.monzo.com/'` - both appear in the unique set. Could get around this by checking IP address with DNS perhaps? but seemed overkill for a simple web crawler.
- Optimise Algorithm: could improve using BFS (over DFS) as essentially a graph, and want to avoid potential crawler-trap with DFS approach
- Retry Handling: if a URL fails we handle that with storing >4xx responses in an unprocessableURLs array, which I could store as an array of objects with keys like URL, retryCount, timeOut. Can retry the unprocessableURLs up to a max # of retries e.g. 5, and timeout increases each time to allow for service being down for example
- State Persistence: no persistent storage so if programme shuts down then can't re-start where it left off, and will have to crawl again from the start. Would implement a local save state using node's in-built writeFileSync where I'd store the URLs visited and URLs in the queue when the programme stopped, so that it can resume the loop when re-run. I'd need to update the the params input for the main function to handle this though.
- Concurrent Requests: Currently only 1 crawler thread running, so could look ino setting up multiple crawler threads to can do concurrent requests thus improving performance and speed
