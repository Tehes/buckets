/* --------------------------------------------------------------------------------------------------
Imports
---------------------------------------------------------------------------------------------------*/
import nbaStats from "../data-nba.json" with { type: "json" };
import wnbaStats from "../data-wnba.json" with { type: "json" };
import Chart from "https://esm.sh/chart.js/auto";

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
let tickSize = 1; // minutes to decrement per matchup (1 = default)
let showAllCpuOnCompare = false; // when true, reveal all CPU stats during compare
const scoreTimeline = {
	home: [0],
	cpu: [0],
};
let scoreChartInstance = null;

/* --------------------------------------------------------------------------------------------------
Settings: Save/Load helpers
---------------------------------------------------------------------------------------------------*/
function saveSettings() {
	const settings = { league, tickSize, showAllCpuOnCompare };
	localStorage.setItem("bucketsSettings", JSON.stringify(settings));
}
function loadSettings() {
	const raw = localStorage.getItem("bucketsSettings");
	if (!raw) return;
	try {
		const s = JSON.parse(raw);
		if (s.league) league = s.league;
		if (s.tickSize) tickSize = s.tickSize;
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
const chartModal = document.getElementById("chartModal");
const chartClose = document.getElementById("chartClose");
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
	card.logo = card.querySelector(".team-logo");
	card.playerImg = card.querySelector(".player-photo");
	card.playerName = card.querySelector("h1");

	// set Theme Color
	setTheme(side, `${league}-${data.team}`);

	// set team logo
	card.logo.src = `img/${league}/${data.team}.svg`;
	card.logo.alt = data.team;
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
		if (!showAllCpuOnCompare) openCallout(getPhrase(category), "left");
	} else if (rightValue > leftValue) {
		rightScore.textContent = parseInt(rightScore.textContent) + points;
		document.querySelectorAll("output")[1].classList.add("animate");
		values[1].classList.add("higher");
		values[0].classList.add("lower");
		if (!showAllCpuOnCompare) openCallout(getPhrase(category), "right");
	} else {
		values[0].classList.add("tie");
		values[1].classList.add("tie");
	}

	// Record running totals for line chart
	const cpuTotal = parseInt(leftScore.textContent);
	const homeTotal = parseInt(rightScore.textContent);
	scoreTimeline.home.push(homeTotal);
	scoreTimeline.cpu.push(cpuTotal);

	if (showAllCpuOnCompare) {
		openCallout("Click to continue", "both");
		main.addEventListener("click", () => resetCategory(values), { once: true });
	} else {
		setTimeout(resetCategory.bind(null, values), WAIT_TIME);
	}
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
	const next = current - tickSize;

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

			// Render chart and open modal at game end
			if (typeof Chart === "function") {
				setTimeout(() => {
					open(chartModal);
					renderScoreChart();
				}, WAIT_TIME);
			}

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
}
function close(modal) {
	modal.classList.add("hidden");
}

function renderScoreChart() {
	const ctx = document.getElementById("scoreChart");
	if (scoreChartInstance) scoreChartInstance.destroy();
	scoreChartInstance = new Chart(ctx, {
		type: "line",
		data: {
			labels: scoreTimeline.home.map((_, i) => i * tickSize),
			datasets: [
				{
					label: "CPU",
					data: scoreTimeline.cpu,
					borderColor: "rgba(255, 0, 55, 1)",
					borderWidth: 2,
					pointRadius: 0,
					tension: 0.3,
				},
				{
					label: "YOU",
					data: scoreTimeline.home,
					borderColor: "rgba(0, 153, 255, 1)",
					borderWidth: 2,
					pointRadius: 0,
					tension: 0.3,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				y: {
					grid: { color: "rgba(204, 204, 204, 0.2)" },
					ticks: { color: "rgba(204, 204, 204, 1)" },
					beginAtZero: true,
					title: {
						display: true,
						text: "Points",
						color: "rgba(204, 204, 204, 1)",
					},
				},
				x: {
					grid: { color: "rgba(204, 204, 204, 0.2)" },
					ticks: { color: "rgba(204, 204, 204, 1)" },
					title: {
						display: true,
						text: "Time",
						color: "rgba(204, 204, 204, 1)",
					},
				},
			},
			plugins: {
				legend: {
					labels: {
						color: "rgba(204, 204, 204, 1)",
					},
					position: "bottom",
				},
			},
		},
	});
}

/**
 * Quickly fill test data and show the chart.
 * Example: app.testChart()
 */
function testChart() {
	// Generate test data for full game length and current tickSize
	const totalMinutes = getQuarterLength() * 4; // 48 (NBA) or 40 (WNBA)
	const steps = Math.floor(totalMinutes / tickSize);

	const h = [0];
	const c = [0];
	let home = 0;
	let cpu = 0;

	for (let i = 0; i < steps; i++) {
		// simple scoring model per tick (0–3 pts each), with gentle lead swings
		const swing = Math.sin(i / 6); // oscillates the "momentum"
		const baseH = Math.random() < 0.65 ? 1 : 0; // ~0.65 prob to score this tick
		const baseC = Math.random() < 0.65 ? 1 : 0;
		const bonusH = swing > 0 && Math.random() < 0.35 ? 1 : 0;
		const bonusC = swing < 0 && Math.random() < 0.35 ? 1 : 0;
		const extraH = Math.random() < 0.10 ? 1 : 0; // occasional extra bucket
		const extraC = Math.random() < 0.10 ? 1 : 0;

		home += baseH + bonusH + extraH; // 0–3
		cpu += baseC + bonusC + extraC; // 0–3

		h.push(home);
		c.push(cpu);
	}

	scoreTimeline.home = h;
	scoreTimeline.cpu = c;

	// Modal öffnen und Diagramm rendern
	if (typeof Chart !== "function") {
		console.warn("Chart.js is not available.");
		return;
	}
	open(chartModal);
	renderScoreChart();
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
	chartClose.addEventListener("click", () => close(chartModal));

	settingsForm.addEventListener("change", (e) => {
		const t = e.target;
		if (t && t.name === "tickSize") {
			const val = parseInt(t.value, 10);
			if (val === 1 || val === 2 || val === 4) {
				tickSize = val;
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

	const tickInput = settingsForm.querySelector(`input[name="tickSize"][value="${tickSize}"]`);
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
	testChart,
};

app.init();

/* --------------------------------------------------------------------------------------------------
 * Service Worker configuration
 * - USE_SERVICE_WORKER: enable or disable SW for this project
 * - SERVICE_WORKER_VERSION: bump to force new SW and new cache
 * - AUTO_RELOAD_ON_SW_UPDATE: reload page once after an update
 -------------------------------------------------------------------------------------------------- */
const USE_SERVICE_WORKER = true;
const SERVICE_WORKER_VERSION = "2025-12-13-v1";
const AUTO_RELOAD_ON_SW_UPDATE = true;

/* --------------------------------------------------------------------------------------------------
 * Project detection
 * - GitHub Pages: user.github.io/projektname/... -> slug = "projektname", scope = /projektname/
 * - Everything else (localhost, custom domain): whole origin is one project
 -------------------------------------------------------------------------------------------------- */
function getProjectInfo() {
	const url = new URL(globalThis.location.href);
	const pathParts = url.pathname.split("/").filter(Boolean);
	const hostname = url.hostname;

	const isGitHubPages = hostname.endsWith("github.io");

	let projectScope;
	let projectSlug;

	if (isGitHubPages && pathParts.length > 0) {
		// Example: https://user.github.io/project/
		const first = pathParts[0].toLowerCase();
		projectScope = `${url.origin}/${first}/`;
		projectSlug = first;
	} else {
		// Example: http://127.0.0.1:5500/ or https://nba-spielplan.de/
		projectScope = `${url.origin}/`;
		projectSlug = hostname.replace(/[^\w-]/g, "_").toLowerCase();
	}

	const isGitHubUserRoot = isGitHubPages && pathParts.length === 0;

	return { projectScope, projectSlug, isGitHubUserRoot };
}

const {
	projectScope: PROJECT_SCOPE,
	projectSlug: PROJECT_SLUG,
	isGitHubUserRoot,
} = getProjectInfo();

const SW_CACHE_PREFIX = `${PROJECT_SLUG}-cache-`; // SW caches: "<slug>-cache-<version>"

async function shouldSkipServiceWorker(swUrl) {
	try {
		const response = await fetch(swUrl, {
			method: "HEAD",
			cache: "no-store",
		});

		if (response.redirected) {
			console.log(
				`Service Worker skipped: ${swUrl} redirects to ${response.url}. Use the canonical host for PWA features.`,
			);
			return true;
		}

		if (!response.ok) {
			console.log(
				`Service Worker skipped: ${swUrl} returned status ${response.status}.`,
			);
			return true;
		}
	} catch (error) {
		console.log("Service Worker preflight check failed, trying to register anyway:", error);
	}

	return false;
}

/* Service Worker registration and cleanup */
async function registerServiceWorker() {
	try {
		const swUrl = `./service-worker.js?v=${SERVICE_WORKER_VERSION}`;

		if (await shouldSkipServiceWorker(swUrl)) {
			return;
		}

		const registration = await navigator.serviceWorker.register(
			swUrl,
			{ scope: "./", updateViaCache: "none" },
		);

		// check for updates immediately
		registration.update();

		console.log(
			`Service Worker registered for project "${PROJECT_SLUG}" with scope:`,
			registration.scope,
		);
	} catch (error) {
		console.log("Service Worker registration failed:", error);
	}
}

async function unregisterServiceWorkers() {
	const registrations = await navigator.serviceWorker.getRegistrations();
	let changedSomething = false;

	if (registrations.length) {
		// Only unregister SWs whose scope belongs to this project
		const projectRegistrations = registrations.filter(
			(r) => r.scope === PROJECT_SCOPE || r.scope.startsWith(PROJECT_SCOPE),
		);

		if (projectRegistrations.length) {
			await Promise.all(projectRegistrations.map((r) => r.unregister()));
			changedSomething = true;
		}
	}

	if ("caches" in globalThis) {
		const keys = await caches.keys();

		// Remove only Service Worker caches for this project:
		// - SW caches start with "<slug>-cache-"
		// - Data / app caches can use "<slug>-data-cache" and are not touched here
		const swCaches = keys.filter(
			(k) => k.startsWith(SW_CACHE_PREFIX) && !k.includes("-data-cache"),
		);

		if (swCaches.length) {
			await Promise.all(swCaches.map((k) => caches.delete(k)));
			changedSomething = true;
		}
	}

	if (changedSomething) {
		console.log(
			`Service workers and SW caches for project "${PROJECT_SLUG}" cleared. Reloading page...`,
		);
		globalThis.location.reload();
	} else {
		console.log(
			`No service worker or SW caches found for project "${PROJECT_SLUG}". Not reloading again.`,
		);
	}
}

/* Auto reload on SW controller change and init */
if ("serviceWorker" in navigator) {
	const hadControllerAtStart = !!navigator.serviceWorker.controller;
	let hasHandledControllerChange = false;

	navigator.serviceWorker.addEventListener("controllerchange", () => {
		if (!hadControllerAtStart) return;
		if (hasHandledControllerChange) return;
		hasHandledControllerChange = true;

		if (AUTO_RELOAD_ON_SW_UPDATE) {
			globalThis.location.reload();
		} else {
			console.log("Service Worker updated; auto reload disabled.");
		}
	});

	globalThis.addEventListener("DOMContentLoaded", async () => {
		// hard safety: never use a service worker on GitHub user root pages
		if (isGitHubUserRoot) {
			console.log(
				"Service Worker disabled on GitHub user root page to avoid affecting project sites.",
			);
			return;
		}

		if (USE_SERVICE_WORKER) {
			await registerServiceWorker();
		} else {
			await unregisterServiceWorkers();
		}
	});
}
