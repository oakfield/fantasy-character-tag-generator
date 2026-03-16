# Fantasy Character Tag Generator

A vibe-coded portfolio project — a browser-based tool for generating **booru-style tags** that AI image generators can use to produce fantasy characters.

## Features

- **Species selector** — Human, Elf, Dark Elf, Orc, Goblin, Tiefling, Vampire, Slime Monster, and many more
- **Sex selector** — Female / Male (adjusts species-specific tags where relevant, e.g. "catgirl" vs "catboy")
- **Job / Class selector** — 25 fantasy roles including Black Mage, White Mage, Paladin, Necromancer, Tavern Keeper, and more
- **Costume & Equipment chips** — Click-to-toggle chips organized by category (Armor, Clothing, Headwear, Accessories, Weapons)
- **Consistency enforcement** — Incompatible costume items are automatically disabled for the selected species (e.g. a Tiefling cannot wear a standard helmet; a Slime Monster cannot wear solid armor)
- **Random Character button** — Weighted-random generation that produces cohesive outfits using per-job outfit presets, biased toward common/desirable results
- **Copy button** — One-click copy to clipboard
- **Character summary** — Human-readable breakdown of current selections

## Usage

Open `index.html` directly in a modern browser — no build step or server required.

```
# Clone and open
git clone https://github.com/<username>/fantasy-character-tag-generator.git
cd fantasy-character-tag-generator
# Open index.html in your browser
```

> **Note:** Because the app uses ES modules (`type="module"`), most browsers require a local HTTP server rather than opening the file directly via `file://`. You can use any of the following:
>
> ```bash
> # Python
> python -m http.server 8080
>
> # Node (npx)
> npx serve .
>
> # VS Code: Live Server extension
> ```

## Project Structure

```
index.html          — HTML shell
css/
  styles.css        — Dark-fantasy theme (CSS custom properties, responsive grid)
js/
  data.js           — All character data: species, jobs, costumes with tags & weights
  generator.js      — generateTags() — converts CharacterState → tag string
  randomizer.js     — generateRandomCharacter() — weighted-random with outfit presets
  app.js            — DOM setup, event binding, reactive state
```

## Architecture

The app is a plain-JavaScript, zero-dependency SPA using ES modules. The three JS layers follow a clear separation of concerns:

| Module | Responsibility |
|---|---|
| `data.js` | Single source of truth for all labels, tags, weights, and incompatibilities |
| `generator.js` | Pure functions — no side effects, easy to unit-test |
| `randomizer.js` | Weighted selection with job-specific outfit presets |
| `app.js` | DOM mutation and event handling only |

## Tag Output Format

Tags follow the booru convention used by Danbooru / e621 style prompts:

```
1girl, elf, pointy ears, black mage, robe, witch hat, staff, boots, cloak
```

Order: **sex → species → job → equipment**

## License

MIT
