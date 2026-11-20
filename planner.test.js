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

const insideBlock = p.planDay([later], { departMin: 8 * 60, endMin: 8 * 60 + 30 });
assert.ok(insideBlock[0].arriveMin < 9 * 60, "終了が9時前なら規制中でも回る");

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

const sample = `| 9 | 次の目的地
〇 スケジュール済み 04:00 - 07:59
# G.LO1.0V                                     1G
福岡県紅葉ヶ丘西 6-1-1 C-102 コモンシテ
イィ紅葉ヶ丘西C棟 102
 〇 スケジュール済み 04:00 - 07:59
# G.LO1.0V                                     1G
春日市紅葉ケ丘西 2-78
|11| 〇 スケジュール済み 04:00 - 07:59
# G.LO1.0V                                     1G
春日市一の谷 4丁目94-2
| 12| 〇 スケジュール済み 04:00 - 07:59
# G.LO1.0V                                     1G
春日市天神山 4-117
人`;
const parsed = p.parseFlexText(sample);
assert.deepStrictEqual(parsed.map((s) => s.id), [9, 10, 11, 12]);
assert.ok(parsed[0].address.includes("6-1-1"));
const ken = p.parseFlexText("スケジュール済み 04:00 - 07:59\n福岡県紅葉ヶ丘西 6B-1-1 C-102 コモンシテ\n");
assert.strictEqual(ken.length, 1);
assert.ok(p.streetQuery(ken[0].address).includes("紅葉ヶ丘西6-1-1"), p.streetQuery(ken[0].address));
const wide = p.parseFlexText("スケジュール済み 04:00 - 07:59\n春日市天神山４－１１７\n");
assert.strictEqual(wide.length, 1);
assert.ok(p.streetQuery(wide[0].address).includes("天神山4-117"), p.streetQuery(wide[0].address));
const withStation = p.parseFlexText("Logiport福岡南\nスケジュール済み 04:00 - 07:59\n福岡市博多区光丘町1丁目1\nスケジュール済み 04:00 - 07:59\n春日市天神山 4-117\nスケジュール済み 04:00 - 07:59\n柏屋町江辻84C\n");
assert.deepStrictEqual(withStation.map((s) => s.address), ["Logiport福岡南", "福岡市博多区光丘町1丁目1", "春日市天神山 4-117", "柏屋町江辻84C"]);
const middle = p.withoutTerminalStops(withStation);
assert.deepStrictEqual(middle.map((s) => s.address), ["福岡市博多区光丘町1丁目1", "春日市天神山 4-117"]);
const keptEtsuji = p.withoutTerminalStops(p.parseFlexText("Logiport福岡南\nスケジュール済み 05:00 - 21:00\n春日市柏屋町江辻1丁目2-3\nスケジュール済み 05:00 - 21:00\n柏屋町江辻84C\n"));
assert.strictEqual(keptEtsuji.length, 1);
assert.ok(keptEtsuji[0].address.includes("江辻1丁目2-3"), keptEtsuji.map((s) => s.address).join(" | "));
const screen = p.parseFlexText("# S.L02.0V\n福岡市 博多区 光丘町1丁目1\n0 22:52に配達を完了\nLogiport福岡南\n");
assert.strictEqual(screen.length, 2, JSON.stringify(screen));
assert.ok(screen[0].address.includes("光丘町1丁目1"), screen[0].address);
assert.ok(/logiport/i.test(screen[1].address), screen[1].address);
assert.strictEqual(p.withoutTerminalStops(screen).length, 0);
const sameLine = p.parseFlexText("# S.L02.0V 福岡市 博多区 光丘町1丁目1 Logiport福岡南\n");
assert.strictEqual(sameLine.length, 1);
assert.ok(sameLine[0].address.includes("光丘町1丁目1"), sameLine[0].address);
assert.ok(!/logiport/i.test(sameLine[0].address), sameLine[0].address);
assert.strictEqual(p.withoutTerminalStops([{ address: "Logiport福岡南" }]).length, 0);
assert.strictEqual(p.withoutTerminalStops(parsed).map((s) => s.id).join(","), "10,11");
assert.strictEqual(p.tooCoarse("福岡県紅葉ヶ丘西6-1-1", "福岡県"), true);
assert.strictEqual(p.tooCoarse("紅葉ヶ丘西6-1-1", "春日市紅葉ヶ丘西六丁目"), false);
assert.ok(parsed[1].address.includes("2-78"));
assert.strictEqual(parsed[1].address.includes("ヶ丘"), true);
assert.ok(parsed[2].address.includes("94-2"));
assert.ok(parsed[3].address.includes("4-117"));
assert.strictEqual(parsed[0].windowEnd, "07:59");
assert.strictEqual(parsed[0].current, true);
assert.strictEqual(parsed[1].current, false);
assert.ok(!p.streetQuery(parsed[0].address).includes("コモン"));
parsed.forEach((s) => console.log("parsed", s.id, p.streetQuery(s.address)));

console.log("planner tests ok");
