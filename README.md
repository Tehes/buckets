# BUCKETS – Basketball Stat Battle

**BUCKETS** is a simple, browser‑based card game inspired by classic Quartett and Top Trumps. In each round, you draw two random NBA or WNBA player
cards and pick the stat that gives your team (the **Home** team) the edge. Points are awarded as outlined in the **Scoring Table** below. Whoever has
the higher total after four quarters wins the game.

---

## 🎮 How to Play

1. **Deck Setup** – Each round you draw a **random** player card for the Home team.\
   You can switch between NBA and WNBA in the Settings; switching changes the player pool immediately but keeps your score and clock.\
   The CPU’s card is picked dynamically based on the current score to keep the game balanced.
2. **Select a Stat** – Click one stat on your card (e.g. **PTS**, **REB**, **AST**).
3. **Compare & Score** – Your value is compared with the opponent’s. Points are awarded as shown in the scoring table below.
4. **Quarters & Timer** – Each comparison ticks the amount set in the Settings (default = 1 minute) off the game clock. After four quarters the game
   is over.
5. **Result** – A win/lose message shows the final score.

---

## 🏀 Scoring Table

| Stat                              | Points |
| --------------------------------- | ------ |
| **FT%**, **FTM**, **GP**, **MIN** | 1      |
| **3PM**, **3PP**                  | 3      |
| _All others_                      | 2      |

> _Tip:_ A made three can swing the momentum, but missing costs you 3 points – pick wisely!

---

## 🚀 Play Online

Play instantly at **[https://tehes.github.io/buckets/](https://tehes.github.io/buckets/)** – no installation required.

Supports both NBA and WNBA rosters.

---

## 🛠️ For Developers

```text
├── index.html        # Game UI
├── js/
│   └── app.js        # Game logic
├── css/
│   └── style.css     # Styling
├── fetchData-nba.js   # Deno script – scrapes NBA stats
├── fetchData-wnba.js  # Deno script – scrapes WNBA stats
├── data-nba.json      # Scraped NBA player statistics
├── data-wnba.json     # Scraped WNBA player statistics
└── deno.json         # Deno task configuration
```

### Game Logic (`app.js`)

- Loads **data.json** and shuffles the deck once at game start—every draw is fully random **for you**; the CPU card is selected by the handicap
  algorithm.
- **Dynamic handicap:** Depending on the score, the game allows the CPU card to beat yours in 0 – N categories (N shrinks when you lead, grows when
  you trail).\
  The algorithm increases or decreases this limit in ±1 steps until it finds a matching card, so games stay close without feeling scripted.
- **Configurable clock decrement:** Players can choose in the Settings whether each matchup shortens the game clock by 1, 2, or 4 minutes.
- **Optional CPU reveal:** In the Settings, players can enable an option to reveal all CPU stats during comparisons (default = off).
- `setCard(side, data)` renders the player card on the board.
- `compareValues()` compares stats and applies the **1 / 2 / 3‑point scoring**, then updates the scoreboard and animations.
- The loop runs until the clock hits 0 : 00 in the 4th quarter, then shows the final result.

- The active league (NBA/ WNBA) is selected via Settings. Switching leagues changes the player pool immediately but keeps the current score and clock.

### Styling (`style.css`)

- CSS variables for team colours and layout.
- Fully responsive with `vmin` units.

- CSS variables are namespaced by league (e.g. `--nba-den`, `--wnba-nyl`).

### Data Scraper (`fetchData-nba.js`, `fetchData-wnba.js`)

- Puppeteer scripts to refresh **data-nba.json** and **data-wnba.json** from stats.nba.com and wnba.com.
- Filters for rotation-level players in each league, applies league-specific thresholds, then ranks and trims by EFF.
- Adds player image URLs.

---

## 📖 License

Distributed under the [MIT License](LICENSE).

## 🙏 Credits

Colour palettes courtesy of **[NBA Colors](https://nbacolors.com/)**.

WNBA team colours and logos courtesy of the official WNBA website.
