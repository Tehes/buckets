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
 leftCard.setBgColor = function(value) {
    document.body.style.setProperty("--bg-left", "var(--"+ value +")");
 }

/* --------------------------------------------------------------------------------------------------
functions
---------------------------------------------------------------------------------------------------*/


function init() {
    document.addEventListener("touchstart", function() {}, false);
    fetchStats().then(
        function(data) {console.log(data[0]);}
      );
    console.log(leftCard.team);
}

/* --------------------------------------------------------------------------------------------------
public members, exposed with return statement
---------------------------------------------------------------------------------------------------*/
window.app = {
    init
};

app.init();
