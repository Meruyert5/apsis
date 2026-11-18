import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const data = (name: string) =>
  JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));
const repo = (path: string) =>
  JSON.parse(readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8"));

const index = data("index.json");
const games = data("games-studio.json");
const commands = data("commands.json");
const alert = repo("cases/01-observed-path/alert.json");
const evidence = repo("cases/01-observed-path/evidence.json");

test("fleet totals match the ship contract", () => {
  assert.equal(index.totals.fixtures, 16);
  assert.equal(index.totals.identities, 194);
  assert.equal(index.totals.edges, 163);
  assert.equal(index.totals.routes, 144);
  assert.equal(index.scenarios.length, 16);
  assert.equal(index.scenarios.reduce((sum, item) => sum + item.stats.routes, 0), 144);
});

test("the signature route is seven hops from Tools intern to the administrator", () => {
  const route = games.signature;
  assert.ok(route);
  assert.equal(route.hops, 7);
  assert.equal(route.labels[0], "Tools intern");
  assert.equal(route.labels.at(-1), "Administrator");
  assert.equal(route.edges.length, 7);
});

test("every fixture closes after the minimum cut", () => {
  for (const scenario of index.scenarios) {
    assert.equal(scenario.sever.routesAfter, 0, scenario.key);
    assert.equal(scenario.sever.closed, true, scenario.key);
  }
  assert.equal(index.scenarios.reduce((sum, item) => sum + item.sever.routesAfter, 0), 0);
});

test("the command library is complete and recorded", () => {
  assert.equal(commands.records.length, 114);
  assert.equal(new Set(commands.records.map((record: { verb: string }) => record.verb)).size, 4);
  assert.ok(commands.records.every((record: { output: string }) => record.output.length > 0));
});

test("the observed alert and evidence agree", () => {
  assert.equal(alert.schema, "penumbra.alert/v1");
  assert.equal(alert.kind, "path.opened");
  assert.equal(alert.account, "555566667777");
  assert.equal(alert.route.length, alert.edges.length + 1);
  assert.deepEqual(evidence.edges.map((edge: { id: string }) => edge.id), alert.edges);
  assert.ok(evidence.edges.every((edge: { observed: boolean }) => edge.observed));
});
