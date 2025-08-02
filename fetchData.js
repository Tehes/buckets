// ---------------------------------------------------------------------------
// Scrapes the NBA All‑Time Regular‑Season PTS‑Per‑Game leaders (first 200 rows)
// with **Puppeteer** (runs headless Chromium in Deno, no node_modules).
// Only includes players with complete stats (no "-" values).
// Adds player image URLs.
//
// Usage:
//   deno run -A fetchAlltime.js
//
// This writes players with complete stats into alltime.json.
// ---------------------------------------------------------------------------

import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const TARGET_URL = "https://www.nba.com/stats/leaders?SeasonType=Regular+Season&StatCategory=EFF";

const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; // macOS path
const executablePath = Deno.env.get("PUPPETEER_EXECUTABLE_PATH") ??
		(await Deno.permissions.query({ name: "env" })).state === "granted"
	? DEFAULT_CHROME
	: undefined;

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
	await page.setUserAgent(
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
	);

	console.log("⏳  Opening NBA stats page …");
	await page.goto(TARGET_URL, { waitUntil: "networkidle2", timeout: 60000 });

	// Warten bis die Tabelle grundsätzlich da ist
	await page.waitForSelector("table.Crom_table__p1iZz tbody tr", { timeout: 60000 });
	console.log("✅ Basic table loaded");

	await page.waitForTimeout(2000);

	// Page Size Dropdown auf "All" setzen
	console.log("🔽 Setting page size to 'All'...");

	await page.evaluate(() => {
		const select = document.querySelectorAll(".DropDown_select__4pIg9")[5];
		select.value = "-1";

		// Event triggern
		["change", "input", "blur"].forEach((eventType) => {
			const event = new Event(eventType, { bubbles: true });
			select.dispatchEvent(event);
		});
	});

	await page.waitForTimeout(3000);

	// Warten bis alle Daten geladen sind
	console.log("⏳ Waiting for all data to load...");

	await page.waitForFunction(() => {
		const rows = document.querySelectorAll("table.Crom_table__p1iZz tbody tr");
		return rows.length >= 130;
	}, { timeout: 30000 });

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

			// Standard Daten sammeln
			headers.forEach((key, i) => {
				obj[key] = cells[i] ? cells[i].textContent.trim() : "";
			});

			// Spieler-ID aus dem Link extrahieren
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

		// Sortieren nach Rang
		const sortedLeaders = collected.sort((a, b) =>
			Number.parseInt(a["#"] ?? a.rank ?? a.Rank) -
			Number.parseInt(b["#"] ?? b.rank ?? b.Rank)
		);

		console.log(`Total collected: ${sortedLeaders.length} rows`);
		return sortedLeaders;
	});

	// -----------------------------------------------------------------
	// Filter für vollständige Statistiken
	// -----------------------------------------------------------------
	console.log("🔍 Filtering for >17 mins & >60 games stats...");

	const completeStatsPlayers = leaders.filter((player) => {
		// Spieler muss alle Stats haben (keine "-" oder leere Werte)
		const hasCompleteStats = Object.entries(player).every(([_key, value]) =>
			value !== "-" && value !== "" && value !== null && value !== undefined
		);

		// Zusätzlicher Filter: mind. 18 MIN und 61 GP
		const min = Number(player.MIN);
		const gp = Number(player.GP);
		const meetsMinuteGameThreshold = Number.isFinite(min) && Number.isFinite(gp) && min >= 18 && gp >= 61;

		return hasCompleteStats && meetsMinuteGameThreshold;
	});

	console.log(`✅ Found ${completeStatsPlayers.length} players with complete stats`);

	// Nimm die ersten 130 Spieler mit vollständigen Stats
	const finalPlayers = completeStatsPlayers.slice(0, 130);

	// -----------------------------------------------------------
	// Mapping & Normalisierung analog zu fetchAPI.js
	// -----------------------------------------------------------
	const map = {
		RANK: "#",
		PLAYER_NAME: "player",
		TEAM: "team",
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
		obj.pic = `https://cdn.nba.com/headshots/nba/latest/1040x760/${obj.id}.png`;

		return obj;
	});

	await Deno.writeTextFile("data.json", JSON.stringify(data, null, 2));
	console.log(`✅ Saved ${data.length} normalized player records to data.json`);
} catch (err) {
	console.error("❌  Scraping failed:", err.message);
	throw err;
} finally {
	await browser.close();
}
