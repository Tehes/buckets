/* --------------------------------------------------------------------------------------------------
Imports
---------------------------------------------------------------------------------------------------*/
import stats from "../data.json" with { type: "json" };

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
	"reb",
	"ast",
	"stl",
	"blk",
	"eff",
];

const WAIT_TIME = 3000; // time in ms to wait before next action

const main = document.querySelector("main");
const backdrop = document.getElementById("backdrop");
const howtoModal = document.getElementById("howtoModal");
const settingsModal = document.getElementById("settingsModal");

const helpBtn = document.getElementById("helpBtn");
const settingsBtn = document.getElementById("settingsBtn");
const howtoClose = document.getElementById("howtoClose");
const settingsClose = document.getElementById("settingsClose");

/* --------------------------------------------------------------------------------------------------
functions
---------------------------------------------------------------------------------------------------*/
function setCard(side, data) {
	const card = document.querySelector(`.${side}`);
	card.team = card.querySelector("h2");
	card.playerImg = card.querySelector("img");
	card.playerName = card.querySelector("h1");
	card.background = card.querySelector(".img-bg");

	// set background Color
	document.body.style.setProperty(`--bg-${side}`, `var(--${data.team})`);
	// set team logo
	card.background.style.setProperty(
		`--bg-img`,
		`url(../img/${data.team}.svg)`,
	);
	card.background.style.setProperty(`--bg-color`, `var(--${data.team})`);
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
	// Lower‑impact categories count only 1 point
	if (category === "ftp" || category === "gp" || category === "min") {
		points = 1;
	} // High‑variance 3‑point stats are worth 3
	else if (category === "3pm" || category === "3pp") {
		points = 3;
	}

	if (leftValue > rightValue) {
		leftScore.textContent = parseInt(leftScore.textContent) + points;
		document.querySelectorAll("output")[0].classList.add("animate");
		values[0].classList.add("higher");
		values[1].classList.add("lower");
	} else if (rightValue > leftValue) {
		rightScore.textContent = parseInt(rightScore.textContent) + points;
		document.querySelectorAll("output")[1].classList.add("animate");
		values[1].classList.add("higher");
		values[0].classList.add("lower");
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
	clock.textContent = parseInt(clock.textContent) - 1;

	// if quarter is over
	if (clock.textContent === "0" && i < 3) {
		clock.textContent = "12";
		i++;
		quarter.textContent = q[i];
	}
	// If game is over
	if (clock.textContent === "0" && i === 3) {
		const scores = document.querySelectorAll("output span");
		const leftScore = parseInt(scores[1].textContent);
		const rightScore = parseInt(scores[3].textContent);
		if (rightScore > leftScore) {
			// Track win
			globalThis.umami?.track("Buckets", { result: "Win" });
			alert("You win!");
		} else if (rightScore < leftScore) {
			// Track loss
			globalThis.umami?.track("Buckets", { result: "Lose" });
			alert("You lose!");
		} else {
			// Optional: track draw to avoid a dead end
			globalThis.umami?.track("Buckets", { result: "Draw" });
			alert("It's a draw!");
		}
	} else {
		playCards();
		document.addEventListener("click", compareValues, false);
	}
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
	backdrop.classList.remove("hidden");
}
function closeAll() {
	howtoModal.classList.add("hidden");
	settingsModal.classList.add("hidden");
	backdrop.classList.add("hidden");
}

function init() {
	document.addEventListener("touchstart", function () {}, false);
	main.addEventListener("click", compareValues, false);
	document.addEventListener("animationend", updateScore, false);

	helpBtn.addEventListener("click", () => open(howtoModal));
	settingsBtn.addEventListener("click", () => open(settingsModal));
	backdrop.addEventListener("click", closeAll);
	howtoClose.addEventListener("click", closeAll);
	settingsClose.addEventListener("click", closeAll);
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") closeAll();
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
