require("dotenv").config();
const {
	refineScrapedProducts,
	saveProducts,
	scrapeProducts
} = require("./flash.sale");
describe("test flash sale scrape", () => {
	let browser;
	beforeAll(async () => {
		browser = await require("./puppeteer.launcher")();
	});

	it("should scrape and save products", async () => {
		const page = await browser.newPage();
		const scrapedProducts = await scrapeProducts(page);
		await saveProducts(refineScrapedProducts(scrapedProducts));
		await page.close();
	}, 160000);
});
