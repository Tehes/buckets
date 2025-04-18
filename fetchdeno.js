import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

console.log("Starte Deno-Scraper...");

let browser;
try {
    // Browser starten
    // Use locally installed Chrome instead of downloading a binary
    browser = await puppeteer.launch({
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        headless: true
    });
    console.log("Browser gestartet");

    const page = await browser.newPage();
    page.setDefaultTimeout(60_000);
    page.setDefaultNavigationTimeout(60_000);
    console.log("Seite geöffnet");

    // Seite laden
    await page.goto(
        "https://www.nba.com/stats/leaders?Season=2024-25&SeasonType=Regular%20Season&StatCategory=EFF",
        { waitUntil: "networkidle2" }
    );
    console.log("URL geladen");

    // Rows-per-Page Dropdown auf "All" stellen
    const dropdownSelector = 'div[class^="Pagination_pageDropdown__"] select[class^="DropDown_select__"]';
    await page.waitForSelector(dropdownSelector, { timeout: 60_000 });
    await page.select(dropdownSelector, "-1");
    console.log("Dropdown auf 'All' gesetzt");

    // Warten bis alle Zeilen geladen sind
    await page.waitForNetworkIdle({ timeout: 60_000 });
    console.log("Netzwerk inaktiv, alle Zeilen geladen");

    // Daten scrapen
    console.log("Beginne mit Scraping");
    const data = await page.$$eval("table tbody tr", (rows) => {
        // Spaltennamen aus <th>
        const headers = Array.from(
            document.querySelectorAll("table th"),
            (th) => th.textContent.trim().toLowerCase().replace("%", "p")
        );

        return rows.map((row) => {
            // Zelltexte
            const cells = Array.from(
                row.querySelectorAll("td"),
                (td) => td.textContent.trim()
            );

            // Objekt aufbauen
            const player = headers.reduce((acc, key, idx) => {
                acc[key] = cells[idx];
                return acc;
            }, {});

            // Spieler-ID extrahieren
            const idMatch = row
                .querySelector("td:nth-child(2) a")
                ?.href.match(/\d+/);
            const id = idMatch ? idMatch[0] : null;

            return {
                ...player,
                id,
                pic: id
                    ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`
                    : null,
            };
        });
    });
    console.log(`Scraping fertig, ${data.length} Datensätze gefunden`);

    // In Datei schreiben
    console.log("Schreibe data.json...");
    await Deno.writeTextFile("data.json", JSON.stringify(data, null, 2));
    console.log("data.json erfolgreich geschrieben");
} catch (err) {
    console.error("Fehler im Deno-Scraper:", err);
} finally {
    if (browser) {
        await browser.close();
        console.log("Browser geschlossen");
    }
}