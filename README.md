# Web Crawler

A robust web crawler implementation that, given a starting URL, systematically visits each URL it finds on the same domain and outputs both the visited URL and links found on that page. The crawler respects robots.txt directives and implements proper web crawling etiquette.

- [Getting Started](#getting-started)
- [Usage](#usage)
- [Reflections](#reflections)
  - [Functional Requirements](#functional-requirements)
  - [Technical Overview](#technical-overview)
  - [Future Enhancements](#future-enhancements)

## Getting Started

This Node.js script requires Node.js version 12 or higher. To set up the project:

```bash
cd web-crawler && npm install
```

Dependencies:

- `axios`: HTTP client for making requests
- `cheerio`: HTML parsing library

## Usage

Run the crawler by providing a starting URL:

```bash
node index.js https://monzo.com/
```

Execute the test suite:

```bash
npm run test
```

Example outputs of the crawler and the test suite can be found in the `./examples` directory.

```bash
examples/
├── crawler-output-image-error-handling
├── crawler-output-image-finished
├── crawler-output-video
└── test-output-image
```

## Reflections

Hello 👋 thanks for the opportunity to interview with Monzo! This was an enjoyably challenging task, balancing robustness and pragmatism within the time constraints.

### Functional Requirements

I feel my solution successfully meets all the core requirements:

✓ Visits each URL on the same domain  
✓ Prints visited URLs and found links  
✓ Restricts to one subdomain  
✓ Custom implementation without crawler frameworks  
✓ Uses permitted libraries only for HTML parsing  
✓ Comprehensive test coverage

### Technical Overview

The crawler is built with key features and considerations to ensure efficient, reliable, and maintainable web crawling:

#### Key Features

- **Queue Management**: Efficient URL handling with a Set-based approach to prevent duplicates, enforce domain restrictions, and optimise memory use. Uses FIFO structure to crawl pages level by level (BFS-like approach).
- **Robots.txt Compliance**: Parses robots.txt to respect site restrictions, filtering out disallowed paths.
- **URL Processing**: Supports absolute and relative URLs, validates them before processing, and filters out binary file types (PDF, MP3, JPG, etc.).

#### Error Handling & Safety Features

- **Input Validation**: Ensures valid URLs and correctly formatted input.
- **Graceful Failure**: Handles failed requests with clear error messages, and logs detailed reasons for failures.
- **Rate Limiting**: Prevents server overload by limiting request frequency.
- **Content-Type Validation**: Ensures only HTML content is parsed.

#### Architecture & Performance

- **Modular Design**: Clear separation of concerns with single-responsibility functions and comprehensive JSDoc documentation.
- **Memory & Time Efficiency**: Optimised with time and space complexity of O(n), leveraging Set-based duplicate detection and optimised queue management for scalable crawling.

#### Developer Experience

- **Logging**: Provides detailed logs for debugging and insights into crawling status.
- **Maintainability**: Well-structured codebase with consistent error handling for easy updates and debugging.

### Future Enhancements

#### Processing URLs

- I noticed the crawler doesn't seem to handle redirects effectively - for example, both "https://monzo.com/" and "https://www.monzo.com/" appeared in the crawl queue, meaning some pages could potentially get crawled twice. With more time, I'd look into implementing DNS-level domain validation and standardising URLs (like stripping "www.") before adding them to the queue to prevent these duplicate crawls

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
