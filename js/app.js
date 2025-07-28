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
const average = {};
categories.forEach(function (category) {
	average[category] = averageValue(category);
});
let active;

/* --------------------------------------------------------------------------------------------------
functions
---------------------------------------------------------------------------------------------------*/
function averageValue(x) {
	let value = 0;
	for (const player of stats) {
		value += parseFloat(player[x]);
	}
	const average = value.toFixed() / stats.length;
	return average;
}

function findbestValue() {
	const valuesEl = document.querySelectorAll(".right li:nth-of-type(even)");
	const values = [...valuesEl]; // convert nodelist to array

	values.sort(function (a, b) {
		const categoryA = Object.keys(a.dataset)[0];
		const categoryB = Object.keys(b.dataset)[0];

		const currentA = parseFloat(Object.values(a.dataset)[0]);
		const currentB = parseFloat(Object.values(b.dataset)[0]);

		const percentageA = (currentA / average[categoryA]) * 100;
		const percentageB = (currentB / average[categoryB]) * 100;

		return percentageB - percentageA;
	});
	//create a random number between 1 and 3 to vary to difficulty
	const randInt = Math.floor(Math.random() * (3 - 1 + 1)) + 1;
	return Object.keys(values[randInt].dataset)[0];
}

function setCard(side, data) {
	const card = document.querySelector(`.${side}`);
	card.team = card.querySelector("h2");
	card.playerImg = card.querySelector("img");
	card.playerName = card.querySelector("h1");

	// set background Color
	document.body.style.setProperty(`--bg-${side}`, `var(--${data.team})`);
	// set team logo
	document.body.style.setProperty(
		`--bg-img-${side}`,
		`url(../img/${data.team}.svg)`,
	);
	// set player name
	card.playerName.textContent = data.player;
	//set player picture
	card.playerImg.src = data.pic;
	//set team short name
	card.team.textContent = data.team;
	// set values
	if (side === "left") {
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

	// if user clicked on card
	if (ev) {
		if (Object.keys(ev.target.dataset).length > 0) {
			document.removeEventListener("click", compareValues, false);
			category = Object.keys(ev.target.dataset)[0];
			active = "user";
		} else {
			return;
		}
	} // else CPU plays
	else {
		category = findbestValue();
		active = "cpu";
	}

	const values = document.querySelectorAll(`[data-${category}]`);
	values[1].textContent = values[1].dataset[category];
	const leftValue = parseFloat(values[0].textContent);
	const rightValue = parseFloat(values[1].textContent);

	const scores = document.querySelectorAll("output span");
	const leftScore = scores[1];
	const rightScore = scores[3];

	if (leftValue > rightValue) {
		leftScore.textContent = parseInt(leftScore.textContent) + 2;
		document.querySelectorAll("output")[0].classList.add("animate");
		values[0].classList.add("higher");
		values[1].classList.add("lower");
	} else if (rightValue > leftValue) {
		rightScore.textContent = parseInt(rightScore.textContent) + 2;
		document.querySelectorAll("output")[1].classList.add("animate");
		values[1].classList.add("higher");
		values[0].classList.add("lower");
	}

	setTimeout(resetCategory.bind(null, values), 2000);
}

function resetCategory(values) {
	values[1].textContent = "---";
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
		if (leftScore > rightScore) {
			alert("You win!");
		} else if (rightScore > leftScore) {
			alert("You lose!");
		}
	} // game continues
	else {
		playCards();
		const cards = document.querySelectorAll("section");
		const players = document.querySelectorAll(".players");
		cards[0].classList.toggle("active");
		cards[1].classList.toggle("active");
		players[0].classList.toggle("active");
		players[1].classList.toggle("active");

		if (active === "user") {
			setTimeout(compareValues, 1500);
		} else if (active === "cpu") {
			document.addEventListener("click", compareValues, false);
		}
	}
}

function playCards() {
	setCard("left", stats.shift());
	setCard("right", stats.shift());
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

	// Fisher–Yates shuffle (in‑place)
	for (let i = stats.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[stats[i], stats[j]] = [stats[j], stats[i]];
	}
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
const useServiceWorker = true; // Set to "true" if you want to register the Service Worker, "false" to unregister
const serviceWorkerVersion = "2025-07-29-v1"; // Increment this version to force browsers to fetch a new service-worker.js

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
