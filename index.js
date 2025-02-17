#!/usr/bin/env node

/**
 * @file Write a simple web crawler in a programming language you're familiar with. Given a starting URL, the crawler should visit each URL it finds on the same domain. It should print each URL visited, and a list of links found on that page. The crawler should be limited to one subdomain - so when you start with *https://monzo.com/*, it would crawl all pages on the monzo.com website, but not follow external links, for example to facebook.com or community.monzo.com. We would like to see your own implementation of a web crawler. Please do not use frameworks like scrapy or go-colly which handle all the crawling behind the scenes or someone else's code. You are welcome to use libraries to handle things like HTML parsing.
 */

const { argv } = require('node:process');
const { URL } = require('node:url');
const axios = require('axios').default;
const cheerio = require('cheerio');

/**
 * @typedef {import("axios").AxiosResponse} AxiosResponse
 */

/**
 * @type {Function} fetchRobotsTxt
 * @description - An async function that fetches the robots.txt page from the provided URL
 * @param {string} seedUrl - the URL to fetch the robots.txt page
 * @returns {Promise<string[]>} - an array of disallowed paths to web crawl
 */
const fetchRobotsTxt = async (seedUrl) => {
	if (!seedUrl || typeof seedUrl !== 'string') {
		throw new Error('URL provided to fetchRobotsTxt function is invalid.');
	}

	const DISALLOWED_PATHS = [];

	try {
		/**
		 * @type {AxiosResponse}
		 */
		const response = await axios.get(`${seedUrl}/robots.txt`);

		if (!response || response.status >= 400) {
			throw new Error(
				`Axios response error (${response.status}) when fetching robots.txt page from "${seedUrl}`
			);
		}

		if (response) {
			const { data } = response;
			if (data && typeof data === 'string') {
				data.split('\n').map((line) => {
					// Matches everything after '/' until a space or # for comments is found. Capturing group [1] just has the path part
					const regex = /^Disallow:\s*(\/[^\s#]*)/;
					const match = line.match(regex);
					if (match) {
						DISALLOWED_PATHS.push(match[1]);
					}
				});
			}
		}

		return DISALLOWED_PATHS;
	} catch (error) {
		console.error(error);
	}
};

/**
 * @type {Function} fetchHTML
 * @description - An async function that spins up a HTTP/S client and fetches the HTML from the provided URL
 * @param {string} url - the URL to fetch the raw HTML
 * @returns {Promise<string>} - the raw HTML
 */
const fetchHTML = async (url) => {
	if (!url || typeof url !== 'string') {
		throw new Error('URL provided to fetchHTML function is invalid.');
	}

	try {
		/**
		 * @type {AxiosResponse}
		 */
		const response = await axios.get(url);

		if (!response || response.status >= 400) {
			throw new Error(`Axios response error (${response.status}) when fetching "${url}`);
		}

		// Ensure response.data is a HTML string
		if (response) {
			const { data } = response;
			if (data && typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
				return data;
			}
		}
	} catch (error) {
		console.error(error);
	}
};

/**
 * @type {Function} htmlURLExtractor
 * @description - An async function that extracts valid URL(s) from the provided HTML
 * @param {string} html - the raw HTML
 * @param {string} seedOrigin - the seed URL origin
 * @returns {Promise<string[]>} - an array of URL(s)
 */
const htmlURLExtractor = async (html, seedOrigin) => {
	if (!html || typeof html !== 'string') {
		throw new Error('HTML provided to htmlURLExtractor function is invalid.');
	}

	if (!seedOrigin || typeof seedOrigin !== 'string') {
		throw new Error('Seed origin provided to htmlURLExtractor function is invalid.');
	}

	try {
		// $ = jQuery syntax as per cheerio docs
		const $ = cheerio.load(html);
		const links = $('a');

		/**
		 * @type {string[]}
		 */
		const rationalisedExtractedURLs = [];

		for (const link of Array.from(links)) {
			const extractedLink = $(link).attr('href');

			if (extractedLink.startsWith(seedOrigin)) {
				rationalisedExtractedURLs.push(extractedLink);
			}

			if (extractedLink.startsWith('/')) {
				try {
					const extractedURL = new URL(extractedLink, seedOrigin);
					rationalisedExtractedURLs.push(extractedURL.href);
				} catch (error) {
					throw new Error(
						'htmlURLExtractor could not construct a valid URL from extracted link in HTML text.'
					);
				}
			}
		}

		return rationalisedExtractedURLs;
	} catch (error) {
		console.error(error);
	}
};

/**
 * @type {Function} tidyUpUrlQueue
 * @description - A function that tidy's up the URL queue (remove disallowed paths, duplicates, previously visited, etc)
 * @param {string[]} urlQueue - the URL queue
 * @param {string[]} visitedURLs - an array of previously visited URLs
 * @param {string[]} DISALLOWED_ROBOTS_TXT_PATHS - an array of disallowed robots.txt paths
 * @param {string} seedOrigin - the seed URL origin
 * @param {string[]} extractedURLs - an array of extracted URLs
 * @returns {string[]} - a queue with unique URLs
 */
const tidyUpUrlQueue = (
	urlQueue,
	visitedURLs,
	DISALLOWED_ROBOTS_TXT_PATHS,
	seedOrigin,
	extractedURLs
) => {
	if (
		!Array.isArray(urlQueue) ||
		urlQueue.length === 0 ||
		!urlQueue.every((url) => typeof url === 'string')
	) {
		throw new Error('URL queue provided to tidyUpUrlQueue function is invalid.');
	}

	if (!Array.isArray(visitedURLs)) {
		throw new Error('Visited URLs provided to tidyUpUrlQueue function is not an array.');
	}

	if (
		!Array.isArray(DISALLOWED_ROBOTS_TXT_PATHS) ||
		DISALLOWED_ROBOTS_TXT_PATHS.length === 0 ||
		!DISALLOWED_ROBOTS_TXT_PATHS.every((url) => typeof url === 'string')
	) {
		throw new Error('DISALLOWED_ROBOTS_TXT_PATHS provided to tidyUpUrlQueue function is invalid.');
	}

	if (!seedOrigin || typeof seedOrigin !== 'string') {
		throw new Error('Seed origin provided to tidyUpUrlQueue function is invalid.');
	}

	if (
		!Array.isArray(extractedURLs) ||
		extractedURLs.length === 0 ||
		!extractedURLs.every((url) => typeof url === 'string')
	) {
		throw new Error('Extracted URLs provided to tidyUpUrlQueue function is invalid.');
	}

	/**
	 * @type {string[]}
	 */
	let tidyUpExtractedURLs = [];

	// if the url doesn't contain a disallowed path, and it's not been visited yet,
	// and it is of the same subdomain, and it's not a pdf file, then keep it
	for (const url of extractedURLs) {
		if (
			!DISALLOWED_ROBOTS_TXT_PATHS.some((path) => url.includes(path)) &&
			!visitedURLs.includes(url) &&
			url.startsWith(seedOrigin) &&
			!url.endsWith('.pdf')
		) {
			tidyUpExtractedURLs.push(url);
		}
	}

	const queueSet = new Set([...tidyUpExtractedURLs, ...urlQueue]);
	const tidiedUpURLQueue = Array.from(queueSet.values());

	// return unique URLs in the queue
	return tidiedUpURLQueue;
};

/**
 * @typedef {object} CrawledURLs
 * @property {string} parentURL - URL visited
 * @property {Array} childrenLinks - an array of links found on that page
 */

/**
 * @type {Function} webCrawler
 * @description - A simple web crawler that, given a starting URL, visits each URL it finds on the same domain and outputs the visited URL and links found on that page
 * @returns {CrawledURLs[]} - an array of crawled URL objects and their associated links
 */
(
	async () => {
		try {
			if (!argv[2]) {
				throw new Error('Seed URL not provided. Exiting web crawler.');
			}

			let seedURL;

			// validate argv[2] can be parsed as a url
			try {
				seedURL = new URL(argv[2]);
			} catch (error) {
				throw new Error('Seed URL provided can not be parsed as a valid URL. Exiting web crawler.');
			}

			// use origin to ensure found links are of the same subdomain as the seed URL
			const SEED_URL_ORIGIN = seedURL.origin;

			/**
			 * @type {string[]}
			 */
			const DISALLOWED_ROBOTS_TXT_PATHS = await fetchRobotsTxt(SEED_URL_ORIGIN);

			/**
			 * @type {string[]}
			 */
			let urlQueue = [];

			/**
			 * @type {string[]}
			 */
			const visitedURLs = [];

			/**
			 * @type {string[]}
			 */
			const unprocessedURLs = [];

			urlQueue.push(seedURL.href);

			console.log('urlQueue length START', urlQueue.length);
			console.log('visitedURLs length START', visitedURLs.length);
			console.log('unprocessedURLs length START', unprocessedURLs.length);

			while (urlQueue.length > 0) {
				const currentURL = urlQueue[0];

				console.log(`🕷️ Attempting to crawl "${currentURL}" page...`);
				/**
				 * @type {string}
				 */
				const html = await fetchHTML(currentURL);

				// if fetchHTML() successful
				if (html) {
					console.log(`🎉 Crawl successful.`);
					visitedURLs.push(currentURL);

					/**
					 * @type {string[]}
					 */
					const foundURLs = await htmlURLExtractor(html, SEED_URL_ORIGIN);

					if (foundURLs.length > 0) {
						console.log(
							`🔗 Found these links on "${currentURL}" page:\n"${foundURLs.join(' | ')}"\n`
						);

						/**
						 * @type {string[]}
						 */
						const tidiedUpUrlQueue = tidyUpUrlQueue(
							urlQueue,
							visitedURLs,
							DISALLOWED_ROBOTS_TXT_PATHS,
							SEED_URL_ORIGIN,
							foundURLs
						);
						urlQueue = [...tidiedUpUrlQueue];

						urlQueue.shift();
					} else {
						console.log(
							`🔗 No links found on "${currentURL}" page. Removing from the queue and adding to unprocessed list. Moving onto next page to crawl.`
						);
						unprocessedURLs.push(currentURL);
						urlQueue.shift();
					}
				} else {
					// if HTML can't be fetched, then for now remove from the queue
					console.log(
						`🕷️ Failure: Could not crawl "${currentURL}" page. Removing from the queue and adding to unprocessed list. Moving onto next page to crawl.`
					);
					unprocessedURLs.push(currentURL);
					urlQueue.shift();
				}
				console.log('urlQueue length DURING', urlQueue.length);
				console.log('visitedURLs length DURING', visitedURLs.length);
				console.log('unprocessedURLs length DURING', unprocessedURLs.length);
			}
			console.log('urlQueue length END', urlQueue.length);
			console.log('visitedURLs length END', visitedURLs.length);
			console.log('unprocessedURLs length END', unprocessedURLs.length);
		} catch (error) {
			console.error(error.message);
			process.exit(1);
		}
	}
)();
