# Bangalore Trip Tracker

A curated list of 100+ day-trip and weekend destinations around Bangalore, with a mobile-friendly web app to help pick where to go this weekend.

## What this is

- **`spots.json`** — the source of truth. All destinations with type, distance, status, and notes.
- **`discover.html`** — **Discover**: searches OpenStreetMap live for places that aren't in the
  list yet. Nothing it finds is written to `spots.json`.
- **`app.css`** / **`app.js`** — shared stylesheet and helpers.
- **`index.html`** — **Plan a trip**: the landing page. Pick a mode, narrow it down, get drive
  times and directions. Also holds the **Saved** shortlist.
- **`explore.html`** — **Explore**: an analytics view of the whole list. Distance distribution,
  types, a type × trip-length heatmap, and distance rings. Every chart is a filter — tap a bar,
  a column, or a cell's row to narrow everything at once.
- **`table.html`** — **All spots**: the full list as a sortable, searchable, filterable table.
- **`plan.html`** — a redirect to `index.html`, kept so older links don't 404.

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

Reached from the card at the bottom of Explore, or from the **All spots** tab.

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

The planner is the landing page. It has four screens:

1. **Filters** — pick **car** or **bike** (this changes both the time estimates and the Google
   Maps travel mode), then set max distance, trip length, status, and type. The button at the
   bottom shows how many spots currently match.
2. **All spots** — the full matching list, closest first. Tap *See all N spots*.
3. **Your pick** — one random spot. Tap *Surprise me*, then *Pick again* to reroll.
4. **Saved** — your shortlist, reachable from the header on any page.

Each screen has its own URL (`#list`, `#pick`, `#saved`), so your phone's back button works as
expected.

Filters combine as AND across categories and OR within one (e.g. `Fort` + `Water Falls` shows both).

### About the drive times

Estimates assume a weekend-morning start: the first 20 km at city speed, the rest at highway
speed (car 24/65 km/h, bike 30/50 km/h). **Leave by** works back from a 9am arrival. These are
rough planning numbers, not live traffic — check Maps before you actually leave.

## Discover

Two ways to look for somewhere new. Both hit free, keyless OpenStreetMap services straight from
the browser — there's no backend and no API key to leak. **Results are never saved**; `spots.json`
is only read, to tag results you already have.

- **Search by name** — [Nominatim](https://nominatim.openstreetmap.org). Fast and dependable
  (0.3–0.7s). Use this for "I heard about X, how far is it?"
- **Browse a category** — [Overpass](https://overpass-api.de). Genuinely useful for finding forts
  or waterfalls you didn't know about, but the free endpoints are heavily loaded and it fails
  often. The page tries three mirrors and then says so plainly.

Two things that bit during development, both now handled:

- Overpass signals a server-side timeout as **HTTP 200 with an empty `elements` array and a
  `remark` field**. Checking only `response.ok` renders that as "no forts within 100 km", which is
  false. The code treats any `remark` as a failure. It also rejects non-JSON, since a rate-limited
  endpoint returns an HTML page with a 200.
- Only sparse tags are offered as categories. Common ones (`place_of_worship`, `park`, `cafe`)
  time out at these radii and were deliberately left out.

Distances on this page are **straight-line**, computed from the coordinates the API returns, so
they read shorter than the road distances everywhere else — Savandurga is 33 km as the crow flies
and 72 km by road. The two are labelled differently on purpose.

## "Good for"

Each spot on the planner and in Discover carries a one-line "Good for" note. These are generated
from the spot's `types` and `distance_band` — a Fort gets "ruins, history and a bit of a climb", a
half-day trip gets "out and back before lunch". They describe **what the category is generally
good for, not what that specific place is like**. Nothing here is researched per place.

## Saving and ticking off

Two things live in **localStorage on your device**, because a static site can't write back to
`spots.json`:

- **The heart** shortlists a spot for this trip. The count sits in the header; the Saved screen
  lists them, closest first.
- **Mark visited** ticks a spot off. Spots already marked visited in `spots.json` can't be
  un-ticked here — that belongs in the file.

Once you've ticked anything, the Saved screen shows a **Make it permanent** panel with your whole
`spots.json` regenerated with the ticks folded in. Copy it over the file in the repo and the
change becomes real for everyone; until then it's only on that one browser.

## Design

The UI follows an Airbnb-style design system, defined once in `app.css`:

- **One accent.** Rausch `#ff385c` carries every primary CTA, the saved-heart fill, and the
  brand wordmark. There is no second accent.
- **Modest display weights.** Headlines sit at 21–28px in weight 600–700, body at 16px/1.5. The
  system leans on whitespace and card rhythm rather than typographic muscle.
- **Soft shapes.** 8px buttons, 14px cards, pill-shaped chips and search. Effectively no hard
  corners.
- **One shadow tier.** Depth is surface colour and hairline borders; the single shadow is
  reserved for the search field and hover-floated cards.
- **Press state** flips the fill to `#e00b41` — no transform.

Chart colours are derived from Rausch and validated, not eyeballed. That caught a real problem:
alpha-blending a saturated red gives a **min lightness step of 0.044**, under the 0.06 floor, so
the ramp's dark end is extended past Rausch into a deeper red. The result is monotonic at
0.065, and all twelve heatmap label/background pairs clear 4.6:1.

Dark-mode values are **derived, not specified** — `DESIGN-airbnb.md` states Airbnb ships no dark
mode on the public web, so surfaces are stepped off `#121212` with a lighter Rausch (5.61:1 on
dark) and a ramp revalidated against `#1e1e1e`.

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
