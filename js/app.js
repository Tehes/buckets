/* --------------------------------------------------------------------------------------------------
Imports
---------------------------------------------------------------------------------------------------*/
import nbaStats from "../data-nba.json" with { type: "json" };
import wnbaStats from "../data-wnba.json" with { type: "json" };

/* --------------------------------------------------------------------------------------------------
Variables
---------------------------------------------------------------------------------------------------*/
const decks = {
	nba: structuredClone(nbaStats),
	wnba: structuredClone(wnbaStats),
};

let league = "nba";
let deck = decks[league];

const categories = [
	"gp",
	"min",
	"pts",
	"fgp",
	"3pm",
	"3pp",
	"ftp",
	"ftm",
	"reb",
	"ast",
	"stl",
	"blk",
];

let firstDeal = false;
const WAIT_TIME = 3000; // time in ms to wait before next action
let TICK_SIZE = 1; // minutes to decrement per matchup (1 = default)
let showAllCpuOnCompare = false; // when true, reveal all CPU stats during compare
/* --------------------------------------------------------------------------------------------------
Settings: Save/Load helpers
---------------------------------------------------------------------------------------------------*/
function saveSettings() {
	const settings = { league, TICK_SIZE, showAllCpuOnCompare };
	localStorage.setItem("bucketsSettings", JSON.stringify(settings));
}
function loadSettings() {
	const raw = localStorage.getItem("bucketsSettings");
	if (!raw) return;
	try {
		const s = JSON.parse(raw);
		if (s.league) league = s.league;
		if (s.TICK_SIZE) TICK_SIZE = s.TICK_SIZE;
		if (typeof s.showAllCpuOnCompare === "boolean") showAllCpuOnCompare = s.showAllCpuOnCompare;
		deck = decks[league];
	} catch (e) {
		console.warn("Failed to load settings", e);
	}
}

function getQuarterLength() {
	return league === "wnba" ? 10 : 12;
}

const main = document.querySelector("main");
const howtoModal = document.getElementById("howtoModal");
const settingsModal = document.getElementById("settingsModal");
const settingsForm = document.getElementById("settingsForm");
const helpBtn = document.getElementById("helpBtn");
const settingsBtn = document.getElementById("settingsBtn");
const howtoClose = document.getElementById("howtoClose");
const settingsClose = document.getElementById("settingsClose");
const calloutLeft = document.querySelector("section.left  .callout");
const calloutRight = document.querySelector("section.right .callout");
const clockEl = document.querySelector(".clock");

/* --------------------------------------------------------------------------------------------------
Phrases for callouts
---------------------------------------------------------------------------------------------------*/
const PHRASES = {
	pts: ["Buckets!", "Can’t be stopped!", "Scoring clinic!"],
	fgp: ["Ultra efficient!", "Clinical finishing!", "Knocks down shots!"],
	"3pm": ["From downtown!", "Splash!", "From the logo!"],
	"3pp": ["On fire from deep!", "Can’t miss from three!", "Stays hot from range!"],
	ftp: ["Money at the line!", "Automatic at the stripe!", "Pure at the line!"],
	ftm: ["Knocks it down!", "Makes them count!", "Cash from the line!"],
	gp: ["Never misses a game!", "Always available!", "Durability edge!"],
	min: ["Workhorse minutes!", "Big minutes tonight!", "Heavy workload tonight!"],
	reb: ["Owns the glass!", "Clears the boards!", "Owns the paint!"],
	ast: ["Dime time!", "Finds the open teammate!", "Table setter!"],
	stl: ["Picks the pocket!", "Takes it away!", "Turns defense to offense!"],
	blk: ["Stuffed at the rim!", "Sends it back!", "Denied at the summit!"],
};

function showToast(el, message) {
	if (!el) return;
	el.textContent = message;
	el.classList.remove("hidden");
	setTimeout(() => el.classList.add("hidden"), WAIT_TIME);
}

/**
 * Show a phrase inside a specific card area.
 * target: 'left' | 'right' | 'both'
 */
function openCallout(message, target = "right") {
	if (target === "left") return showToast(calloutLeft, message);
	if (target === "right") return showToast(calloutRight, message);
	if (target === "both") {
		showToast(calloutLeft, message);
		showToast(calloutRight, message);
		return;
	}
}

function getPhrase(category) {
	const arr = PHRASES?.[category] || [];
	return arr.length ? arr[Math.floor(Math.random() * arr.length)] : "";
}

/* --------------------------------------------------------------------------------------------------
functions
---------------------------------------------------------------------------------------------------*/
function setTheme(side, teamVar) {
	const teamColor = getComputedStyle(document.documentElement)
		.getPropertyValue(`--${teamVar}`)
		.trim();

	document.documentElement.style.setProperty(`--bg-${side}`, teamColor);

	const meta = document.querySelector('meta[name="theme-color"]');
	if (globalThis.matchMedia("(max-width: 480px)").matches) {
		if (side === "right" && meta) meta.setAttribute("content", teamColor);
	} else {
		// Desktop: always set to bg-left
		if (side === "left" && meta) meta.setAttribute("content", teamColor);
	}
}

function setCard(side, data) {
	const card = document.querySelector(`.${side}`);
	card.team = card.querySelector("h2");
	card.playerImg = card.querySelector("img");
	card.playerName = card.querySelector("h1");
	card.background = card.querySelector(".img-bg");

	// set Theme Color
	setTheme(side, `${league}-${data.team}`);

	// set team logo
	card.background.style.setProperty(`--bg-img`, `url(../img/${league}/${data.team}.svg)`);
	card.background.style.setProperty(`--bg-color`, `var(--${league}-${data.team})`);
	// set player name
	card.playerName.textContent = data.player;
	//set player picture
	card.playerImg.src = data.pic;

	// set values
	if (side === "right") {
		categories.forEach(function (category) {
			card.querySelector(`[data-${category}]`).textContent = data[category];
		});
	}
	categories.forEach(function (category) {
		card.querySelector(`[data-${category}]`).dataset[category] = data[category];
	});
}

function compareValues(ev) {
	let category;
	firstDeal = false;

	if (Object.keys(ev.target.dataset).length > 0) {
		main.removeEventListener("click", compareValues, false);
		category = Object.keys(ev.target.dataset)[0];
	} else {
		return;
	}

	const values = document.querySelectorAll(`[data-${category}]`);
	if (showAllCpuOnCompare) {
		// reveal all CPU (left) values at once
		for (const c of categories) {
			const el = document.querySelector(`section.left [data-${c}]`);
			if (el) el.textContent = el.dataset[c];
		}
	} else {
		// reveal only the chosen category (previous behavior)
		values[0].textContent = values[0].dataset[category];
	}
	const leftValue = parseFloat(values[0].textContent);
	const rightValue = parseFloat(values[1].textContent);

	const scores = document.querySelectorAll("output span");
	const leftScore = scores[1];
	const rightScore = scores[3];

	let points = 2;
	if (category === "ftp" || category === "ftm" || category === "gp" || category === "min") {
		points = 1;
	} else if (category === "3pm" || category === "3pp") {
		points = 3;
	}

	if (leftValue > rightValue) {
		leftScore.textContent = parseInt(leftScore.textContent) + points;
		document.querySelectorAll("output")[0].classList.add("animate");
		values[0].classList.add("higher");
		values[1].classList.add("lower");
		openCallout(getPhrase(category), "left");
	} else if (rightValue > leftValue) {
		rightScore.textContent = parseInt(rightScore.textContent) + points;
		document.querySelectorAll("output")[1].classList.add("animate");
		values[1].classList.add("higher");
		values[0].classList.add("lower");
		openCallout(getPhrase(category), "right");
	} else {
		values[0].classList.add("tie");
		values[1].classList.add("tie");
	}

	setTimeout(resetCategory.bind(null, values), WAIT_TIME);
}

function resetCategory(values) {
	if (showAllCpuOnCompare) {
		for (const c of categories) {
			const el = document.querySelector(`section.left [data-${c}]`);
			if (el) el.textContent = "---";
		}
	} else {
		values[0].textContent = "---";
	}

	values[0].classList.remove("higher", "lower", "tie");
	values[1].classList.remove("higher", "lower", "tie");

	checkClock();
}

function checkClock() {
	const quarter = document.querySelector(".quarter");
	const q = ["1st", "2nd", "3rd", "4th"];
	let i = parseInt(quarter.textContent[0]) - 1;
	const current = parseInt(clockEl.textContent);
	const next = current - TICK_SIZE;

	// 1) Update UI first
	if (next > 0) {
		clockEl.textContent = String(next);
	} else {
		// next <= 0
		if (i === 3) {
			// Q4 end: clamp to 0 and finish
			clockEl.textContent = "0";

			const scores = document.querySelectorAll("output span");
			const leftScore = parseInt(scores[1].textContent);
			const rightScore = parseInt(scores[3].textContent);

			let result;
			if (rightScore > leftScore) {
				result = "Win";
				openCallout("YOU WIN!", "right");
				openCallout("CPU LOSES", "left");
			} else if (rightScore < leftScore) {
				result = "Lose";
				openCallout("CPU WINS!", "left");
				openCallout("YOU LOSE", "right");
			} else {
				result = "Draw";
				openCallout("DRAW!", "left");
				openCallout("DRAW!", "right");
			}

			const lead = rightScore - leftScore;
			globalThis.umami?.track("Buckets", { result: result, lead: lead, league: league });

			// prevent further interactions after game end
			main.removeEventListener("click", compareValues, false);
			return; // stop here when game ends
		}

		// Not Q4: advance to next quarter and reset the clock to 12
		i = Math.min(i + 1, 3);
		quarter.textContent = q[i];
		clockEl.textContent = String(getQuarterLength());
	}

	// 2) Continue the game
	playCards();
	main.addEventListener("click", compareValues, false);
}

function playerWinsCnt(playerCard, cpuCard) {
	let cnt = 0;
	for (const c of categories) {
		if (+playerCard[c] > +cpuCard[c]) cnt++;
	}
	return cnt;
}

function maxAllowedWins(lead) {
	// Difficulty parameters:
	//   BASE  – base number of allowed player winning categories when scores are tied
	//   MULT  – for every 4 points lead, 1 category is subtracted
	const BASE = 2; // Player may win up to 2 categories when tied
	const MULT = 0.25; // 1 less category allowed per 4 points lead

	const raw = BASE - Math.floor(lead * MULT);
	return Math.max(0, raw); // never negative
}

function playCards() {
	// Ensure there are enough cards in the current league deck
	if (deck.length < 2) {
		decks[league] = structuredClone(league === "nba" ? nbaStats : wnbaStats);
		deck = decks[league];
	}

	const spans = document.querySelectorAll("output span");
	const cpuScore = parseInt(spans[1].textContent);
	const playerScore = parseInt(spans[3].textContent);
	const lead = playerScore - cpuScore; // positive = player leads
	const allowedWins = maxAllowedWins(lead);

	let attempts = 0;
	let playerIdx = 0;
	let playerCard = null;
	let bestCpuIdx = -1;
	let bestCnt = -1;

	let currentMaxWins = allowedWins;
	const step = lead >= 0 ? 1 : -1;

	let foundExact = false; // true if we find a CPU card with exactly currentMaxWins
	let limitBumps = 0;
	const MAX_BUMPS = 20; // Safety: stop after N adjustments

	// Fallback candidate if no exact match
	let nearest = { diff: Infinity, cpuIdx: -1, cnt: null, playerIdxTmp: -1 };

	while (!foundExact && limitBumps <= MAX_BUMPS) {
		for (let tries = 0; tries < 20 && !foundExact; tries++) {
			attempts++;

			// random player card for this attempt
			playerIdx = Math.floor(Math.random() * deck.length);
			playerCard = deck[playerIdx];

			// possible exact matches for this player card
			const matches = [];

			// scan possible CPU opponents
			for (let i = 0; i < deck.length; i++) {
				if (i === playerIdx) continue;
				const cnt = playerWinsCnt(playerCard, deck[i]);

				// track the best "nearest" candidate
				const diff = Math.abs(cnt - currentMaxWins);
				if (
					diff < nearest.diff ||
					(diff === nearest.diff &&
						((lead >= 0 && cnt > (nearest.cnt ?? -Infinity)) ||
							(lead < 0 && cnt < (nearest.cnt ?? Infinity))))
				) {
					nearest = { diff, cpuIdx: i, cnt, playerIdxTmp: playerIdx };
				}

				// collect exact matches
				if (cnt === currentMaxWins) {
					matches.push(i);
				}
			}

			// pick an exact match at random
			if (!foundExact && matches.length > 0) {
				const pick = Math.floor(Math.random() * matches.length);
				bestCpuIdx = matches[pick];
				bestCnt = currentMaxWins;
				foundExact = true;
				nearest.playerIdxTmp = playerIdx;
			}
		}

		// adjust limit if still not found
		if (!foundExact) {
			currentMaxWins = Math.max(0, Math.min(categories.length, currentMaxWins + step));
			limitBumps++;
		}
	}

	// fallback to the nearest candidate
	if (!foundExact && nearest.cpuIdx !== -1) {
		bestCpuIdx = nearest.cpuIdx;
		bestCnt = nearest.cnt;
		playerIdx = nearest.playerIdxTmp;
	}

	// final guard: ensure we always have a CPU card different from the player card
	if (bestCpuIdx === -1) {
		for (let i = 0; i < deck.length; i++) {
			if (i !== playerIdx) {
				bestCpuIdx = i;
				bestCnt = playerWinsCnt(deck[playerIdx], deck[i]);
				break;
			}
		}
	}

	// remove the chosen cards from the current league deck
	playerCard = deck.splice(playerIdx, 1)[0];
	if (bestCpuIdx > playerIdx) bestCpuIdx--;
	const cpuCard = deck.splice(bestCpuIdx, 1)[0];

	setCard("right", playerCard); // Home / Player
	setCard("left", cpuCard); // Guest / CPU

	/* Debug */
	console.table({
		attempts,
		lead,
		allowedWins,
		limitUsed: currentMaxWins,
		player: playerCard.player,
		cpu: cpuCard.player,
		"player-wins": bestCnt,
	});
}

function updateScore(ev) {
	const numbers = ev.target.querySelectorAll("span");
	numbers[0].textContent = numbers[1].textContent;
	ev.target.classList.remove("animate");
}

function open(modal) {
	modal.classList.remove("hidden");
	modal.setAttribute("aria-hidden", "false");
}
function close(modal) {
	modal.classList.add("hidden");
	modal.setAttribute("aria-hidden", "true");
}

function init() {
	loadSettings();
	document.addEventListener("touchstart", function () {}, false);
	main.addEventListener("click", compareValues, false);
	document.addEventListener("animationend", updateScore, false);

	helpBtn.addEventListener("click", () => open(howtoModal));
	settingsBtn.addEventListener("click", () => open(settingsModal));
	howtoClose.addEventListener("click", () => close(howtoModal));
	settingsClose.addEventListener("click", () => close(settingsModal));

	settingsForm.addEventListener("change", (e) => {
		const t = e.target;
		if (t && t.name === "tickSize") {
			const val = parseInt(t.value, 10);
			if (val === 1 || val === 2 || val === 4) {
				TICK_SIZE = val;
			}
		}
		if (t && t.name === "league") {
			league = t.value;
			deck = decks[league];
			if (firstDeal) {
				clockEl.textContent = String(getQuarterLength());
				playCards();
			}
		}
		if (t && t.name === "revealCpuAll") {
			showAllCpuOnCompare = t.checked;
		}
		saveSettings();
	});

	// sync settings UI with current flags
	const revealCb = document.getElementById("revealCpuAll");
	if (revealCb) revealCb.checked = showAllCpuOnCompare;

	const tickInput = settingsForm.querySelector(`input[name="tickSize"][value="${TICK_SIZE}"]`);
	if (tickInput) tickInput.checked = true;

	const leagueInput = settingsForm.querySelector(`input[name="league"][value="${league}"]`);
	if (leagueInput) leagueInput.checked = true;

	clockEl.textContent = String(getQuarterLength());
	playCards();
	firstDeal = true;
}

/* --------------------------------------------------------------------------------------------------
public members, exposed with return statement
---------------------------------------------------------------------------------------------------*/
globalThis.app = {
	init,
};

app.init();

/* --------------------------------------------------------------------------------------------------
Service Worker configuration. Toggle 'useServiceWorker' to enable or disable the Service Worker.
---------------------------------------------------------------------------------------------------*/
const useServiceWorker = false; // Set to "true" if you want to register the Service Worker, "false" to unregister
const serviceWorkerVersion = "2025-08-03-v1"; // Increment this version to force browsers to fetch a new service-worker.js

async function registerServiceWorker() {
	try {
		// Force bypassing the HTTP cache so even Safari checks for a new
		// service-worker.js on every load.
		const registration = await navigator.serviceWorker.register(
			`./service-worker.js?v=${serviceWorkerVersion}`,
			{
				scope: "./",
				updateViaCache: "none",
			},
		);
		registration.update();
		console.log(
			"Service Worker registered with scope:",
			registration.scope,
		);
	} catch (error) {
		console.log("Service Worker registration failed:", error);
	}
}

async function unregisterServiceWorkers() {
	const registrations = await navigator.serviceWorker.getRegistrations();
	if (registrations.length === 0) return;

	await Promise.all(registrations.map((r) => r.unregister()));
	console.log("All service workers unregistered – reloading page…");
	globalThis.location.reload();
}

if ("serviceWorker" in navigator) {
	globalThis.addEventListener("DOMContentLoaded", async () => {
		if (useServiceWorker) {
			await registerServiceWorker();
		} else {
			await unregisterServiceWorkers();
		}
	});
}
