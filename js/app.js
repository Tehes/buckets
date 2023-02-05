/* --------------------------------------------------------------------------------------------------
Imports
---------------------------------------------------------------------------------------------------*/
async function fetchStats() {
    const response = await fetch('data.json');
    const json = await response.json();
    return json;
}

/* --------------------------------------------------------------------------------------------------
Variables
---------------------------------------------------------------------------------------------------*/
const stats = await fetchStats();
const average = {
    gp: averageValue("gp"),
    min: averageValue("min"),
    pts: averageValue("pts"),
    fgp: averageValue("fg%"),
    "3pm": averageValue("3pm"),
    "3pp": averageValue("3p%"),
    ftp: averageValue("ft%"),
    reb: averageValue("reb"),
    ast: averageValue("ast"),
    stl: averageValue("stl"),
    blk: averageValue("blk"),
    eff: averageValue("eff")
};
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
    let values = [...valuesEl]; // convert nodelist to array
    
    values.sort(function(a, b) { 
        const categoryA = Object.keys(a.dataset)[0];
        const categoryB = Object.keys(b.dataset)[0];

        const currentA = parseFloat(Object.values(a.dataset)[0]);
        const currentB = parseFloat(Object.values(b.dataset)[0]);

        const percentageA = ((currentA / average[categoryA]) * 100); 
        const percentageB = ((currentB / average[categoryB]) * 100);   

        return percentageB - percentageA;
    });
	return Object.keys(values[0].dataset)[0];
}

String.prototype.shuffle = function () {
    var chars = this.split("");
    var charsAmount = chars.length;

    for (var i = charsAmount - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = chars[i];
        chars[i] = chars[j];
        chars[j] = tmp;
    }
    return chars.join("");
};

function setCard(side, data) {
    const card = document.querySelector(`.${side}`);
    card.team = card.querySelector("h2");
    card.playerImg = card.querySelector("img");
    card.playerName = card.querySelector("h1");

    // set background Color
    document.body.style.setProperty(`--bg-${side}`, `var(--${data.team})`);
    // set team logo
    document.body.style.setProperty(`--bg-img-${side}`, `url(../img/${data.team}.svg)`);
    // set player name
    card.playerName.textContent = data.player;
    //set player picture
    card.playerImg.src = data.pic;
    //set team short name
    card.team.textContent = data.team;
    // set values 
    if (side === "left") {
        card.querySelector("[data-gp]").textContent = data["gp"];
        card.querySelector("[data-min]").textContent = data["min"];
        card.querySelector("[data-pts]").textContent = data["pts"];
        card.querySelector("[data-fgp]").textContent = data["fg%"];
        card.querySelector("[data-3pm]").textContent = data["3pm"];
        card.querySelector("[data-3pp]").textContent = data["3p%"];
        card.querySelector("[data-ftp]").textContent = data["ft%"];
        card.querySelector("[data-reb]").textContent = data["reb"];
        card.querySelector("[data-ast]").textContent = data["ast"];
        card.querySelector("[data-stl]").textContent = data["stl"];
        card.querySelector("[data-blk]").textContent = data["blk"];
        card.querySelector("[data-eff]").textContent = data["eff"];
    }
    card.querySelector("[data-gp]").dataset["gp"] = data["gp"];
    card.querySelector("[data-min]").dataset["min"] = data["min"];
    card.querySelector("[data-pts]").dataset["pts"] = data["pts"];
    card.querySelector("[data-fgp]").dataset["fgp"] = data["fg%"];
    card.querySelector("[data-3pm]").dataset["3pm"] = data["3pm"];
    card.querySelector("[data-3pp]").dataset["3pp"] = data["3p%"];
    card.querySelector("[data-ftp]").dataset["ftp"] = data["ft%"];
    card.querySelector("[data-reb]").dataset["reb"] = data["reb"];
    card.querySelector("[data-ast]").dataset["ast"] = data["ast"];
    card.querySelector("[data-stl]").dataset["stl"] = data["stl"];
    card.querySelector("[data-blk]").dataset["blk"] = data["blk"];
    card.querySelector("[data-eff]").dataset["eff"] = data["eff"];
}

function compareValues(ev) {
	let category;
	
	// if user clicked on card
	if (ev) {
		if (Object.keys(ev.target.dataset).length > 0) {
			document.removeEventListener("click", compareValues, false);
			category = Object.keys(ev.target.dataset)[0];
			active = "user";
		}
		else {
			return;
		}
	}
	else {
		category = findbestValue();
		active = "cpu";
	}
	
    const values = document.querySelectorAll(`[data-${category}]`);
    values[1].textContent = values[1].dataset[category];
    const leftValue = parseFloat(values[0].textContent);
    const rightValue = parseFloat(values[1].textContent);

    const scores = document.querySelectorAll("output");
    const leftScore = scores[0];
    const rightScore = scores[1];

        if (leftValue > rightValue) {
            leftScore.textContent = parseInt(leftScore.textContent) + 2;
            values[0].classList.add("higher");
            values[1].classList.add("lower");
        }
        else if (rightValue > leftValue) {
            rightScore.textContent = parseInt(rightScore.textContent) + 2;
            values[1].classList.add("higher");
            values[0].classList.add("lower");
        }
        setTimeout(resetCategory.bind(null, values), 3000);
}

function resetCategory(values) {
    values[1].textContent = "---";
    values[0].classList.remove("higher");
    values[1].classList.remove("higher");
    values[0].classList.remove("lower");
    values[1].classList.remove("lower");
	
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
        console.log("game over");
    }
    // game continues
    else {
		playCards();
		if (active === "user") {
			compareValues();
		}
		else if (active === "cpu") {
			document.addEventListener("click", compareValues, false);
		}     
    }
}

function playCards() {
    setCard("left", stats.shift());
    setCard("right", stats.shift());
}

function init() {
    document.addEventListener("touchstart", function () { }, false);
    document.addEventListener("click", compareValues, false);

    stats.sort((a, b) => 0.5 - Math.random());
    playCards();
}

/* --------------------------------------------------------------------------------------------------
public members, exposed with return statement
---------------------------------------------------------------------------------------------------*/
window.app = {
    init
};

app.init();
