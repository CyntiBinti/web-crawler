/**
 * @fileoverview Write a simple web crawler in a programming language you're familiar with. Given a starting URL, the crawler should visit each URL it finds on the same domain. It should print each URL visited, and a list of links found on that page. The crawler should be limited to one subdomain - so when you start with *https://monzo.com/*, it would crawl all pages on the monzo.com website, but not follow external links, for example to facebook.com or community.monzo.com. We would like to see your own implementation of a web crawler. Please do not use frameworks like scrapy or go-colly which handle all the crawling behind the scenes or someone else's code. You are welcome to use libraries to handle things like HTML parsing.
 */

const { argv } = require('node:process');
const { URL } = require('node:url');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * @type {Function} fetchHTML
 * @description - An async function that spins up a HTTP/S client and fetches the HTML from the provided URL
 * @param {string} - the URL to fetch the raw HTML
 * @returns {string} - the raw HTML
 */
const fetchHTML = async (url) => {
	if (!url || typeof url !== 'string') {
		throw new Error('URL provided to fetchHTML function is invalid.');
	}

	// TODO: change into an object that can be returned at the end once finished processing
	console.log(`🕷️ Currently crawling "${url}" page...`);

	// TODO: https://monzo.com/robots.txt >> check the robots.txt disallow list for politeness. **DO THIS INITIALLY AND STORE IN DISALLOWED_PATHS ARRAY**
	// TODO: What about if we fail to fetch a URL? add into a timeout queue to retry later up to max 5 re-tries?
	try {
		const response = await axios.get(url);
		console.log(
			`🎉 Crawl successful. Below are the links I found on "${url}" page`
		);
		if (response) {
			const { data } = response;
			if (data && typeof data === 'string') {
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
 * @param {string} - the raw HTML
 * @param {string} - the seed URL origin
 * @param {string[]} - an array of previously visited URLs
 * @returns {string[]} - an array of URL(s)
 */
const htmlURLExtractor = async (html, seedOrigin, visitedURLs) => {
	if (!html || typeof html !== 'string') {
		throw new Error(
			'HTML provided to htmlURLExtractor function is invalid.'
		);
	}

	try {
		// $ = jQuery syntax as per cheerio docs
		const $ = cheerio.load(html);
		const links = $('a');
		const rationalisedExtractedURLs = [];

		for (const link of links) {
			const extractedLink = $(link).attr('href');

			console.log(
				`🔗 Found this link "${extractedLink}" whilst crawling the current page`
			);

			if (extractedLink.startsWith(seedOrigin)) {
				rationalisedExtractedURLs.push(extractedLink);
			}

			if (extractedLink.startsWith('/')) {
				try {
					extractedURL = new URL(extractedLink, seedOrigin);
					rationalisedExtractedURLs.push(extractedURL.href);
				} catch (error) {
					throw new Error(
						'htmlURLExtractor could not construct a valid URL from extracted link in HTML text.'
					);
				}
			}
		}
		// TODO: filter through rationalisedExtractedURLs array and remove duplicates before returning and those already visited
		return rationalisedExtractedURLs;
	} catch (error) {
		console.error(error);
	}
};

/**
 * @typedef {Object} CrawledURLs
 * @property {string} parentURL - URL visited
 * @property {array} childrenLinks - an array of links found on that page
 */

/**
 * @type {Function} webCrawler
 * @description - A simple web crawler that, given a starting URL, visits each URL it finds on the same domain and outputs the visited URL and links found on that page
 * @param {string} - Seed URL to start crawling from
 * @returns {CrawledURLs[]} - an array of crawled URL objects and their associated links
 */
(async () => {
	try {
		if (!argv[2]) {
			throw new Error('Seed URL not provided. Exiting web crawler.');
		}

		// validate argv[2] can be parsed as a url
		let seedURL;

		try {
			seedURL = new URL(argv[2]);
		} catch (error) {
			throw new Error(
				'Seed URL provided can not be parsed as a valid URL. Exiting web crawler.'
			);
		}

		// use origin to ensure found links are of the same subdomain as the seed URL
		const SEED_URL_ORIGIN = seedURL.origin;

		/**
		 * @type {string[]}
		 */
		const urlQueue = [];

		/**
		 * @type {string[]}
		 */
		const visitedURLs = [];

		urlQueue.push(seedURL.href);

		console.log('urlQueue START', urlQueue);

		// TODO: tidy up while-loop
		while (urlQueue.length > 0) {
			const currentURL = urlQueue[0];

			if (visitedURLs.includes(currentURL)) {
				// if we've already visited that url then skip it
				continue;
			}

			if (!currentURL.startsWith(SEED_URL_ORIGIN)) {
				// if the url isn't of the same subdomain as the seed URL then skip it
				continue;
			}

			/**
			 * @type {string}
			 */
			const html = await fetchHTML(currentURL);

			// if fetchHTML() successful
			if (html) {
				visitedURLs.push(currentURL);
				urlQueue.shift();
				const foundURLs = await htmlURLExtractor(
					html,
					SEED_URL_ORIGIN,
					visitedURLs
				);
				urlQueue.push(...foundURLs);
			}
			// console.log('urlQueue END', urlQueue);
			// console.log('visitedURLs', visitedURLs);
		}
		// console.log('urlQueue END', urlQueue);
		// console.log('visitedURLs', visitedURLs);
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
})();