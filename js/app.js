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
const leftCard = document.querySelector(".left");
leftCard.team = leftCard.querySelector("h2");
leftCard.setBgColor = function (value) {
    document.body.style.setProperty("--bg-left", `var(--${value})`);
}
leftCard.setLogo = function (value) {
    document.body.style.setProperty("--bg-img-left", `url(../img/${value}.svg)`);
}
leftCard.playerImg = leftCard.querySelector("img");
leftCard.playerName = leftCard.querySelector("h1");

/* --------------------------------------------------------------------------------------------------
functions
---------------------------------------------------------------------------------------------------*/

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

function init() {
    document.addEventListener("touchstart", function () { }, false);
    fetchStats().then(
        function (data) {
            data.sort((a, b) => 0.5 - Math.random());

            leftCard.setBgColor(data[0].TEAM);
            leftCard.setLogo(data[0].TEAM);
            leftCard.team.textContent = data[0].TEAM;
            leftCard.playerImg.src = data[0].pic;
            leftCard.playerName.textContent = data[0].Player;
            console.log(data[0]);
        }
    );


}

/* --------------------------------------------------------------------------------------------------
public members, exposed with return statement
---------------------------------------------------------------------------------------------------*/
window.app = {
    init
};

app.init();
