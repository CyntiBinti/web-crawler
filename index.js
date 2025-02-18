#!/usr/bin/env node

/**
 * @file Write a simple web crawler in a programming language you're familiar with. Given a starting URL, the crawler should visit each URL it finds on the same domain. It should print each URL visited, and a list of links found on that page. The crawler should be limited to one subdomain - so when you start with *https://monzo.com/*, it would crawl all pages on the monzo.com website, but not follow external links, for example to facebook.com or community.monzo.com. We would like to see your own implementation of a web crawler. Please do not use frameworks like scrapy or go-colly which handle all the crawling behind the scenes or someone else's code. You are welcome to use libraries to handle things like HTML parsing.
 */

const { URL } = require('node:url');
const { requestDelay } = require('./lib/utils');
const { fetchRobotsTxt, fetchHTML, htmlUrlExtractor, tidyUpUrlQueue } = require('./lib/helpers');

/**
 * @description - A simple web crawler that, given a starting URL, visits each URL it finds on the same domain and outputs in the console the visited URL and links found on that page
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function webCrawler(args) {
	try {
		if (!args[2]) {
			throw new Error('Seed URL not provided. Exiting web crawler.');
		}

		let seedUrl;

		// validate args[2] can be parsed as a url
		try {
			seedUrl = new URL(args[2]);
		} catch (error) {
			throw new Error('Seed URL provided can not be parsed as a valid URL. Exiting web crawler.');
		}

		// use origin to ensure found links are of the same subdomain as the seed URL
		const SEED_URL_ORIGIN = seedUrl.origin;

		const DISALLOWED_ROBOTS_TXT_PATHS = await fetchRobotsTxt(SEED_URL_ORIGIN);

		/**
		 * @type {string[]}
		 */
		let urlQueue = [];

		/**
		 * @type {string[]}
		 */
		const visitedUrls = [];

		/**
		 * @type {string[]}
		 */
		const unprocessableUrls = [];

		urlQueue.push(seedUrl.href);

		while (urlQueue.length > 0) {
			// add a 1 second delay between requests to rate limit the crawler
			await requestDelay(1000);

			const currentUrl = urlQueue[0];

			console.log(`🔄 Attempting to crawl "${currentUrl}" page...`);

			const html = await fetchHTML(currentUrl);

			// if fetchHTML() successful
			if (html) {
				console.log(`🎉 Crawl successful.`);
				visitedUrls.push(currentUrl);

				const foundUrls = await htmlUrlExtractor(html, SEED_URL_ORIGIN);

				if (foundUrls.length > 0) {
					console.log(
						`🔗 Found these links on "${currentUrl}" page:\n"${foundUrls.join(' | ')}"\n`
					);

					const tidiedUpUrlQueue = tidyUpUrlQueue(
						urlQueue,
						visitedUrls,
						DISALLOWED_ROBOTS_TXT_PATHS,
						SEED_URL_ORIGIN,
						foundUrls
					);
					urlQueue = [...tidiedUpUrlQueue];
				} else {
					console.log(
						`⛓️‍💥 No links found on "${currentUrl}" page. Removing from the queue and adding to unprocessed list. Moving onto next page to crawl.`
					);
					unprocessableUrls.push(currentUrl);
					urlQueue.shift();
				}
			} else {
				// if HTML can't be fetched, then for now remove from the queue
				console.log(
					`❌ Failure: Could not crawl "${currentUrl}" page. Removing from the queue and adding to unprocessed list. Moving onto next page to crawl.`
				);
				unprocessableUrls.push(currentUrl);
				urlQueue.shift();
			}
		}
		console.log(
			`\n🙌 Web crawler complete! I crawled a total of ${visitedUrls.length} web pages.\nUnable to crawl ${unprocessableUrls.length} URLs.\n${unprocessableUrls.length > 0 ? `Here they are: ${unprocessableUrls.join(' | ')}` : ''}`
		);
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}

// only run the crawler if this file is being executed directly
// this is to prevent the crawler from running when this file is imported into a test file
if (require.main === module) {
	webCrawler(process.argv);
}

// Export for testing
module.exports = { webCrawler };
