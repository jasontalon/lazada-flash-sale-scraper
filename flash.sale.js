const util = require("util"),
	axios = require("axios");

const chunk = (arr, size) =>
	Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
		arr.slice(i * size, i * size + size)
	);
const refineScrapedProducts = products => products.map(refineScrapedProduct);

function refineScrapedProduct(product) {
	const name = product.name.replace(/\"/gm, ""),
		salePrice = product.salePrice.replace(/[^\d\.\s]+/gm, "").trim(),
		origPrice = product.origPrice
			.split("-")[0]
			.replace(/[^\d\.\s]+/gm, "")
			.trim(),
		sold =
			(product.sold
				? product.sold.replace(/[^\d\.\s]+/gm, "").trim()
				: "") || "0",
		link = product.link.split("?")[0];

	return { name, salePrice, origPrice, sold, link };
}

function scrapeFlashSaleProducts() {
	return Array.from(
		document
			.querySelector("h2")
			.parentNode.querySelectorAll(".unit-content")
	).map(e => {
		const name = (e.querySelector(".sale-title") || {}).innerText,
			salePrice = (e.querySelector(".sale-price") || {}).innerText,
			origPrice = (e.querySelector(".origin-price") || {}).innerText,
			sold = (e.querySelector(".pg-wrap") || {}).innerText,
			link = e.closest("a").href;
		return { name, salePrice, origPrice, sold, link };
	});
}

async function saveProducts(products) {
	const chunkedProducts = chunk(products, 25);

	for (let x = 0; x < chunkedProducts.length; x++) {
		await postGraphQl(chunkedProducts[x]);
	}
}

async function postGraphQl(products) {
	const productsWithScrapedAt = products.map(p => ({
		...p,
		scrapedAt: `${new Date().getUTCFullYear()}-${new Date().getUTCMonth() +
			1}-${new Date().getUTCDate()}`
	}));
	const query = `mutation {
    insert_lazada_product(
      objects: ${util.inspect(productsWithScrapedAt).replace(/'/g, '"')}
      , on_conflict: {constraint: product_pkey, update_columns: [link, name, origPrice, salePrice, sold, scrapedAt]}) {
      affected_rows
    }
  }`;

	const {
		data: {
			data: { insert_lazada_product: { affected_rows = 0 } = {} } = {},
			errors
		}
	} = await axios.post(
		process.env.GRAPHQL_ENDPOINT,
		{ query },
		{
			headers: {
				[process.env.GRAPHQL_SECRET_HEADER_KEY]:
					process.env.GRAPHQL_SECRET_HEADER_VALUE
			}
		}
	);
	if (errors) throw new Error(util.inspect(errors));
	return affected_rows;
}

async function scrapeProducts(page) {
	await page.goto(process.env.LAZADA_FLASH_SALE_URL, {
		waitUntil: "networkidle2"
	});
	await page.waitForSelector(".loading-image", {
		hidden: true
	});

	const scrapedProducts = await page.evaluate(scrapeFlashSaleProducts);

	return scrapedProducts;
}

module.exports = { scrapeProducts, saveProducts, refineScrapedProducts };
