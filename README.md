# BUCKETS – Basketball Stat Battle

**BUCKETS** is a simple, browser-based card game inspired by classic Quartett
and Top Trumps. You and the computer take turns comparing random NBA player
stats—like points, rebounds, or assists—over four quarters. Choose the best stat
to win the round. Whoever has the highest score at the end wins the game.

## 🎮 How to Play

1. **Deck Setup**: Each round, two random player cards are drawn—one for you
   (left) and one for the CPU (right).
2. **Select a Stat (you only)**: Click on one of the stats on your card
   (e.g., PTS, REB, AST).
3. **Compare**: Your selected value is compared to the CPU’s. The higher value
   wins, and the winner gets 2 points.
4. **CPU Turn**: Turns alternate. On its turn, the CPU automatically selects a
   statistic, favoring the value with the greatest deviation above the average.
5. **Quarters & Timer**: Each comparison reduces the game clock—1 minute per
   play. A quarter ends when the timer reaches 0:00. After four quarters, the
   game finishes.
6. **Result**: Your final score is shown with a win/lose message.

## 🚀 Play Online

You can play the game instantly by visiting https://tehes.github.io/buckets/ in
your browser. No installation required.

## 🛠️ For Developers

- **Project Structure**
  ```plaintext
  ├── index.html       # Game UI
  ├── js/
  │   └── app.js       # Game logic
  ├── css/
  │   └── style.css    # Styling
  ├── fetchdeno.js     # Deno scraper for NBA data
  ├── data.json        # Scraped statistics
  └── deno.json        # Deno task configuration
  ```

- **Game Logic (app.js)**
  - Loads `data.json` and calculates average stats.
  - `setCard(side, data)`: Renders a player card.
  - `compareValues()`: Compares stats and updates the scoreboard.
  - `findBestValue()` selects randomly from the top three statistics with the
    highest deviation above the average rather than the single best—to keep the
    CPU’s difficulty manageable.

- **Styling (style.css)**
  - Uses CSS variables for team colors and overall layout.
  - Responsive design with `vmin` units.

- **Data Scraper (fetchdeno.js)**
  - Utilizes Puppeteer for Deno to scrape NBA statistics once per year at the
    end of the regular season from nba.com, generating `data.json`.

## 📖 License

This project is licensed under the [MIT License](LICENSE).

## Credits

Special thanks to [NBA Colors](https://nbacolors.com/) for the color palettes
used in this project.

---

_Enjoy playing and hacking!_
