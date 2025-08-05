# BUCKETS – Basketball Stat Battle

**BUCKETS** is a simple, browser‑based card game inspired by classic Quartett and Top Trumps. In each round, you draw two random NBA player cards and pick the stat that gives your team (the **Home** team) the edge.  Points are awarded as outlined in the **Scoring Table** below. Whoever has the higher total after four quarters wins the game.

---

## 🎮 How to Play

1. **Deck Setup** – Each round, two random player cards are drawn. You control the **Home** team (right side).
2. **Select a Stat** – Click one stat on your card (e.g. **PTS**, **REB**, **AST**).
3. **Compare & Score** – Your value is compared with the opponent’s. Points are awarded as shown in the scoring table below.
4. **Quarters & Timer** – Each comparison ticks 1 minute off the game clock. A quarter ends at **0 : 00**; after four quarters the game is over.
5. **Result** – A win/lose message shows the final score.

---

## 🏀 Scoring Table

| Stat         | Points |
| ------------ | ------ |
| **FT %**     | 1      |
| **3PM**      | 3      |
| **3PP**      | 3      |
| *All others* | 2      |

> *Tip:* A made three can swing the momentum, but missing costs you 3 points – pick wisely!

---

## 🚀 Play Online

Play instantly at **[https://tehes.github.io/buckets/](https://tehes.github.io/buckets/)** – no installation required.

---

## 🛠️ For Developers

```text
├── index.html        # Game UI
├── js/
│   └── app.js        # Game logic
├── css/
│   └── style.css     # Styling
├── fetchData.js      # Deno script – scrapes stats.nba.com
├── data.json         # Scraped player statistics
└── deno.json         # Deno task configuration
```

### Game Logic (`app.js`)

* Loads **data.json** and shuffles the deck once at game start—every draw is fully random for now.
* `setCard(side, data)` renders the player card on the board.
* `compareValues()` compares stats and applies the **1 / 2 / 3‑point scoring**, then updates the scoreboard and animations.
* A more advanced **dynamic handicap** system is planned but **not yet implemented** in the current build.
* The loop runs until the clock hits 0 : 00 in the 4th quarter, then shows the final result.

### Styling (`style.css`) (`style.css`) (`style.css`)

* CSS variables for team colours and layout.
* Fully responsive with `vmin` units.

### Data Scraper (`fetchData.js`)

* Puppeteer script to refresh **data.json** from stats.nba.com.

---

## 📖 License

Distributed under the [MIT License](LICENSE).

## 🙏 Credits

Colour palettes courtesy of **[NBA Colors](https://nbacolors.com/)**.
