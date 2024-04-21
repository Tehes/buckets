// Import Filesystem
import fs from 'fs';

// Import puppeteer
import puppeteer from 'puppeteer';

(async () => {
    // Launch the browser
    const browser = await puppeteer.launch();

    // Create a page
    const page = await browser.newPage();

    // Go to your site
    await page.goto('https://www.nba.com/stats/leaders?StatCategory=EFF&Season=2023-24');

    // scrape the data 
    const data = await page.evaluate(() => {
        const example = document.querySelectorAll('select')[5];
        const example_options = example.querySelectorAll('option');

        example_options[0].selected = true;
        const event = new Event('change', { bubbles: true });
        example.dispatchEvent(event);


        const props = document.querySelectorAll("table th");
        const rows = document.querySelectorAll("table tr");
        const arr = [];

        for (let i = 1; i < rows.length; i++) {
            const playerObject = {};
            const cells = rows[i].querySelectorAll("td");
            for (let j = 0; j < cells.length; j++) {
                playerObject[props[j].textContent.toLowerCase().replace("%", "p").trim()] = cells[j].textContent.trim();
                playerObject.id = cells[1].querySelector("a").href.replace(/[^0-9]/g, "");
                playerObject.pic = `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerObject.id}.png`;
            }
            arr.push(playerObject);
        }
        return arr;
    });

    // write the JSON file to disk
    fs.writeFile('data.json', JSON.stringify(data), function (err) {
        if (err) { console.log(err); }
    });

    // Close browser.
    await browser.close();
})();
