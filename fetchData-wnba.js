// ---------------------------------------------------------------------------
// Scrapes the NBA Regular‑Season EFF‑Per‑Game leaders (first 130 rows)
// with **Puppeteer** (runs headless Chromium in Deno, no node_modules).
// Only includes players with complete stats.
// Adds player image URLs.
//
// Usage:
//   deno run -A fetchdata-wnba.js
//
// This writes players stats into data.json.
// ---------------------------------------------------------------------------

import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const TARGET_URL = "https://stats.wnba.com/players/traditional/?sort=PTS&dir=-1&Season=2024&SeasonType=Regular%20Season";

const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; // macOS path
const executablePath = Deno.env.get("PUPPETEER_EXECUTABLE_PATH") ??
		(await Deno.permissions.query({ name: "env" })).state === "granted"
	? DEFAULT_CHROME
	: undefined;

const TIMEOUT_MS = 30_000;
const MAX_ROWS = 96;
const MIN_MINUTES = 12;
const MIN_GAMES = 25;
const MAX_GAMES = 44;

const browser = await puppeteer.launch({
	headless: true,
	executablePath,
	args: [
		"--no-sandbox",
		"--disable-setuid-sandbox",
		"--disable-dev-shm-usage",
		"--disable-gpu",
	],
});

try {
	const page = await browser.newPage();

	// Pretend to be a real browser to avoid CDN/consent blocking
	await page.setUserAgent(
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
	);
	await page.setExtraHTTPHeaders({
		"Accept-Language": "en-US,en;q=0.9",
		"Referer": "https://www.wnba.com/",
	});

	console.log("⏳  Opening NBA stats page …");
	await page.goto(TARGET_URL, { waitUntil: "networkidle2", timeout: TIMEOUT_MS });

	// Handle OneTrust cookie banner if present
	try {
		await page.waitForSelector("#onetrust-accept-btn-handler", { timeout: 5000 });
		await page.click("#onetrust-accept-btn-handler");
		console.log("✅ Accepted cookie banner");
	} catch (_) {
		// banner not present
	}

	// Wait until the main table element is present
	await page.waitForSelector("table", { timeout: TIMEOUT_MS });
	console.log("✅ Basic table loaded");

	// Wait until at least six <select> elements are present in the DOM
	await page.waitForFunction(
		() => document.querySelectorAll("select").length >= 23,
		{ timeout: TIMEOUT_MS },
	);

	// Change the page‑size dropdown to "All"
	console.log("🔽 Setting page size to 'All'...");

	await page.evaluate(() => {
		// Assumption: there are always exactly 23 <select> elements; the 22nd (index 21) controls page size
		const selects = document.querySelectorAll("select");
		const select = selects[21];
		if (!select) throw new Error("22th <select> (page-size) not found");

		// The option value "-1" corresponds to "All"
		select.value = "string:All";
		["change", "input", "blur"].forEach((type) => select.dispatchEvent(new Event(type, { bubbles: true })));
	});

	// Wait until all data rows have been loaded
	console.log("⏳ Waiting for all data to load...");

	await page.waitForFunction(
		(limit) => {
			const rows = document.querySelectorAll("table tbody tr");
			return rows.length >= limit;
		},
		{ timeout: TIMEOUT_MS },
		MAX_ROWS,
	);

	console.log("✅ All data loaded, collecting entries...");

	// -----------------------------------------------------------------
	// Collect all rows including player IDs
	// -----------------------------------------------------------------
	const leaders = await page.evaluate(() => {
		const table = document.querySelector("table");
		if (!table) throw new Error("table not found");

		// Headers
		const headCells = table.querySelectorAll("thead th");
		const headers = [...headCells].map((th, idx) =>
			th.getAttribute("data-field") ||
			th.getAttribute("field") ||
			th.textContent.trim().replace(/\s+/g, "_") ||
			`col_${idx}`
		);

		// Extract all rows from DOM
		const collected = [];
		const rows = table.querySelectorAll("tbody tr");

		rows.forEach((tr) => {
			const rankCell = tr.querySelector("td");
			if (!rankCell) return;

			const cells = tr.querySelectorAll("td");
			const obj = {};

			// Collect standard cell data
			headers.forEach((key, i) => {
				obj[key] = cells[i] ? cells[i].textContent.trim() : "";
			});

			// Extract player ID from the link
			const playerLink = tr.querySelector("a[href*='/player/']");
			if (playerLink) {
				const href = playerLink.getAttribute("href");
				const idMatch = href.match(/\/player\/(\d+)/);
				if (idMatch) {
					obj.PLAYER_ID = idMatch[1];
				}
			}

			collected.push(obj);
		});

		// Sort by rank (ascending)
		const sortedLeaders = collected.sort((a, b) =>
			Number.parseInt(a["#"] ?? a.rank ?? a.Rank) -
			Number.parseInt(b["#"] ?? b.rank ?? b.Rank)
		);

		console.log(`Total collected: ${sortedLeaders.length} rows`);
		return sortedLeaders;
	});

	// -----------------------------------------------------------------
	// Filter for complete statistics
	// -----------------------------------------------------------------
	console.log(`🔍 Filtering for rotation-level players (≥${MIN_MINUTES} MIN, ≥${MIN_GAMES} GP, ≤${MAX_GAMES} GP) …`);

	const rotationPlayers = leaders.filter((player) => {
		const min = Number(player.MIN);
		const gp = Number(player.GP);
		const meetsMinuteGameThreshold = Number.isFinite(min) &&
			Number.isFinite(gp) &&
			min >= MIN_MINUTES &&
			gp >= MIN_GAMES &&
			gp <= MAX_GAMES;

		return meetsMinuteGameThreshold;
	});

	console.log(`✅ Found ${rotationPlayers.length} rotation level players`);
	const finalPlayers = rotationPlayers.slice(0, MAX_ROWS);

	// -----------------------------------------------------------
	// Mapping & normalization
	// -----------------------------------------------------------
	const map = {
		RANK: "#",
		PLAYER_NAME: "player",
		TEAM_ABBREVIATION: "team",
		GP: "gp",
		MIN: "min",
		PTS: "pts",
		FGM: "fgm",
		FGA: "fga",
		FG_PCT: "fgp",
		FG3M: "3pm",
		FG3A: "3pa",
		FG3_PCT: "3pp",
		FTM: "ftm",
		FTA: "fta",
		FT_PCT: "ftp",
		OREB: "oreb",
		DREB: "dreb",
		REB: "reb",
		AST: "ast",
		STL: "stl",
		BLK: "blk",
		TOV: "tov",
		EFF: "eff",
		PLAYER_ID: "id",
	};

	const data = finalPlayers.map((player) => {
		const obj = {};

		for (const [rawKey, key] of Object.entries(map)) {
			if (player[rawKey] !== undefined && player[rawKey] !== "-" && player[rawKey] !== "") {
				const v = player[rawKey];
				obj[key] = `${v}`;
			}
		}
		obj.pic = `https://ak-static.cms.nba.com/wp-content/uploads/headshots/wnba/latest/1040x760/${obj.id}.png`;

		return obj;
	});

	await Deno.writeTextFile("data-wnba.json", JSON.stringify(data, null, 2));
	console.log(`✅ Saved ${data.length} normalized player records to dataWNBA.json`);
} catch (err) {
	console.error("❌  Scraping failed:", err.message);
	throw err;
} finally {
	await browser.close();
}
