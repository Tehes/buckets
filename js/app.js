/* --------------------------------------------------------------------------------------------------
Imports
---------------------------------------------------------------------------------------------------*/
import stats from "../data-nba.json" with { type: "json" };

/* --------------------------------------------------------------------------------------------------
Variables
---------------------------------------------------------------------------------------------------*/
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

const league = "nba";
const WAIT_TIME = 3000; // time in ms to wait before next action
let TICK_SIZE = 1; // minutes to decrement per matchup (1 = default)

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
	gp: ["Ironman!", "Shows up nightly!", "Durability edge!"],
	min: ["Workhorse minutes!", "Big minutes tonight!", "Coach trusts him."],
	reb: ["Owns the glass!", "Clears the boards!", "Owns the paint!"],
	ast: ["Dime time!", "Finds the open man!", "Table setter!"],
	stl: ["Picks his pocket!", "Takes it away!", "Turns defense to offense!"],
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
		// Desktop: z. B. immer auf bg-left setzen
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
	const logoUrl = new URL(`img/${league}/${data.team}.svg`, document.baseURI).href;
	card.background.style.setProperty("--bg-img", `url(${logoUrl})`);
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

	if (Object.keys(ev.target.dataset).length > 0) {
		document.removeEventListener("click", compareValues, false);
		category = Object.keys(ev.target.dataset)[0];
	} else {
		return;
	}

	const values = document.querySelectorAll(`[data-${category}]`);
	values[0].textContent = values[0].dataset[category];
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
	values[0].textContent = "---";
	values[0].classList.remove("higher", "lower", "tie");
	values[1].classList.remove("higher", "lower", "tie");

	checkClock();
}

function checkClock() {
	const clock = document.querySelector(".clock");
	const quarter = document.querySelector(".quarter");
	const q = ["1st", "2nd", "3rd", "4th"];
	let i = parseInt(quarter.textContent[0]) - 1;
	const current = parseInt(clock.textContent);
	const next = current - TICK_SIZE;

	// 1) Update UI first
	if (next > 0) {
		clock.textContent = String(next);
	} else {
		// next <= 0
		if (i === 3) {
			// Q4 end: clamp to 0 and finish
			clock.textContent = "0";

			const scores = document.querySelectorAll("output span");
			const leftScore = parseInt(scores[1].textContent);
			const rightScore = parseInt(scores[3].textContent);

			if (rightScore > leftScore) {
				globalThis.umami?.track("Buckets", { result: "Win" });
				openCallout("YOU WIN!", "right");
				openCallout("CPU LOSES", "left");
			} else if (rightScore < leftScore) {
				globalThis.umami?.track("Buckets", { result: "Lose" });
				openCallout("CPU WINS!", "left");
				openCallout("YOU LOSE", "right");
			} else {
				globalThis.umami?.track("Buckets", { result: "Draw" });
				openCallout("DRAW!", "left");
				openCallout("DRAW!", "right");
			}

			// prevent further interactions after game end
			main.removeEventListener("click", compareValues, false);
			return; // stop here when game ends
		}

		// Not Q4: advance to next quarter and reset the clock to 12
		i = Math.min(i + 1, 3);
		quarter.textContent = q[i];
		clock.textContent = "12";
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

	let foundExact = false; // true if we found a CPU card with exactly currentMaxWins
	let limitBumps = 0;
	const MAX_BUMPS = 20; // safety: stop after N limit adjustments

	// track the closest candidate in case no exact match is found
	let nearest = { diff: Infinity, cpuIdx: -1, cnt: null, playerIdxTmp: -1 };

	while (!foundExact && limitBumps <= MAX_BUMPS) {
		for (let tries = 0; tries < 20 && !foundExact; tries++) {
			attempts++;

			// draw a random player card for this attempt
			playerIdx = Math.floor(Math.random() * stats.length);
			playerCard = stats[playerIdx];

			// collect all exact matches for this player card
			const matches = [];

			// scan possible CPU opponents
			for (let i = 0; i < stats.length; i++) {
				if (i === playerIdx) continue;
				const cnt = playerWinsCnt(playerCard, stats[i]);

				// keep nearest candidate to the current target
				const diff = Math.abs(cnt - currentMaxWins);
				if (
					diff < nearest.diff ||
					(diff === nearest.diff &&
						// tie-breaker: when leading prefer tougher (higher cnt), when trailing prefer gentler (lower cnt)
						((lead >= 0 && cnt > (nearest.cnt ?? -Infinity)) ||
							(lead < 0 && cnt < (nearest.cnt ?? Infinity))))
				) {
					nearest = { diff, cpuIdx: i, cnt, playerIdxTmp: playerIdx };
				}

				// collect exact hits; decide after scanning all CPU cards to avoid always picking the earliest index
				if (cnt === currentMaxWins) {
					matches.push(i);
				}
			}
			// if we found any exact matches for this player card, pick one at random
			if (!foundExact && matches.length > 0) {
				const pick = Math.floor(Math.random() * matches.length);
				bestCpuIdx = matches[pick];
				bestCnt = currentMaxWins; // equals cnt for exact matches
				foundExact = true;
				// remember the player card that yielded the exact match
				nearest.playerIdxTmp = playerIdx;
			}
		}

		// adjust limit only if still not found (with clamp 0..categories.length)
		if (!foundExact) {
			currentMaxWins = Math.max(0, Math.min(categories.length, currentMaxWins + step));
			limitBumps++;
		}
	}

	// fallback: use the nearest candidate if no exact match after MAX_BUMPS
	if (!foundExact && nearest.cpuIdx !== -1) {
		bestCpuIdx = nearest.cpuIdx;
		bestCnt = nearest.cnt;
		playerIdx = nearest.playerIdxTmp;
	}

	// final guard: ensure we always have a CPU card different from the player card
	if (bestCpuIdx === -1) {
		for (let i = 0; i < stats.length; i++) {
			if (i !== playerIdx) {
				bestCpuIdx = i;
				bestCnt = playerWinsCnt(stats[playerIdx], stats[i]);
				break;
			}
		}
	}

	playerCard = stats.splice(playerIdx, 1)[0];
	if (bestCpuIdx > playerIdx) bestCpuIdx--;
	const cpuCard = stats.splice(bestCpuIdx, 1)[0];

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
	});

	playCards();
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
