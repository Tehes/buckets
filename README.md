# BUCKETS – Basketball Stat Battle

**BUCKETS** is a simple, browser-based card game inspired by classic Quartett and Top Trumps. You and the computer take turns comparing random NBA
player stats—like points, rebounds, or assists—over four quarters. Choose the best stat to win the round. Whoever has the highest score at the end
wins the game.

## 🎮 How to Play

1. **Deck Setup**: Each round, two random player cards are drawn. You play for the home team (right side).
2. **Select a Stat**: Click on one of the stats on your card (e.g., PTS, REB, AST).
3. **Compare**: Your selected value is compared to the opponent's. The higher value wins, and the winner gets 2 points.
4. **Quarters & Timer**: Each comparison reduces the game clock—1 minute per play. A quarter ends when the timer reaches 0:00. After four quarters,
   the game finishes.
5. **Result**: Your final score is shown with a win/lose message.

## 🚀 Play Online

You can play the game instantly by visiting https://tehes.github.io/buckets/ in your browser. No installation required.

## 🛠️ For Developers

- **Project Structure**
  ```plaintext
  ├── index.html       # Game UI
  ├── js/
  │   └── app.js       # Game logic
  ├── css/
  │   └── style.css    # Styling
  ├── fetchData.js      # Deno script that fetches NBA data via Web Scraping
  ├── data.json        # Scraped statistics
  └── deno.json        # Deno task configuration
  ```

- **Game Logic (app.js)**
  - Loads `data.json` and calculates average stats.
  - `setCard(side, data)`: Renders a player card.
  - `compareValues()`: Compares stats and updates the scoreboard.

- **Styling (style.css)**
  - Uses CSS variables for team colors and overall layout.
  - Responsive design with `vmin` units.

- **Data Scraper (fetchData.js)**
  - Uses puppeteer to get the new data from stats.nba.com and regenerate `data.json`.

## 📖 License

This project is licensed under the [MIT License](LICENSE).

## Credits

Special thanks to [NBA Colors](https://nbacolors.com/) for the color palettes used in this project.
