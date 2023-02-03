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

/* --------------------------------------------------------------------------------------------------
functions
---------------------------------------------------------------------------------------------------*/
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

function compareValues(ev) {
    if (Object.keys(ev.target.dataset).length > 0) {
        const category = Object.keys(ev.target.dataset)[0];
        const values = document.querySelectorAll(`[data-${category}]`);
        values[1].textContent = values[1].dataset[category];
        const leftValue = parseInt(values[0].textContent);
        const rightValue = parseInt(values[1].textContent);

        const scores = document.querySelectorAll("output");
        const leftScore = scores[0];
        const rightScore = scores[1];

        if (leftValue > rightValue) {
            leftScore.textContent = parseFloat(leftScore.textContent) + 2;
            values[0].classList.add("higher");
            values[1].classList.add("lower");
        }
        else if (rightValue > leftValue) {
            rightScore.textContent = parseFloat(rightScore.textContent) + 2;
            values[1].classList.add("higher");
            values[0].classList.add("lower");
        }
        setTimeout(resetCategory.bind(null, values), 3000);
    }
}

function resetCategory(values) {
    values[1].textContent = "---";
    values[0].classList.remove("higher");
    values[1].classList.remove("higher");
    values[0].classList.remove("lower");
    values[1].classList.remove("lower");
    playCards();
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
