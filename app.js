/* ============================================================
   Shared helpers for the Bangalore Trip Tracker.
   Loaded by plan.html and discover.html.
   ============================================================ */
window.TT = (function () {
  "use strict";

  var BLR = { lat: 12.9716, lon: 77.5946 };

  var BANDS = [
    { id: "in-city",   label: "In city" },
    { id: "half-day",  label: "Half day" },
    { id: "full-day",  label: "Full day" },
    { id: "overnight", label: "Overnight" }
  ];

  /* ---------- "Good for" ----------
     These are generated from a spot's `types` and `distance_band`, NOT
     researched per place. They describe what the category is generally good
     for — treat them as a hint, not a fact about that specific spot. */
  var TYPE_GOOD_FOR = {
    "Trek / View Point":       "sunrise hikes and big views",
    "Fort":                    "ruins, history and a bit of a climb",
    "Lake / Dam / Waterbody":  "picnics and slow afternoons",
    "Water Falls":             "just after the monsoon, when it's actually flowing",
    "Temple":                  "architecture and a quiet stop",
    "Museum":                  "a rainy day or an indoor morning",
    "Park / Chill Spot":       "an easy outing when you're short on time",
    "Nature/Forest":           "birds, greenery and cooler air",
    "Boating":                 "an hour out on the water",
    "Cafe":                    "coffee and a long breakfast",
    "Campus":                  "a flat walk around good architecture",
    "Palace":                  "photographs and old grandeur"
  };

  var BAND_NOTE = {
    "in-city":   "close enough for a weekday evening",
    "half-day":  "out and back before lunch",
    "full-day":  "an early start and a full day out",
    "overnight": "worth staying the night"
  };

  // Returns a lower-case fragment meant to follow "Good for ", or "" when we
  // have nothing useful to say.
  function goodFor(spot) {
    var bits = [];
    (spot.types || []).forEach(function (t) {
      if (TYPE_GOOD_FOR[t]) bits.push(TYPE_GOOD_FOR[t]);
    });
    var note = BAND_NOTE[spot.distance_band];
    if (!bits.length) return note || "";
    // Two categories is plenty; a third makes it read like a list.
    var text = bits.slice(0, 2).join(", and ");
    if (note) text += " — " + note;
    return text;
  }

  /* OSM's own `type` maps onto the vocabulary spots.json already uses, so a
     search result can carry the same "Good for" line as a stored spot. */
  var OSM_TYPE = {
    peak: "Trek / View Point", viewpoint: "Trek / View Point", ridge: "Trek / View Point",
    waterfall: "Water Falls",
    fort: "Fort", castle: "Fort", ruins: "Fort", archaeological_site: "Fort",
    palace: "Palace",
    museum: "Museum",
    water: "Lake / Dam / Waterbody", reservoir: "Lake / Dam / Waterbody",
    lake: "Lake / Dam / Waterbody", dam: "Lake / Dam / Waterbody", pond: "Lake / Dam / Waterbody",
    park: "Park / Chill Spot", garden: "Park / Chill Spot",
    place_of_worship: "Temple", temple: "Temple", hindu_temple: "Temple",
    wood: "Nature/Forest", forest: "Nature/Forest", nature_reserve: "Nature/Forest",
    cafe: "Cafe",
    university: "Campus", college: "Campus"
  };
  function typeFromOsm(t) { return OSM_TYPE[t] || null; }

  /* ---------- geo ---------- */

  // Straight-line distance. NOT road distance — always label it as such.
  function crowFlies(lat, lon) {
    var R = 6371, p = Math.PI / 180;
    var a = 0.5 - Math.cos((lat - BLR.lat) * p) / 2 +
            Math.cos(BLR.lat * p) * Math.cos(lat * p) *
            (1 - Math.cos((lon - BLR.lon) * p)) / 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(a)));
  }

  // Rough band from a straight-line distance, so API results can be compared
  // against the stored list. Deliberately generous — crow-flies underestimates.
  function bandFor(km) {
    if (km <= 30) return "in-city";
    if (km <= 90) return "half-day";
    if (km <= 160) return "full-day";
    return "overnight";
  }

  function mapsUrl(query, mode) {
    return "https://www.google.com/maps/dir/?api=1&destination=" +
           encodeURIComponent(query) +
           "&travelmode=" + (mode === "bike" ? "two-wheeler" : "driving");
  }

  /* ---------- matching against the stored list ---------- */

  function normalise(s) {
    return (s || "").toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\b(fort|hill|hills|betta|lake|falls|waterfalls|temple|the)\b/g, " ")
      .replace(/\s+/g, " ").trim();
  }

  /* Exact match on the normalised form only. Prefix matching was tried and
     produced false positives — "Nandi Hills Road" normalises to "nandi road",
     which prefix-matched the stored "Nandi Hills" ("nandi") and mislabelled a
     road as an already-saved spot. Missing a match is far less confusing than
     claiming one that isn't there. */
  function findStored(name, spots) {
    var n = normalise(name);
    if (!n) return null;
    return spots.find(function (s) { return normalise(s.name) === n; }) || null;
  }

  /* Nominatim happily returns roads, bus stops and suburbs for a place name.
     None of them are somewhere you'd drive to for the day. */
  var NOT_A_DESTINATION = [
    "road", "residential", "service", "track", "path", "footway", "primary",
    "secondary", "tertiary", "trunk", "motorway", "unclassified", "living_street",
    "bus_stop", "bus_station", "platform", "traffic_signals", "turning_circle",
    "house", "houses", "apartments", "construction", "yes"
  ];
  function isDestination(osmType) {
    return NOT_A_DESTINATION.indexOf(osmType) === -1;
  }

  return {
    BLR: BLR, BANDS: BANDS,
    goodFor: goodFor, crowFlies: crowFlies, bandFor: bandFor,
    mapsUrl: mapsUrl, findStored: findStored, normalise: normalise,
    typeFromOsm: typeFromOsm, isDestination: isDestination
  };
})();
