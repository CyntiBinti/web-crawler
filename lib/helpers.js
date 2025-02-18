const { URL } = require('node:url');
const axios = require('axios').default;
const cheerio = require('cheerio');
const { validateUrlArray } = require('./utils');

/**
 * @typedef {import("axios").AxiosResponse} AxiosResponse
 */

/**
 * @description - An async function that fetches the robots.txt page from the provided URL, if it exists
 * @param {string} url - the URL to fetch the robots.txt page
 * @returns {Promise<string[] | []>} - an array of disallowed paths to web crawl, or an empty array
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
	} catch (error) {
		// fail gracefully
		if (error.response && error.response.status >= 400) {
			console.warn(`⚠️ No robots.txt found at "${url}". Proceeding without restrictions.`);
		} else {
			console.error(`❌ Error fetching robots.txt from "${url}":`, error.message);
		}
	}

	// return an array of disallowed paths or an empty array to still allow crawling
	return DISALLOWED_PATHS;
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

		// Ensure response.data is a HTML string
		if (response) {
			const { data } = response;
			if (data && typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
				return data;
			}
		}
	} catch (error) {
		// fail gracefully
		if (error.response && error.response.status >= 400) {
			console.warn(
				`⚠️ Axios response error (${error.response.status}) when fetching HTML from "${url}". Proceeding to next URL.`
			);
		} else {
			console.error(`❌ Error fetching HTML from "${url}":`, error.message);
		}
	}
};

/**
 * @description - An async function that extracts valid URL(s) from the provided HTML
 * @param {string} html - the raw HTML
 * @param {string} urlOrigin - the seed URL origin
 * @returns {Promise<string[]>} - an array of URL(s)
 */
exports.htmlUrlExtractor = async function htmlUrlExtractor(html, urlOrigin) {
	if (!html || typeof html !== 'string') {
		throw new Error('HTML provided to htmlUrlExtractor function is invalid.');
	}

	if (!urlOrigin || typeof urlOrigin !== 'string') {
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
				if (extractedLink.startsWith(urlOrigin)) {
					rationalisedextractedUrls.push(extractedLink);
				}

				if (extractedLink.startsWith('/')) {
					try {
						const extractedUrl = new URL(extractedLink, urlOrigin);
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
		//fail gracefully
		console.error('❌ Error extracting URLs from HTML:', error.message);
	}
};

/**
 * @description - A function that tidy's up the URL queue (remove disallowed paths, duplicates, previously visited, etc)
 * @param {string[]} urlQueue - the URL queue
 * @param {string[]} visitedUrls - an array of previously visited URLs
 * @param {string[]} DISALLOWED_ROBOTS_TXT_PATHS - an array of disallowed robots.txt paths, if any
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
	validateUrlArray(extractedUrls, 'Extracted URLs');

	if (!Array.isArray(DISALLOWED_ROBOTS_TXT_PATHS)) {
		throw new Error(
			'Robots.txt disallowed paths provided to tidyUpUrlQueue function is not an array.'
		);
	}

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
		// check if URL is allowed by robots.txt (or if robots.txt is empty)
		const isAllowedByRobots =
			DISALLOWED_ROBOTS_TXT_PATHS.length === 0 ||
			!DISALLOWED_ROBOTS_TXT_PATHS.some((path) => url.includes(path));
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
