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

Hello 👋 thanks for the opportunity to interview with Monzo! This was an enjoyably challenging task, balancing robustness and pragmatism within the time constraints.

### Functional Requirements

I feel my solution successfully meets all the core requirements:

- ✓ Visits each URL on the same domain
- ✓ Prints visited URLs and found links
- ✓ Restricts to one subdomain
- ✓ Custom implementation without crawler frameworks
- ✓ Uses permitted libraries only for HTML parsing
- ✓ Comprehensive test coverage

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
- Memory-efficient processing (time and space complexity of O(n))
- FIFO queue enables BFS-like algorithm, crawling pages level by level

#### Developer Experience

- Detailed console logging for debugging
- Clear error messages with specific failure reasons
- Well-structured codebase for maintainability

### Future Enhancements

#### Processing URLs

- I noticed the crawler doesn't handle redirects effectively - for example, both "https://monzo.com/" and "https://www.monzo.com/" appeared in the crawl queue, meaning some pages could potentially get crawled twice. With more time, I'd look into implementing DNS-level domain validation and standardising URLs (like stripping "www.") before adding them to the queue to prevent these duplicate crawls

#### Performance Optimisation

- The current implementation uses a single crawler thread, which works but isn't optimal for performance. I'd be interested in exploring concurrent crawling with multiple threads to speed up the process. However, this would need careful consideration around rate limiting - I'd need to ensure the concurrent crawlers don't accidentally overwhelm the target servers with too many simultaneous requests.

- To prevent the crawler from getting trapped in infinite loops, I'd add a depth counter to limit how deep the crawler can go on any given path.

#### Resilience

- The current error handling is functional but failed URLs are stored in an unprocessableURLs array and reported at the end. Given more time, I'd implement a more sophisticated retry mechanism with exponential backoff. Instead of just storing URL strings, I'd create objects containing the failed URL, retry count, and timeout period. This would allow for intelligent retry attempts with increasing delays between each try, up to a maximum number of attempts before considering the URL truly unprocessable.

- Another limitation is the lack of state persistence. If the script stops running, all progress is lost and the crawler needs to start over from the beginning. I'd opt for a simple solution by using Node's writeFileSync to periodically save the current state (visited URLs and queue contents) to disk. This would allow the crawler to resume from where it left off if interrupted. With my current implementation, I'd have to restructure how the crawler receives its initial URL(s), but this change would make it much more resilient.

#### Test Coverage Improvements

The current test suite covers the basic happy paths and essential error cases. With more time, I would expand the test coverage to include:

- Edge cases for HTML parsing and URL extraction
- Comprehensive validation of robots.txt parsing
- Rate limiting behavior verification
- Network failure scenarios and retry mechanisms (once implemented)
- State management and queue processing edge cases (once implemented)
- Concurrent request handling (once implemented)
