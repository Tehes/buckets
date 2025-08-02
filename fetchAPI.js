// fetchAPI.js
// Holt NBA‑League‑Leader‑Daten direkt über die offizielle JSON‑API
// und speichert das Ergebnis im gewünschten Format in data.json.

console.log("Fetching NBA league leaders via API …");

const params = new URLSearchParams({
	LeagueID: "00",
	Season: "2024-25",
	SeasonType: "Regular Season",
	StatCategory: "EFF",
	PerMode: "PerGame",
});

const url = `https://stats.nba.com/stats/leagueleaders?${params}`;

try {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);

	// Die API liefert je nach Version resultSet oder resultSets[0]
	const json = await res.json();
	const result = json.resultSet ?? (json.resultSets ? json.resultSets[0] : undefined);
	if (!result) {
		throw new Error("Unexpected API response shape");
	}

	const rawHeaders = result.headers;
	// ── Filter: mind. 18 Minuten & 61 Spiele ──
	const idxMIN = rawHeaders.indexOf("MIN");
	const idxGP = rawHeaders.indexOf("GP");

	const MAX_RECORDS = 130;
	const rows = result.rowSet
		.filter((row) => row[idxMIN] > 17 && row[idxGP] >= 60)
		.slice(0, MAX_RECORDS);

	// Mapping von API‑Headern zu gewünschten Keys
	const map = {
		RANK: "#",
		PLAYER: "player",
		TEAM_ABBREVIATION: "team",
		TEAM: "team",
		TEAM_ID: "teamId",
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

	const data = rows.map((row) => {
		const obj = {};

		row.forEach((value, idx) => {
			const rawKey = rawHeaders[idx];
			const key = map[rawKey];
			if (key) {
				let v = value;
				// Prozentwerte (0.576 → 57.6) auf eine Nachkommastelle skalieren
				if (["FG_PCT", "FG3_PCT", "FT_PCT"].includes(rawKey)) {
					v = (v * 100).toFixed(1);
				}
				// Als String speichern, wie gewünscht
				obj[key] = `${v}`;
			}
		});

		// Headshot‑URL ergänzen
		if (obj.id) {
			obj.pic = `https://cdn.nba.com/headshots/nba/latest/1040x760/${obj.id}.png`;
		}

		return obj;
	});

	await Deno.writeTextFile("data.json", JSON.stringify(data, null, 2));
	console.log(`Saved ${data.length} records to data.json`);
} catch (err) {
	console.error("fetchdeno.js error:", err);
}
