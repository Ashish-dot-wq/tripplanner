# Bangalore Trip Tracker

A curated list of 100+ day-trip and weekend destinations around Bangalore, with a mobile-friendly web app to help pick where to go this weekend.

## What this is

- **`spots.json`** — the source of truth. All destinations with type, distance, status, and notes.
- **Web app** (coming soon) — pick mode of transport, filters, and get suggestions with drive time, breakfast stops, and Google Maps links.

## How to use it (for now)

1. Browse `spots.json` directly, or open in any Claude chat with a link to the raw file.
2. Ask Claude: "Here's my trip tracker JSON: [paste or link]. I want to go on a car trip Saturday, distance under 100 km, monsoon-friendly. What do you suggest?"

## Planned features

- Mode of transport picker (car / bike) as the first question
- Filters: distance band, type, visited/to-visit, season
- Per-spot card with:
  - One-way distance and estimated drive time (accounting for Bangalore traffic)
  - Suggested breakfast stop en route
  - Best time to leave
  - Google Maps directions link
  - Season / weather notes
- "Surprise me" random pick
- Mobile-friendly, hosted on GitHub Pages

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
