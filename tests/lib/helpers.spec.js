jest.mock('axios');

const axios = require('axios').default;
const {
	fetchRobotsTxt,
	fetchHTML,
	htmlUrlExtractor,
	tidyUpUrlQueue
} = require('../../lib/helpers');

describe('Helper Functions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('fetchRobotsTxt', () => {
		it('should fetch and parse robots.txt successfully', async () => {
			const mockRobotsTxt = `
				User-agent: *
				Disallow: /private/
				Allow: /public/
			`;

			jest.spyOn(axios, 'get').mockResolvedValueOnce({
				status: 200,
				data: mockRobotsTxt
			});

			const result = await fetchRobotsTxt('https://monzo.com');
			expect(result).toEqual(['/private/']);
		});
	});

	describe('fetchHTML', () => {
		it('should fetch HTML successfully', async () => {
			const mockHtml = '<!DOCTYPE html><html><body>Test</body></html>';

			jest.spyOn(axios, 'get').mockResolvedValueOnce({
				status: 200,
				data: mockHtml
			});

			const result = await fetchHTML('https://monzo.com/test');
			expect(result).toBe(mockHtml);
		});
	});

	describe('htmlUrlExtractor', () => {
		it('should extract valid URLs from HTML', async () => {
			const mockHtml = `
        <!DOCTYPE html>
        <html>
        <body>
            <a href="https://monzo.com/test1">Link 1</a>
            <a href="/test2">Link 2</a>
            <a href="https://external.com/test3">Link 3</a>
        </body>
        </html>
    `;

			const result = await htmlUrlExtractor(mockHtml, 'https://monzo.com');

			expect(result).toContain('https://monzo.com/test1');
			expect(result).toContain('https://monzo.com/test2');
			expect(result).not.toContain('https://external.com/test3');
		});
	});

	describe('tidyUpUrlQueue', () => {
		it('should filter and update URL queue correctly', () => {
			const result = tidyUpUrlQueue(
				['https://monzo.com/test1'],
				['https://monzo.com/visited'],
				['/private/'],
				'https://monzo.com',
				['https://monzo.com/test2', 'https://monzo.com/private/test3']
			);

			expect(result).toContain('https://monzo.com/test2');
			expect(result).not.toContain('https://monzo.com/private/test3');
			expect(result).not.toContain('https://monzo.com/visited');
		});
	});
});
