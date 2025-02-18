jest.mock('../lib/helpers', () => ({
	fetchHTML: jest.fn().mockResolvedValue('<!DOCTYPE html><html><body>Test</body></html>'),
	fetchRobotsTxt: jest.fn().mockResolvedValue(['/private/']),
	htmlUrlExtractor: jest.fn().mockResolvedValue(['https://monzo.com/test1']),
	tidyUpUrlQueue: jest.fn().mockReturnValue([])
}));

const { crawl } = require('../index.js');
const { fetchHTML, fetchRobotsTxt, htmlUrlExtractor, tidyUpUrlQueue } = require('../lib/helpers');

describe('Web Crawler', () => {
	const url = 'https://monzo.com';
	let mockExit;
	const mockSeedUrl = new URL(url).href;
	const mockSeedUrlOrigin = new URL(url).origin;

	beforeEach(() => {
		jest.spyOn(console, 'log').mockImplementation(() => {});
		jest.spyOn(console, 'error').mockImplementation(() => {});
		mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
			throw new Error(`Process.exit() was called with: ${code}`);
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	it('should successfully crawl a website', async () => {
		const testArgv = ['node', 'index.js', mockSeedUrl];

		try {
			await crawl(testArgv);
		} catch (error) {
			// if unexpected process.exit, then fail the test
			if (!error.message.includes('Process.exit() was called')) {
				throw error;
			}
		}

		expect(fetchRobotsTxt).toHaveBeenCalledWith(mockSeedUrlOrigin);
		expect(fetchHTML).toHaveBeenCalledWith(mockSeedUrl);
		expect(htmlUrlExtractor).toHaveBeenCalled();
		expect(tidyUpUrlQueue).toHaveBeenCalled();
		expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Web crawler complete!'));
		expect(mockExit).not.toHaveBeenCalled();
	});

	it('should handle missing seed URL', async () => {
		const testArgv = ['node', 'index.js'];

		await expect(crawl(testArgv)).rejects.toThrow('Process.exit() was called with: 1');
		expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Seed URL not provided'));
		expect(mockExit).toHaveBeenCalledTimes(1);
	});
});
