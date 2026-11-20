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
    if (meters < 40) return 0;
    const kmh = inRestriction(departMin, restriction) ? 15 : 24;
    return Math.max(0.4, (meters / 1000 / kmh) * 60);
  }

  function normalizeAddress(address) {
    return String(address || "")
      .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
      .replace(/[－—―−]/g, "-")
      .replace(/ヶケ/g, "ヶ")
      .replace(/ケ丘/g, "ヶ丘")
      .replace(/[ \t　]+/g, " ")
      .trim();
  }

  function looksLikeAddress(line) {
    const s = String(line || "");
    if (/(スケジュール|目的地|配達プラン|完了しました|G\.?\s*L)/i.test(s)) return false;
    if (/(市|区|町|村|郡|丁目|番地)/.test(s) && /\d/.test(s)) return true;
    if (/(都|道|府|県)/.test(s) && /\d/.test(s) && /[一-龠々]/.test(s)) return true;
    return /[一-龠々ヶ]{2,}.*\d+\s*[-－]\s*\d+/.test(s);
  }

  function streetQuery(address) {
    let s = normalizeAddress(address);
    s = s.replace(/現在の目的地.*/g, "");
    s = s.replace(/[CＣ]棟.*/g, "");
    s = s.replace(/[CＣ]-?\d+.*/g, "");
    s = s.replace(/\d+棟.*/g, "");
    s = s.replace(/号室.*/g, "");
    s = s.replace(/(\d)[A-Za-z](?=-\d)/g, "$1");
    s = s.replace(/[ァ-ヴー]{2,}.*/g, "");
    s = s.replace(/[^\u3040-\u30ff\u4e00-\u9fff\d\-丁目番地号]/g, "");
    return s;
  }

  function geocodeCandidates(address) {
    const base = streetQuery(address);
    const out = [];
    function add(q) {
      const v = String(q || "").trim();
      if (v && !out.includes(v)) out.push(v);
    }
    add(base);
    add(base.replace(/^(北海道|東京都|.{2,3}[都道府県])/, ""));
    add(base.replace(/^.*?(?=(?:市|区|町|村))/, ""));
    const chome = base.match(/(.+?[町村郡区市].*?\d+(?:丁目)?[\d\-]*)/);
    if (chome) add(chome[1]);
    return out;
  }

  function parseFlexText(text) {
    const lines = String(text || "")
      .split(/\n/)
      .map((line) => normalizeAddress(line).replace(/[|｜]/g, " ").replace(/：/g, ":").replace(/[〇○●□]/g, " ").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const stops = [];
    let cur = null;
    let pendingId = null;
    let pendingCurrent = false;

    function push() {
      if (cur && cur.address) stops.push(cur);
      cur = null;
    }

    lines.forEach((line) => {
      if (/次の目的地/.test(line)) {
        const m = line.match(/(\d{1,3})/);
        if (m) pendingId = Number(m[1]);
        pendingCurrent = true;
        return;
      }
      if (/^#/.test(line) || /G\.?\s*L/i.test(line) || /^[0-9]G$/.test(line) || line === "人") return;
      const tm = line.match(/(\d{1,2}:\d{2})\s*[-–ー~〜]\s*(\d{1,2}:\d{2})/);
      if (tm) {
        push();
        const idIn = line.match(/(?:^|\s)(\d{1,3})(?:\s|$)/);
        cur = {
          id: pendingId != null ? pendingId : (idIn ? Number(idIn[1]) : null),
          windowStart: tm[1].padStart(5, "0"),
          windowEnd: tm[2].padStart(5, "0"),
          address: "",
          current: pendingCurrent,
        };
        pendingId = null;
        pendingCurrent = false;
        return;
      }
      const onlyId = line.match(/^(\d{1,3})$/);
      if (onlyId) {
        pendingId = Number(onlyId[1]);
        return;
      }
      if (!looksLikeAddress(line) && !(cur && cur.address && /[棟号]/.test(line) && /\d/.test(line))) return;
      if (!cur) {
        cur = { id: pendingId, windowStart: null, windowEnd: null, address: "" };
        pendingId = null;
      }
      if (!looksLikeAddress(line) && !cur.address) return;
      cur.address = normalizeAddress((cur.address + " " + line).trim());
    });
    push();

    for (let i = 0; i < stops.length; i++) {
      if (stops[i].id != null) continue;
      const prev = i > 0 ? stops[i - 1].id : null;
      const next = stops.slice(i + 1).find((s) => s.id != null);
      if (prev != null && next && next.id === prev + 2) stops[i].id = prev + 1;
    }
    return stops.map((s) => Object.assign({}, s, {
      address: normalizeAddress(s.address),
      windowEndMin: clockToMin(s.windowEnd),
      windowStartMin: clockToMin(s.windowStart),
    }));
  }

  function bearing(a, b) {
    const y = Math.sin(((b.lon - a.lon) * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180);
    const x = Math.cos((a.lat * Math.PI) / 180) * Math.sin((b.lat * Math.PI) / 180)
      - Math.sin((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.cos(((b.lon - a.lon) * Math.PI) / 180);
    return Math.atan2(y, x);
  }

  function turnPenaltyMin(h1, h2) {
    if (h1 == null || h2 == null) return 0;
    let d = h2 - h1;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    const deg = (d * 180) / Math.PI;
    if (deg > 40 && deg < 160) return 0.45;
    if (Math.abs(deg) >= 160) return 0.7;
    return 0;
  }

  function routeDriveCost(route, start, departMin, restriction, serviceMin, endMin) {
    let cost = 0;
    let prev = start && start.lat != null ? start : null;
    let heading = null;
    let t = departMin;
    route.forEach((s) => {
      if (prev) {
        const drive = driveMin(prev, s, t, restriction);
        const h = bearing(prev, s);
        const pen = turnPenaltyMin(heading, h);
        cost += drive + pen;
        t += drive + serviceMin;
        heading = h;
        if (s.windowEndMin != null && t > s.windowEndMin) cost += (t - s.windowEndMin) * 3;
        if (endMin != null && t > endMin) cost += (t - endMin) * 2;
      }
      prev = s;
    });
    return cost;
  }

  function fastestOrder(stops, start, departMin, restriction, serviceMin, endMin) {
    if (stops.length <= 1) return stops.slice();
    const left = stops.slice();
    const route = [];
    let prev = start && start.lat != null ? start : null;
    let heading = null;
    let t = departMin;
    while (left.length) {
      let bestI = 0;
      let bestC = Infinity;
      left.forEach((s, i) => {
        const drive = prev ? driveMin(prev, s, t, restriction) : 0;
        const h = prev ? bearing(prev, s) : null;
        const c = drive + turnPenaltyMin(heading, h);
        if (c < bestC) { bestC = c; bestI = i; }
      });
      const s = left.splice(bestI, 1)[0];
      if (prev) {
        const h = bearing(prev, s);
        t += driveMin(prev, s, t, restriction) + serviceMin;
        heading = h;
      }
      route.push(s);
      prev = s;
    }
    let best = route;
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 0; i < best.length - 1; i++) {
        for (let k = i + 1; k < best.length; k++) {
          const next = best.slice(0, i).concat(best.slice(i, k + 1).reverse(), best.slice(k + 1));
          if (routeDriveCost(next, start, departMin, restriction, serviceMin, endMin) + 0.05
            < routeDriveCost(best, start, departMin, restriction, serviceMin, endMin)) {
            best = next;
            improved = true;
          }
        }
      }
    }
    return best;
  }

  function planDay(stops, options) {
    const opts = options || {};
    const restriction = opts.restriction || SCHOOL_RESTRICTION;
    const serviceMin = opts.serviceMin == null ? 1.3 : opts.serviceMin;
    const areas = opts.areas || [];
    const here = opts.here || null;
    const depart = opts.departMin == null ? 5 * 60 : opts.departMin;

    const endMin = opts.endMin == null ? null : opts.endMin;
    const must = [];
    const congestion = [];
    const later = [];
    stops.forEach((s) => {
      if (s.windowEndMin != null && s.windowEndMin <= restriction.endMin) must.push(s);
      else if (areas.some((a) => inArea(s, a))) congestion.push(s);
      else later.push(s);
    });

    const groups = [must, congestion, later];
    const ordered = [];
    let cursor = here;
    let clock = depart;
    groups.forEach((group) => {
      if (!group.length) return;
      const blockAllowsWait = endMin == null || endMin > restriction.endMin;
      const canWait = blockAllowsWait && group.every((s) => s.windowEndMin == null || s.windowEndMin > restriction.endMin);
      if (canWait && inRestriction(clock, restriction)) clock = restriction.endMin;
      const part = fastestOrder(group, cursor, clock, restriction, serviceMin, endMin);
      part.forEach((s) => {
        ordered.push(s);
        if (cursor && cursor.lat != null) clock += driveMin(cursor, s, clock, restriction);
        clock += serviceMin;
        cursor = s;
      });
    });

    const timed = [];
    let t = depart;
    let prev = here;
    ordered.forEach((s) => {
      const drive = prev && prev.lat != null ? driveMin(prev, s, t, restriction) : 0;
      let arrive = t + drive;
      const blockAllowsWait = endMin == null || endMin > restriction.endMin;
      const canWait = blockAllowsWait && (s.windowEndMin == null || s.windowEndMin > restriction.endMin);
      const prioritized = areas.some((a) => inArea(s, a));
      if (canWait && !prioritized && inRestriction(arrive, restriction)) {
        t = restriction.endMin;
        arrive = t + (prev && prev.lat != null ? driveMin(prev, s, t, restriction) : 0);
      }
      const finish = arrive + serviceMin;
      timed.push(Object.assign({}, s, {
        arriveMin: arrive,
        driveMin: drive,
        inRestriction: inRestriction(arrive, restriction),
        missesWindow: s.windowEndMin != null && finish > s.windowEndMin,
        missesEnd: endMin != null && finish > endMin,
      }));
      t = finish;
      prev = s;
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
    parseFlexText,
    normalizeAddress,
    streetQuery,
    geocodeCandidates,
    looksLikeAddress,
  };
});
