# BUCKETS – Basketball Stat Battle

**BUCKETS** is a simple, browser‑based card game inspired by classic Quartett and Top Trumps. In each round, you draw two random NBA player cards and
pick the stat that gives your team (the **Home** team) the edge. Points are awarded as outlined in the **Scoring Table** below. Whoever has the higher
total after four quarters wins the game.

---

## 🎮 How to Play

1. **Deck Setup** – Each round you draw a **random** player card for the Home team.\
   The CPU’s card is picked dynamically based on the current score to keep the game balanced.
2. **Select a Stat** – Click one stat on your card (e.g. **PTS**, **REB**, **AST**).
3. **Compare & Score** – Your value is compared with the opponent’s. Points are awarded as shown in the scoring table below.
4. **Quarters & Timer** – Each comparison ticks 1 minute off the game clock. A quarter ends at **0 : 00**; after four quarters the game is over.
5. **Result** – A win/lose message shows the final score.

---

## 🏀 Scoring Table

| Stat                      | Points |
| ------------------------- | ------ |
| **FT %**, **GP**, **MIN** | 1      |
| **3PM**, **3PP**          | 3      |
| _All others_              | 2      |

> _Tip:_ A made three can swing the momentum, but missing costs you 3 points – pick wisely!

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

- Loads **data.json** and shuffles the deck once at game start—every draw is fully random **for you**; the CPU card is selected by the handicap
  algorithm.
- **Dynamic handicap:** Depending on the score, the game allows the CPU card to beat yours in 0 – N categories (N shrinks when you lead, grows when
  you trail).\
  The algorithm increases or decreases this limit in ±1 steps until it finds a matching card, so games stay close without feeling scripted.
- `setCard(side, data)` renders the player card on the board.
- `compareValues()` compares stats and applies the **1 / 2 / 3‑point scoring**, then updates the scoreboard and animations.
- The loop runs until the clock hits 0 : 00 in the 4th quarter, then shows the final result.

### Styling (`style.css`)

- CSS variables for team colours and layout.
- Fully responsive with `vmin` units.

### Data Scraper (`fetchData.js`)

- Puppeteer script to refresh **data.json** from stats.nba.com.

---

## 📖 License

Distributed under the [MIT License](LICENSE).

## 🙏 Credits

Colour palettes courtesy of **[NBA Colors](https://nbacolors.com/)**.
