require("dotenv").config();

const util = require("util"),
	express = require("express"),
	app = express(),
	port = process.env.PORT || 8080,
	pptr = require("./puppeteer.launcher"),
	CronJob = require("cron").CronJob,
	{
		refineScrapedProducts,
		saveProducts,
		scrapeProducts
	} = require("./flash.sale"),
	scrapeFlashSaleJobFrequency = process.env.SCRAPE_JOB_FREQUENCY_MINUTES || 5,
	scrapeFlashSaleJob = new CronJob(
		`0 */${scrapeFlashSaleJobFrequency} * * * *`,
		scrapeFlashSaleCommand
	); 

app.listen(port, async () => {
	console.log(`app is listening on port ${port}!`);
	scrapeFlashSaleJob.start();
	console.log(
		`scrapeFlashSaleJob is set to run at every ${scrapeFlashSaleJobFrequency} minutes`
	);
});

async function scrapeFlashSaleCommand() {
	let browser;
	try {
		console.log(`${new Date()} begin scraping`);
		browser = await pptr();

		const page = await browser.newPage();

		const scrapedProducts = await scrapeProducts(page);
		await saveProducts(refineScrapedProducts(scrapedProducts));

		console.log(
			`${new Date()} ${scrapedProducts.length} products scraped.`
		);
	} catch (error) {
		console.log(util.inspect(error));
	} finally {
		if (browser) await browser.close();
	}
}
