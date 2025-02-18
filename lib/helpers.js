const { URL } = require('node:url');
const axios = require('axios').default;
const cheerio = require('cheerio');
const { validateUrlArray } = require('./utils');

/**
 * @typedef {import("axios").AxiosResponse} AxiosResponse
 */

/**
 * @description - An async function that fetches the robots.txt page from the provided URL
 * @param {string} url - the URL to fetch the robots.txt page
 * @returns {Promise<string[]>} - an array of disallowed paths to web crawl
 */
exports.fetchRobotsTxt = async function fetchRobotsTxt(url) {
	if (!url || typeof url !== 'string') {
		throw new Error('URL provided to fetchRobotsTxt function is invalid.');
	}

	/**
	 * @type {string[]} - an array of disallowed paths
	 */
	const DISALLOWED_PATHS = [];

	try {
		/**
		 * @type {AxiosResponse}
		 */
		const response = await axios.get(`${url}/robots.txt`);

		if (!response || response.status >= 400) {
			throw new Error(
				`Axios response error (${response.status}) when fetching robots.txt page from "${url}`
			);
		}

		if (response) {
			const { data } = response;
			if (data && typeof data === 'string') {
				data.split('\n').forEach((line) => {
					// trim whitespace and match Disallow pattern (until a space or # for comments is found)
					// capturing group [1] just has the path part
					const regex = /^\s*Disallow:\s*(\/[^\s#]*)/;
					const match = line.match(regex);
					if (match) {
						DISALLOWED_PATHS.push(match[1]);
					}
				});
			}
		}

		return DISALLOWED_PATHS;
	} catch (error) {
		throw error;
	}
};

/**
 * @description - An async function that spins up a HTTP/S client and fetches the HTML from the provided URL
 * @param {string} url - the URL to fetch the raw HTML
 * @returns {Promise<string>} - the raw HTML
 */
exports.fetchHTML = async function fetchHTML(url) {
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
 * @description - An async function that extracts valid URL(s) from the provided HTML
 * @param {string} html - the raw HTML
 * @param {string} seedOrigin - the seed URL origin
 * @returns {Promise<string[]>} - an array of URL(s)
 */
exports.htmlUrlExtractor = async function htmlUrlExtractor(html, seedOrigin) {
	if (!html || typeof html !== 'string') {
		throw new Error('HTML provided to htmlUrlExtractor function is invalid.');
	}

	if (!seedOrigin || typeof seedOrigin !== 'string') {
		throw new Error('Seed origin provided to htmlUrlExtractor function is invalid.');
	}

	try {
		// $ = jQuery syntax as per cheerio docs
		const $ = cheerio.load(html);
		const links = $('a');

		/**
		 * @type {string[]}
		 */
		const rationalisedextractedUrls = [];

		for (const link of Array.from(links)) {
			const extractedLink = $(link).attr('href');

			if (extractedLink) {
				if (extractedLink.startsWith(seedOrigin)) {
					rationalisedextractedUrls.push(extractedLink);
				}

				if (extractedLink.startsWith('/')) {
					try {
						const extractedUrl = new URL(extractedLink, seedOrigin);
						rationalisedextractedUrls.push(extractedUrl.href);
					} catch (error) {
						throw new Error(
							'htmlUrlExtractor could not construct a valid URL from extracted link in HTML text.'
						);
					}
				}
			}
		}

		return rationalisedextractedUrls;
	} catch (error) {
		console.error(error);
	}
};

/**
 * @description - A function that tidy's up the URL queue (remove disallowed paths, duplicates, previously visited, etc)
 * @param {string[]} urlQueue - the URL queue
 * @param {string[]} visitedUrls - an array of previously visited URLs
 * @param {string[]} DISALLOWED_ROBOTS_TXT_PATHS - an array of disallowed robots.txt paths
 * @param {string} seedOrigin - the seed URL origin
 * @param {string[]} extractedUrls - an array of extracted URLs
 * @returns {string[]} - a queue with unique URLs
 */
exports.tidyUpUrlQueue = function tidyUpUrlQueue(
	urlQueue,
	visitedUrls,
	DISALLOWED_ROBOTS_TXT_PATHS,
	seedOrigin,
	extractedUrls
) {
	validateUrlArray(urlQueue, 'URL queue');
	validateUrlArray(DISALLOWED_ROBOTS_TXT_PATHS, 'Robots.txt disallowed paths');
	validateUrlArray(extractedUrls, 'Extracted URLs');

	if (!Array.isArray(visitedUrls)) {
		throw new Error('Visited URLs provided to tidyUpUrlQueue function is not an array.');
	}

	if (!seedOrigin || typeof seedOrigin !== 'string') {
		throw new Error('Seed origin provided to tidyUpUrlQueue function is invalid.');
	}

	// create a Set of all URLs to exclude
	const excludeSet = new Set([...visitedUrls, ...urlQueue]);

	const newValidUrls = extractedUrls.filter((url) => {
		// check if URL is valid and hasn't been seen before
		const isNewUrl = !excludeSet.has(url);
		// check if URL is allowed by robots.txt
		const isAllowedByRobots = !DISALLOWED_ROBOTS_TXT_PATHS.some((path) => url.includes(path));
		// check if URL is in the correct domain
		const isCorrectDomain = url.startsWith(seedOrigin);
		// check if URL is not a PDF, MP3, M4A, PNG, JPG file type
		const FILE_EXTENSIONS = ['.pdf', '.mp3', '.m4a', '.png', '.jpg'];
		const isNotAFileType = !FILE_EXTENSIONS.some((ext) => url.toLowerCase().endsWith(ext));

		return isNewUrl && isAllowedByRobots && isCorrectDomain && isNotAFileType;
	});

	// remove the currently processed URL (first item) from the queue
	// and add the new valid URLs to the end
	const updatedQueue = [...urlQueue.slice(1), ...newValidUrls];

	console.log("🕷️ I've crawled", visitedUrls.length, 'URLs so far!');
	console.log('📈 Queue length is currently:', updatedQueue.length);
	console.log('🚫 Currently excluding:', excludeSet.size, 'URLs');
	console.log('🔎 Found', extractedUrls.length, 'raw URLs');
	console.log('💫 Adding', newValidUrls.length, 'new valid URLs to queue');

	return updatedQueue;
};
