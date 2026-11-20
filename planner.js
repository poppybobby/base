(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FlexPlanner = api;
})(typeof self !== "undefined" ? self : this, function () {
  const EARTH_M = 6371000;
  const DEFAULT_RADIUS_M = 800;
  const LEG_SIZE = 10;

  function haversine(a, b) {
    const p1 = (a.lat * Math.PI) / 180;
    const p2 = (b.lat * Math.PI) / 180;
    const dphi = ((b.lat - a.lat) * Math.PI) / 180;
    const dl = ((b.lon - a.lon) * Math.PI) / 180;
    const h = Math.sin(dphi / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * EARTH_M * Math.asin(Math.sqrt(h));
  }

  function parseAreaNames(text) {
    return String(text || "")
      .split(/[、,，\s\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function centroid(stops) {
    const lat = stops.reduce((s, p) => s + p.lat, 0) / stops.length;
    const lon = stops.reduce((s, p) => s + p.lon, 0) / stops.length;
    return { lat, lon };
  }

  // atan2(north, east) increases counterclockwise from east. That direction is 左回り.
  function ccwAngle(stop, center) {
    return Math.atan2(stop.lat - center.lat, stop.lon - center.lon);
  }

  function wrap(delta) {
    const two = Math.PI * 2;
    let x = delta % two;
    if (x < 0) x += two;
    return x;
  }

  function orderByAngle(stops, startPoint) {
    if (stops.length <= 1) return stops.slice();
    const center = centroid(stops);
    const anchor = startPoint
      ? stops.reduce((best, s) => (haversine(s, startPoint) < haversine(best, startPoint) ? s : best))
      : stops[0];
    const a0 = ccwAngle(anchor, center);
    return stops.slice().sort((a, b) => {
      const d = wrap(ccwAngle(a, center) - a0) - wrap(ccwAngle(b, center) - a0);
      if (d !== 0) return d;
      return haversine(a, center) - haversine(b, center);
    });
  }

  function nearestNeighbor(stops, startPoint) {
    const left = stops.slice();
    const out = [];
    let cursor = startPoint;
    while (left.length) {
      let pick = 0;
      if (cursor) {
        let best = Infinity;
        left.forEach((s, i) => {
          const d = haversine(s, cursor);
          if (d < best) { best = d; pick = i; }
        });
      }
      const next = left.splice(pick, 1)[0];
      out.push(next);
      cursor = next;
    }
    return out;
  }

  // 250m以内は同じ塊として先にまとめ、塊の並びだけ左回りにする。
  function clusterStops(stops, radiusM) {
    const groups = stops.map((s) => [s]);
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < groups.length; i++) {
        let merged = false;
        for (let j = i + 1; j < groups.length; j++) {
          const close = groups[i].some((a) => groups[j].some((b) => haversine(a, b) <= radiusM));
          if (close) {
            groups[i] = groups[i].concat(groups[j]);
            groups.splice(j, 1);
            changed = true;
            merged = true;
            break;
          }
        }
        if (merged) break;
      }
    }
    return groups;
  }

  function orderCounterclockwise(stops, startPoint) {
    if (stops.length <= 2) return nearestNeighbor(stops, startPoint);
    const groups = clusterStops(stops, 250);
    if (groups.length === 1) return nearestNeighbor(stops, startPoint);
    const reps = groups.map((group) => Object.assign(centroid(group), { group: group }));
    const ordered = orderByAngle(reps, startPoint);
    const out = [];
    let cursor = startPoint;
    ordered.forEach((rep) => {
      nearestNeighbor(rep.group, cursor).forEach((s) => {
        out.push(s);
        cursor = s;
      });
    });
    return out;
  }

  function inArea(stop, area) {
    if (area.name && stop.address && stop.address.includes(area.name)) return true;
    if (area.lat != null && area.lon != null) {
      return haversine(stop, area) <= (area.radiusM || DEFAULT_RADIUS_M);
    }
    return false;
  }

  function orderRoute(stops, options) {
    const opts = options || {};
    const areas = opts.areas || [];
    let cursor = opts.here || null;
    const used = new Set();
    const ordered = [];

    areas.forEach((area) => {
      const group = stops.filter((s) => !used.has(s) && inArea(s, area));
      const part = orderCounterclockwise(group, cursor);
      part.forEach((s) => {
        used.add(s);
        ordered.push(s);
      });
      if (part.length) cursor = part[part.length - 1];
    });

    const rest = stops.filter((s) => !used.has(s));
    orderCounterclockwise(rest, cursor).forEach((s) => ordered.push(s));
    return ordered;
  }

  function chunkLegs(stops, size) {
    const n = size || LEG_SIZE;
    const legs = [];
    if (!stops.length) return legs;
    let i = 0;
    while (i < stops.length) {
      const end = Math.min(stops.length, i + n);
      const slice = stops.slice(i, end);
      if (slice.length === 1 && legs.length) {
        legs[legs.length - 1] = legs[legs.length - 1].concat(slice);
        break;
      }
      legs.push(slice);
      if (end >= stops.length) break;
      i = end - 1;
    }
    return legs;
  }

  const SCHOOL_RESTRICTION = { startMin: 7 * 60, endMin: 9 * 60 };

  function clockToMin(value) {
    if (typeof value === "number") return value;
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(value || ""));
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  }

  function formatMin(min) {
    const day = ((Math.round(min) % 1440) + 1440) % 1440;
    const h = Math.floor(day / 60);
    const m = day % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }

  function inRestriction(min, restriction) {
    return min >= restriction.startMin && min < restriction.endMin;
  }

  // 規制時間中は抜け道が一方通行になり、速度も落ちる。
  function driveMin(a, b, departMin, restriction) {
    const meters = haversine(a, b) * 1.4;
    const kmh = inRestriction(departMin, restriction) ? 15 : 24;
    return Math.max(0.4, (meters / 1000 / kmh) * 60);
  }

  function planDay(stops, options) {
    const opts = options || {};
    const restriction = opts.restriction || SCHOOL_RESTRICTION;
    const serviceMin = opts.serviceMin == null ? 1.3 : opts.serviceMin;
    const areas = opts.areas || [];
    const here = opts.here || null;
    const depart = opts.departMin == null ? 5 * 60 : opts.departMin;

    const must = [];
    const flex = [];
    stops.forEach((s) => {
      if (s.windowEndMin != null && s.windowEndMin <= restriction.endMin) must.push(s);
      else flex.push(s);
    });

    const mustOrder = orderRoute(must, { areas: areas, here: here });
    const flexOrder = orderRoute(flex, {
      areas: areas,
      here: mustOrder.length ? mustOrder[mustOrder.length - 1] : here,
    });

    const timed = [];
    let t = depart;
    let prev = here;

    function append(s) {
      const drive = prev ? driveMin(prev, s, t, restriction) : 0;
      const arrive = t + drive;
      timed.push(Object.assign({}, s, {
        arriveMin: arrive,
        driveMin: drive,
        inRestriction: inRestriction(arrive, restriction),
      }));
      t = arrive + serviceMin;
      prev = s;
    }

    mustOrder.forEach(append);
    flexOrder.forEach((s) => {
      const drive = prev ? driveMin(prev, s, t, restriction) : 0;
      const arrive = t + drive;
      const canWait = s.windowEndMin == null || s.windowEndMin > restriction.endMin;
      if (canWait && inRestriction(arrive, restriction)) t = restriction.endMin;
      append(s);
    });
    return timed;
  }

  function mapsUrl(leg, fromHere) {
    if (!leg.length) return "";
    const dest = leg[leg.length - 1];
    const params = new URLSearchParams();
    params.set("api", "1");
    params.set("travelmode", "driving");
    params.set("dir_action", "navigate");
    params.set("destination", dest.lat + "," + dest.lon);
    if (fromHere || leg.length === 1) {
      const mid = leg.slice(0, -1);
      if (mid.length) params.set("waypoints", mid.map((s) => s.lat + "," + s.lon).join("|"));
    } else {
      params.set("origin", leg[0].lat + "," + leg[0].lon);
      const mid = leg.slice(1, -1);
      if (mid.length) params.set("waypoints", mid.map((s) => s.lat + "," + s.lon).join("|"));
    }
    return "https://www.google.com/maps/dir/?" + params.toString();
  }

  return {
    DEFAULT_RADIUS_M,
    LEG_SIZE,
    haversine,
    parseAreaNames,
    orderCounterclockwise,
    orderRoute,
    chunkLegs,
    mapsUrl,
    inArea,
    SCHOOL_RESTRICTION,
    clockToMin,
    formatMin,
    planDay,
  };
});
