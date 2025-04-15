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

			const result = await fetchRobotsTxt('https://insert-site.com');
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

			const result = await fetchHTML('https://insert-site.com/test');
			expect(result).toBe(mockHtml);
		});
	});

	describe('htmlUrlExtractor', () => {
		it('should extract valid URLs from HTML', async () => {
			const mockHtml = `
        <!DOCTYPE html>
        <html>
        <body>
            <a href="https://insert-site.com/test1">Link 1</a>
            <a href="/test2">Link 2</a>
            <a href="https://external.com/test3">Link 3</a>
        </body>
        </html>
    `;

			const result = await htmlUrlExtractor(mockHtml, 'https://insert-site.com');

			expect(result).toContain('https://insert-site.com/test1');
			expect(result).toContain('https://insert-site.com/test2');
			expect(result).not.toContain('https://external.com/test3');
		});
	});

	describe('tidyUpUrlQueue', () => {
		it('should filter and update URL queue correctly', () => {
			const result = tidyUpUrlQueue(
				['https://insert-site.com/test1'],
				['https://insert-site.com/visited'],
				['/private/'],
				'https://insert-site.com',
				['https://insert-site.com/test2', 'https://insert-site.com/private/test3']
			);

			expect(result).toContain('https://insert-site.com/test2');
			expect(result).not.toContain('https://insert-site.com/private/test3');
			expect(result).not.toContain('https://insert-site.com/visited');
		});
	});
});
