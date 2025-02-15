/**
 * @fileoverview Write a simple web crawler in a programming language you're familiar with. Given a starting URL, the crawler should visit each URL it finds on the same domain. It should print each URL visited, and a list of links found on that page. The crawler should be limited to one subdomain - so when you start with *https://monzo.com/*, it would crawl all pages on the monzo.com website, but not follow external links, for example to facebook.com or community.monzo.com. We would like to see your own implementation of a web crawler. Please do not use frameworks like scrapy or go-colly which handle all the crawling behind the scenes or someone else's code. You are welcome to use libraries to handle things like HTML parsing.
 */

/**
 * @typedef {Object} CrawledURLs
 * @property {string} parentURL - URL visited
 * @property {array} childrenLinks - an array of links found on that page
 */

/**
 * @type {Function} WebCrawler
 * @description - A simple web crawler that, given a starting URL, visits each URL it finds on the same domain and outputs the visited URL and links found on that page
 * @param {string} - starting URL
 * @returns {CrawledURLs[]} - an array of crawled URL objects
 */
(() => {
    console.log('hello world')
})();