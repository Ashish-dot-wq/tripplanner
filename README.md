# Bangalore Trip Tracker

A curated list of 100+ day-trip and weekend destinations around Bangalore, with a mobile-friendly web app to help pick where to go this weekend.

## What this is

- **`spots.json`** — the source of truth. All destinations with type, distance, status, and notes.
- **`app.css`** — the shared stylesheet for all three pages.
- **`index.html`** — **Explore**: an analytics view of the whole list. Distance distribution,
  types, a type × trip-length heatmap, and distance rings. Every chart is a filter — tap a bar,
  a column, or a cell's row to narrow everything at once.
- **`table.html`** — **All spots**: the full list as a sortable, searchable, filterable table.
- **`plan.html`** — **Plan a trip**: pick a mode of transport, filter, and get spot cards with
  drive-time estimates and Google Maps links.

## Exploring

The charts cross-filter. Tapping a type bar or a distance column narrows every other chart, the
rings, and the table; active filters show as chips you can remove one at a time. A chart never
filters itself, so you can always change your mind without clearing everything.

Two things worth knowing about the numbers:

- **Types overlap.** A spot can be both a Fort and a Trek, so the type counts add up to more
  than the number of spots.
- **The rings are not a map.** Radius is real distance from the city, but the angle is
  meaningless — `spots.json` has no coordinates, so direction genuinely isn't in the data. Add a
  `lat`/`lng` per spot and this could become a real map.

## The table

Reached from the card at the bottom of Explore, or directly at `table.html`.

- **Sort** — tap any column heading; tap again to reverse. Text columns open A→Z, `km` opens
  largest first. Trip length sorts in real order (in city → overnight), not alphabetically.
- **Search** — matches spot names *and* types, with matches highlighted.
- **Filter** — status, trip length, and type; the button shows how many filters are active.
- Spot names link straight to Google Maps directions.

Filters carry across in both directions. Filtering Explore to Forts and tapping through opens
the table already filtered to Forts, and the back link returns you to the same slice. The state
lives in the query string, so a filtered table is a shareable URL.

One caveat: Explore's distance histogram uses 25 km buckets, which the table has no equivalent
for, so those widen to the trip-length bands that cover them. The link text always states the
count the table will actually show, which is why it can differ from the number on Explore.

## Using the planner

Open `plan.html`. It has three screens:

1. **Filters** — pick **car** or **bike** (this changes both the time estimates and the Google
   Maps travel mode), then set max distance, trip length, status, and type. The button at the
   bottom shows how many spots currently match.
2. **All spots** — the full matching list, closest first. Tap *See all N spots*.
3. **Your pick** — one random spot. Tap *Surprise me*, then *Pick again* to reroll.

Each screen has its own URL (`#list`, `#pick`), so your phone's back button works as expected.

Filters combine as AND across categories and OR within one (e.g. `Fort` + `Water Falls` shows both).

### About the drive times

Estimates assume a weekend-morning start: the first 20 km at city speed, the rest at highway
speed (car 24/65 km/h, bike 30/50 km/h). **Leave by** works back from a 9am arrival. These are
rough planning numbers, not live traffic — check Maps before you actually leave.

## Design

The UI follows an Apple-style design system, defined once in `app.css`:

- **One accent.** Action Blue `#0066cc` carries every interactive element (Sky Link Blue
  `#2997ff` on dark, where Action Blue disappears). There is no second accent.
- **Type.** System font stack, which resolves to SF Pro on Apple devices. Body runs at 17px,
  not 16. Display sizes carry negative letter-spacing. Weight ladder is 300/400/600/700 —
  weight 500 is deliberately absent.
- **No shadows, no gradients.** Elevation comes from surface colour and hairline borders.
- **Radii grammar.** Pill for actions and chips, 18px for cards, 8px for utility buttons.
- **Press state.** `transform: scale(0.95)` on every button, disabled under
  `prefers-reduced-motion`.

Chart colours are derived from the same Action Blue and validated, not eyeballed: the series
colour clears the lightness band, chroma floor, and 3:1 contrast; both sequential ramps are
monotonic with ≥0.065 lightness steps; and all twelve heatmap label/background pairs clear
4.5:1. Dark-mode values are built from the system's own dark tokens, since the source spec
documents only the light-dominant variant.

## Running locally

The app fetches `spots.json`, so it needs a web server — opening `index.html` from the
filesystem will not work.

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Still to come

- Suggested breakfast stop en route
- Season / weather notes (`best_season` and `notes` render on the cards already, but no spot has them filled in yet)

## Contributing

Add a spot: open a pull request editing `spots.json`, or open an issue with the name, type, distance, and any notes.

Schema for a spot:
```json
{
  "id": 104,
  "name": "Place Name",
  "types": ["Trek / View Point"],
  "status": "to-visit",
  "distance_km": 85,
  "distance_band": "half-day",
  "maps_query": "Place Name Bangalore",
  "notes": "Best in monsoon",
  "best_season": "Jul-Sep",
  "added_by": "your-github-handle"
}
```

Distance bands: `in-city` (<30 km), `half-day` (30–75), `full-day` (75–150), `overnight` (>150).

## License

Personal project, MIT.
