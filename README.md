# Web Crawler

A simple web crawler that, given a starting URL, visits each URL it finds on the same domain and outputs the visited URL and links found on that page.

- [Getting Started](#getting-started)
- [Usage](#usage)
- [Reflections](#reflections)
  - [Limitations](#limitations)

## Getting Started

This node.js script is compatible with node v18+

Unzip the downloaded files, and from your terminal set your current directory to the root of the web-crawler, and install the necessary dependencies:

```bash
cd web-crawler && npm install
```

## Usage

For this script to run, pass in a starting URL as an argument e.g.:

```bash
node index.js https://www.monzo.com/
```

To run the tests, execute the below:

```bash
npm run test
```

## Reflections

This was an enjoyably challenging task, balancing robustness and pragmatism, in light of the time constraints.

### Limitations

- Doesn't handle re-directs e.g. `'https://monzo.com/'` vs `'https://www.monzo.com/'` - both appear in the unique set. Could get around this by checking IP address with DNS perhaps
- handling non-web page elements e.g. pdfs
- could improve using BFS (over DFS) as essentially a graph, and want to avoid potential crawler-trap with DFS approach
- if crawler fails how does it fail gracefully
- if a URL fails then how will it retry (ddos/rate limiting) - ?add into a timeout queue to retry later up to max 5 re-tries
