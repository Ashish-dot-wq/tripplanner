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

  /* ---------- local state: shortlist + visited overrides ----------
     A static site can't write back to spots.json, so both live in
     localStorage on this device. The export in the Saved screen produces the
     JSON to paste back into the repo when you want it to be permanent. */
  var KEY_SAVED = "tt.saved.v1";
  var KEY_VISITED = "tt.visited.v1";

  function load(key) {
    try { return new Set(JSON.parse(localStorage.getItem(key) || "[]")); }
    catch (e) { return new Set(); }
  }
  function persist(key, set) {
    try { localStorage.setItem(key, JSON.stringify([...set])); } catch (e) { /* private mode */ }
  }

  var saved = load(KEY_SAVED);
  var visited = load(KEY_VISITED);
  var listeners = [];

  function emit() { listeners.forEach(function (f) { f(); }); }

  var store = {
    onChange: function (f) { listeners.push(f); },

    isSaved: function (id) { return saved.has(id); },
    savedCount: function () { return saved.size; },
    savedIds: function () { return [...saved]; },
    toggleSaved: function (id) {
      saved.has(id) ? saved.delete(id) : saved.add(id);
      persist(KEY_SAVED, saved); emit();
      return saved.has(id);
    },
    clearSaved: function () { saved.clear(); persist(KEY_SAVED, saved); emit(); },

    // A spot counts as visited if spots.json says so OR it's been ticked here.
    isVisited: function (spot) {
      return spot.status === "visited" || visited.has(spot.id);
    },
    // Only locally-added ticks are overrides; un-ticking a spots.json visit
    // isn't supported, since that belongs in the file itself.
    isLocalVisit: function (id) { return visited.has(id); },
    toggleVisited: function (id) {
      visited.has(id) ? visited.delete(id) : visited.add(id);
      persist(KEY_VISITED, visited); emit();
      return visited.has(id);
    },
    visitedCount: function () { return visited.size; },
    clearVisited: function () { visited.clear(); persist(KEY_VISITED, visited); emit(); },

    // spots.json with local ticks folded in, ready to paste back.
    exportJson: function (data) {
      var out = JSON.parse(JSON.stringify(data));
      out.spots.forEach(function (s) {
        if (visited.has(s.id)) s.status = "visited";
      });
      return JSON.stringify(out, null, 2) + "\n";
    }
  };

  /* A heart button, matching the marketplace save grammar. */
  function heartButton(id, label) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "heart";
    b.setAttribute("aria-pressed", store.isSaved(id) ? "true" : "false");
    b.setAttribute("aria-label", (store.isSaved(id) ? "Remove " : "Save ") + label);
    b.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 28c7.7-4.7 12-9.3 12-14.3 0-3.7-2.8-6.7-6.4-6.7-2.3 0-4.3 1.2-5.6 3.1-1.3-1.9-3.3-3.1-5.6-3.1C6.8 7 4 10 4 13.7 4 18.7 8.3 23.3 16 28z"/></svg>';
    b.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      var on = store.toggleSaved(id);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.setAttribute("aria-label", (on ? "Remove " : "Save ") + label);
    });
    return b;
  }

  /* Keeps the nav's saved-count pill in sync on every page. */
  function mountSavedCount() {
    var pill = document.getElementById("nav-saved");
    if (!pill) return;
    var n = pill.querySelector(".n");
    function sync() {
      var c = store.savedCount();
      n.textContent = c;
      n.setAttribute("data-zero", c ? "0" : "1");
    }
    store.onChange(sync); sync();
  }

  return {
    BLR: BLR, BANDS: BANDS,
    store: store, heartButton: heartButton, mountSavedCount: mountSavedCount,
    goodFor: goodFor, crowFlies: crowFlies, bandFor: bandFor,
    mapsUrl: mapsUrl, findStored: findStored, normalise: normalise,
    typeFromOsm: typeFromOsm, isDestination: isDestination
  };
})();
