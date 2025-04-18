// Import Filesystem
import { writeFile } from 'fs/promises';

// Import puppeteer
import puppeteer from 'puppeteer';

(async () => {
    let browser;
    try {
        // Launch the browser
        browser = await puppeteer.launch();
        console.log('Browser gestartet');

        // Create a page
        const page = await browser.newPage();
        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(60000);
        console.log('Seite geöffnet');

        // Go to your site
        await page.goto('https://www.nba.com/stats/leaders?Season=2024-25&SeasonType=Regular%20Season&StatCategory=EFF');
        console.log('URL geladen');
        // Rows-per-Page Dropdown auf "All" stellen (dynamisch finden)
        await page.evaluate(() => {
            const selects = Array.from(document.querySelectorAll('select'));
            for (const sel of selects) {
                const firstOpt = sel.querySelector('option[value="-1"]');
                if (firstOpt && firstOpt.textContent.trim() === 'All') {
                    sel.value = '-1';
                    sel.dispatchEvent(new Event('change', { bubbles: true }));
                    break;
                }
            }
        });
        console.log('Dropdown auf "All" gesetzt');
        // Warten bis alle Zeilen nachgeladen sind
        await page.waitForFunction(
            () => document.querySelectorAll('table tbody tr').length > 50,
            { timeout: 60000 }
        );
        console.log('Alle Zeilen geladen');
        console.log('Beginne mit Scraping');
        const data = await page.$$eval('table tbody tr', rows => {
            const props = Array.from(document.querySelectorAll('table th'))
                .map(th => th.textContent.trim().toLowerCase().replace('%', 'p'));
            return rows.map(row => {
                const cells = Array.from(row.querySelectorAll('td'), td => td.textContent.trim());
                const player = props.reduce((obj, key, i) => {
                    obj[key] = cells[i];
                    return obj;
                }, {});
                const id = row.querySelector('td:nth-child(2) a')?.href.match(/\d+/)?.[0] ?? null;
                return {
                    ...player,
                    id,
                    pic: id ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png` : null
                };
            });
        });
        console.log(`Scraping fertig, ${data.length} Datensätze gefunden`);

        // write the JSON file to disk
        console.log('Schreibe data.json...');
        try {
            await writeFile('data.json', JSON.stringify(data), 'utf-8');
            console.log('data.json erfolgreich geschrieben');
        } catch (err) {
            console.error('Fehler beim Schreiben der Datei:', err);
        }

    } catch (err) {
        console.error('Unerwarteter Fehler:', err);
    } finally {
        if (browser) {
            await browser.close();
            console.log('Browser geschlossen');
        }
    }
})();
