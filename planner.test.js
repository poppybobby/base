const assert = require("assert");
const p = require("./planner.js");

const N = { id: "N", address: "北", lat: 1, lon: 0 };
const E = { id: "E", address: "東", lat: 0, lon: 1 };
const S = { id: "S", address: "南", lat: -1, lon: 0 };
const W = { id: "W", address: "西", lat: 0, lon: -1 };

const ccw = p.orderCounterclockwise([N, E, S, W], N).map((s) => s.id);
assert.deepStrictEqual(ccw, ["N", "W", "S", "E"], "左回りは北から西、南、東");

const stops = [
  { id: 1, address: "福岡市中央区大名1丁目", lat: 33.589, lon: 130.392 },
  { id: 2, address: "福岡市中央区赤坂2丁目", lat: 33.58, lon: 130.39 },
  { id: 3, address: "福岡市中央区警固1丁目", lat: 33.585, lon: 130.395 },
  { id: 4, address: "福岡市中央区平尾1丁目", lat: 33.574, lon: 130.403 },
  { id: 5, address: "福岡市中央区赤坂3丁目", lat: 33.579, lon: 130.388 },
];
const ordered = p.orderRoute(stops, {
  areas: [{ name: "赤坂" }, { name: "警固" }],
  here: { lat: 33.59, lon: 130.4 },
});
assert.deepStrictEqual(ordered.slice(0, 2).map((s) => s.id).sort(), [2, 5]);
assert.strictEqual(ordered[2].id, 3);
assert.deepStrictEqual(ordered.slice(3).map((s) => s.id).sort(), [1, 4]);

const byPoint = p.orderRoute(
  [
    { id: "in", address: "別の町", lat: 33.58, lon: 130.39 },
    { id: "out", address: "遠い", lat: 33.7, lon: 130.5 },
  ],
  { areas: [{ name: "赤坂", lat: 33.58, lon: 130.39, radiusM: 800 }] }
);
assert.strictEqual(byPoint[0].id, "in");

const legs = p.chunkLegs(Array.from({ length: 25 }, (_, i) => ({ id: i, lat: i, lon: i })), 10);
assert.strictEqual(legs.length, 3);
assert.strictEqual(legs[0][0].id, 0);
assert.strictEqual(legs[0][9].id, 9);
assert.strictEqual(legs[1][0].id, 9);
assert.strictEqual(legs[2][legs[2].length - 1].id, 24);
legs.forEach((leg) => {
  const mid = leg.slice(1, -1);
  assert.ok(mid.length <= 8);
});

const url = p.mapsUrl(legs[0], true);
assert.ok(url.includes("dir_action=navigate"));
assert.ok(url.includes("travelmode=driving"));
assert.ok(!url.includes("origin="));
assert.strictEqual((url.match(/waypoints=/) || []).length, 1);
const url2 = p.mapsUrl(legs[1], false);
assert.ok(url2.includes("origin="));

assert.deepStrictEqual(p.parseAreaNames("赤坂、警固\n天神 平尾"), ["赤坂", "警固", "天神", "平尾"]);

const early = { id: "early", address: "締切が朝", lat: 33.52, lon: 130.45, windowEndMin: 7 * 60 + 59 };
const later = { id: "later", address: "締切が夜", lat: 33.53, lon: 130.46, windowEndMin: 21 * 60 };
const atEight = p.planDay([later, early], { departMin: 8 * 60 });
assert.strictEqual(atEight[0].id, "early");
assert.strictEqual(atEight[0].inRestriction, true);
assert.ok(atEight[1].arriveMin >= 9 * 60, "9時まで待てる件は規制のあと");
assert.strictEqual(atEight[1].inRestriction, false);

const beforeSeven = p.planDay([later], { departMin: 6 * 60 });
assert.ok(beforeSeven[0].arriveMin < 7 * 60);
assert.strictEqual(beforeSeven[0].inRestriction, false);

const kasuga = p.planDay([
  { id: 9, address: "春日市紅葉ヶ丘西6-1-1", lat: 33.522453, lon: 130.454285, windowEndMin: 7 * 60 + 59 },
  { id: 10, address: "春日市紅葉ヶ丘西2-78", lat: 33.521805, lon: 130.455276, windowEndMin: 7 * 60 + 59 },
  { id: 11, address: "春日市一の谷4丁目94-2", lat: 33.520412, lon: 130.448502, windowEndMin: 7 * 60 + 59 },
  { id: 12, address: "春日市天神山4-117", lat: 33.515583, lon: 130.450897, windowEndMin: 7 * 60 + 59 },
], { departMin: 5 * 60 + 13, here: { lat: 33.522453, lon: 130.454285 } });
kasuga.forEach((s) => {
  assert.ok(s.arriveMin < 7 * 60, s.id + " は7時前");
  console.log(s.id, p.formatMin(s.arriveMin), "drive", s.driveMin.toFixed(1));
});

console.log("planner tests ok");
