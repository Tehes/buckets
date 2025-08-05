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
	if (category === "ftp") points = 1;
	else if (category === "3pm" || category === "3pp") points = 3;

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
	}

	setTimeout(resetCategory.bind(null, values), WAIT_TIME);
}

function resetCategory(values) {
	values[0].textContent = "---";
	values[0].classList.remove("higher", "lower");
	values[1].classList.remove("higher", "lower");

	checkClock();
}

function checkClock() {
	const clock = document.querySelector(".clock");
	const quarter = document.querySelector(".quarter");
	const q = ["1st", "2nd", "3rd", "4th"];
	let i = parseInt(quarter.textContent[0]) - 1;
	clock.textContent = parseInt(clock.textContent) - 1;

	// if quarter ist over
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
			alert("You win!");
		} else if (rightScore < leftScore) {
			alert("You lose!");
		}
	} // game continues
	else {
		playCards();
		document.addEventListener("click", compareValues, false);
	}
}

/** Zählt die Kategorien, in denen der Spieler besser ist als die CPU */
function playerWinsCnt(playerCard, cpuCard) {
	let cnt = 0;
	for (const c of categories) {
		if (+playerCard[c] > +cpuCard[c]) cnt++;
		if (cnt > 3) break; // mehr brauchen wir nicht
	}
	return cnt;
}

function maxAllowedWins(lead) {
	const MULT = 0.2; // 1 Kategorie je 5 Punkte Differenz
	const raw = 3 - Math.floor(lead * MULT);
	return Math.max(0, Math.min(5, raw));
}

function playCards() {
	/* ---------- dynamische Schwierigkeits‑Schwelle -------------- */
	const spans = document.querySelectorAll("output span");
	const cpuScore = parseInt(spans[1].textContent);
	const playerScore = parseInt(spans[3].textContent);
	const lead = playerScore - cpuScore; // positiv = Spieler führt
	const allowedWins = maxAllowedWins(lead);

	/* ---------- 1. Schleife: Spielerkarte suchen ---------- */
	let attempts = 0;
	let playerIdx = 0;
	let playerCard = null;

	// beste Karte innerhalb des Limits, initial „nicht gefunden“
	let bestCpuIdx = -1;
	let bestCnt = -1;
	// Zwei Fallback‑Varianten:
	//   * fallbackHard … kleinst‑möglicher cnt  → schwerstes Match‑up
	//   * fallbackEasy … größt‑möglicher cnt    → leichtestes Match‑up
	let fallbackHardIdx = 0;
	let fallbackHardCnt = Infinity;
	let fallbackEasyIdx = 0;
	let fallbackEasyCnt = -1;

	while (true) {
		attempts++;

		// Kandidat für den Spieler
		playerIdx = Math.floor(Math.random() * stats.length);
		playerCard = stats[playerIdx];

		// Suche passend harte CPU‑Karte zu diesem Kandidaten
		bestCpuIdx = -1;
		bestCnt = -1;

		for (let i = 0; i < stats.length; i++) {
			if (i === playerIdx) continue; // nicht mit sich selbst vergleichen
			const cnt = playerWinsCnt(playerCard, stats[i]);

			if (cnt <= allowedWins) {
				// innerhalb des Limits ⇒ je GRÖSSER cnt, desto schwerer für den Spieler
				if (cnt > bestCnt) {
					bestCnt = cnt;
					bestCpuIdx = i;

					// Wenn wir exakt am Limit sind, geht es nicht schwerer ‑ abbrechen
					if (bestCnt === allowedWins) break;
				}
			} else {
				// außerhalb des Limits ⇒ sowohl hartes als auch leichtes Fallback merken
				if (cnt < fallbackHardCnt) {
					fallbackHardCnt = cnt;
					fallbackHardIdx = i;
				}
				if (cnt > fallbackEasyCnt) {
					fallbackEasyCnt = cnt;
					fallbackEasyIdx = i;
				}
			}
		}

		// Gab es *gar* keine Karte, die in den erlaubten Rahmen passt?
		if (bestCpuIdx === -1) {
			if (lead >= 0) { // Spieler führt → härtestes Fallback
				bestCpuIdx = fallbackHardIdx;
				bestCnt = fallbackHardCnt;
			} else { // Spieler liegt hinten → leichtestes Fallback
				bestCpuIdx = fallbackEasyIdx;
				bestCnt = fallbackEasyCnt;
			}
		}

		/* Wenn wir eine Karte ≤allowedWins gefunden haben, oder nach 20 Versuchen
		   immer noch nicht – dann akzeptieren wir den aktuellen Kandidaten. */
		if (bestCnt <= allowedWins || attempts >= 20) break;
	}

	/* ---------- 2. Karten endgültig aus dem Deck entfernen ---------- */
	playerCard = stats.splice(playerIdx, 1)[0];
	// CPU‑Index korrigieren, falls er hinter der entfernten Spielerkarte lag
	if (bestCpuIdx > playerIdx) bestCpuIdx--;
	const cpuCard = stats.splice(bestCpuIdx, 1)[0];

	/* ---------- 3. Karten aufs Spielfeld legen ---------------------- */
	setCard("right", playerCard); // Home / Spieler
	setCard("left", cpuCard); // Guest / CPU

	/* ---------- 4. Debug‑Ausgabe ------------------------------------ */
	console.log("--- New Draw ---");
	console.table({
		attempts,
		lead,
		allowedWins,
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

function init() {
	document.addEventListener("touchstart", function () {}, false);
	document.addEventListener("click", compareValues, false);
	document.addEventListener("animationend", updateScore, false);

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
				// updateViaCache is ignored by Safari but helps other browsers
				updateViaCache: "none",
			},
		);
		// Immediately ping for an update to catch fresh versions that may
		// have been cached by the browser.
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
	// Hard reload to ensure starting without cache
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
