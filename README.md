# Bangalore Trip Tracker

A curated list of 100+ day-trip and weekend destinations around Bangalore, with a mobile-friendly web app to help pick where to go this weekend.

## What this is

- **`spots.json`** — the source of truth. All destinations with type, distance, status, and notes.
- **`index.html`** — the web app. Pick your mode of transport, filter, and get spot cards with drive-time estimates and Google Maps links.

## Using the app

Open the GitHub Pages site on your phone. The app has three screens:

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
