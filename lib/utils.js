/**
 * @description - A utility function that validates whether the parsed argument is a non-empty, valid array of strings
 * @param {string[]} array - an array of strings
 * @param {string} name - name of the array to output in error message
 */
exports.validateUrlArray = function validateUrlArray(array, name) {
	if (
		!Array.isArray(array) ||
		array.length === 0 ||
		!array.every((url) => typeof url === 'string')
	) {
		throw new Error(`${name} provided to tidyUpUrlQueue function is invalid`);
	}
};

/**
 * @description - A function that delays requests (rate limit) by setting a timeout
 * @param {number} ms - Milliseconds to set the timeout too
 * @returns {Promise<void>}
 */
exports.requestDelay = async function requestDelay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
