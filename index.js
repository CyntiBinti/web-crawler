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
			throw new Error(`Axios response error (${response.status}) when fetching HTML from "${url}`);
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

			if (extractedLink) {
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
		}

		return rationalisedExtractedURLs;
	} catch (error) {
		console.error(error);
	}
};

/**
 * @type {Function} validateUrlArray
 * @description - A utility function that validates whether the parsed argument is a non-empty, valid array of strings
 * @param {string[]} array - an array of strings
 * @param {string} name - name of the array to output in error message
 */
const validateUrlArray = (array, name) => {
	if (
		!Array.isArray(array) ||
		array.length === 0 ||
		!array.every((url) => typeof url === 'string')
	) {
		throw new Error(`${name} provided to tidyUpUrlQueue function is invalid`);
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
	validateUrlArray(urlQueue, 'URL queue');
	validateUrlArray(DISALLOWED_ROBOTS_TXT_PATHS, 'Robots.txt disallowed paths');
	validateUrlArray(extractedURLs, 'Extracted URLs');

	if (!Array.isArray(visitedURLs)) {
		throw new Error('Visited URLs provided to tidyUpUrlQueue function is not an array.');
	}

	if (!seedOrigin || typeof seedOrigin !== 'string') {
		throw new Error('Seed origin provided to tidyUpUrlQueue function is invalid.');
	}

	// create a Set of all URLs to exclude
	const excludeSet = new Set([...visitedURLs, ...urlQueue]);

	const newValidURLs = extractedURLs.filter((url) => {
		// check if URL is valid and hasn't been seen before
		const isNewURL = !excludeSet.has(url);
		// check if URL is allowed by robots.txt
		const isAllowedByRobots = !DISALLOWED_ROBOTS_TXT_PATHS.some((path) => url.includes(path));
		// check if URL is in the correct domain
		const isCorrectDomain = url.startsWith(seedOrigin);
		// check if URL is not a PDF, MP3, M4A, PNG, JPG file type
		const FILE_EXTENSIONS = ['.pdf', '.mp3', '.m4a', '.png', '.jpg'];
		const isNotAFileType = !FILE_EXTENSIONS.some((ext) => url.toLowerCase().endsWith(ext));

		return isNewURL && isAllowedByRobots && isCorrectDomain && isNotAFileType;
	});

	// remove the currently processed URL (first item) from the queue
	// and add the new valid URLs to the end
	const updatedQueue = [...urlQueue.slice(1), ...newValidURLs];

	console.log("🕷️ I've crawled", visitedURLs.length, 'URLs so far!');
	console.log('📈 Queue length is currently:', updatedQueue.length);
	console.log('🚫 Currently excluding:', excludeSet.size, 'URLs');
	console.log('🔎 Found', extractedURLs.length, 'raw URLs');
	console.log('💫 Adding', newValidURLs.length, 'new valid URLs to queue');

	return updatedQueue;
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
			const unprocessableURLs = [];

			urlQueue.push(seedURL.href);

			while (urlQueue.length > 0) {
				const currentURL = urlQueue[0];

				console.log(`🔄 Attempting to crawl "${currentURL}" page...`);
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
					} else {
						console.log(
							`⛓️‍💥 No links found on "${currentURL}" page. Removing from the queue and adding to unprocessed list. Moving onto next page to crawl.`
						);
						unprocessableURLs.push(currentURL);
						urlQueue.shift();
					}
				} else {
					// if HTML can't be fetched, then for now remove from the queue
					console.log(
						`❌ Failure: Could not crawl "${currentURL}" page. Removing from the queue and adding to unprocessed list. Moving onto next page to crawl.`
					);
					unprocessableURLs.push(currentURL);
					urlQueue.shift();
				}
			}
			console.log(
				`\n🙌 Web crawler complete! I crawled a total of ${visitedURLs.length} web pages.\nUnable to crawl ${unprocessableURLs.length} URLs.\n${unprocessableURLs.length > 0 ? `Here they are: ${unprocessableURLs.join(' | ')}` : ''}`
			);
		} catch (error) {
			console.error(error.message);
			process.exit(1);
		}
	}
)();
