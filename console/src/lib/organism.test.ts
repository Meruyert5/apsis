import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildOrganism } from "./organism.ts";
import type { Bundle } from "./types.ts";

function load(name: string): Bundle {
  const url = new URL(`../data/${name}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as Bundle;
}

const games = buildOrganism(load("games-studio"));
const clean = buildOrganism(load("ci-cd"));
const multi = buildOrganism(load("enterprise"));

test("depth follows the reverse escalations", () => {
  assert.equal(games.depth.get("__admin__"), 0);
  assert.equal(games.depth.get("gs-backup"), 1);
  assert.equal(games.depth.get("gs-intern"), 7);
  assert.equal(games.maxDepth, 7);
});

test("the signature route is seven hops from Tools intern to the administrator", () => {
  const route = games.routeFor("gs-intern");
  assert.ok(route);
  assert.equal(route.hops, 7);
  assert.equal(route.nodes[0], "gs-intern");
  assert.equal(route.nodes.at(-1), "__admin__");
  assert.deepEqual(
    route.nodes.map((id) => games.nodeById.get(id)?.label),
    [
      "Tools intern",
      "Build role",
      "Art pipeline role",
      "Game server role",
      "Live services role",
      "Live-ops engineer",
      "Backup role",
      "Administrator",
    ],
  );
});

test("a direct administrator route is one hop", () => {
  const route = games.routeFor("gs-support");
  assert.ok(route);
  assert.equal(route.hops, 1);
  assert.equal(route.nodes.at(-1), "gs-admin");
});

test("administrators have no route to themselves", () => {
  assert.equal(games.routeFor("__admin__"), null);
});

test("nine principals reach an administrator", () => {
  assert.equal(games.principals.length, 9);
  assert.deepEqual(
    games.principals.map((item) => item.route.hops),
    [1, 1, 2, 3, 4, 5, 6, 7, 7],
  );
});

test("the spiral spine descends from the outer ring to the nucleus", () => {
  const signature = load("games-studio").signature?.nodes ?? [];
  const angles = signature
    .map((id) => {
      const point = games.positions.get(id);
      assert.ok(point, id);
      return {
        depth: games.depth.get(id) ?? 0,
        angle: ((Math.atan2(point.y, point.x) * 180) / Math.PI + 360) % 360,
      };
    })
    .filter((item) => item.depth > 0)
    .sort((a, b) => b.depth - a.depth);
  for (let i = 1; i < angles.length; i += 1) {
    assert.ok(
      angles[i].angle < angles[i - 1].angle,
      `${angles[i].depth} should sit clockwise of ${angles[i - 1].depth}`,
    );
  }
});

test("every cell has a finite position", () => {
  for (const node of load("games-studio").nodes) {
    const point = games.positions.get(node.id);
    assert.ok(point, node.id);
    assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
  }
  assert.ok(games.maxRadius > 300);
});

test("a clean account has no principals and no routes", () => {
  assert.equal(clean.principals.length, 0);
  assert.equal(clean.routeFor("ci-pipeline"), null);
  assert.ok(clean.admins.length > 0);
  for (const node of load("ci-cd").nodes) {
    assert.ok(clean.positions.has(node.id));
  }
});

test("multiple administrators become one nucleus with separate lobes", () => {
  assert.equal(multi.admins.length, 4);
  const points = multi.admins.map((id) => multi.positions.get(id));
  for (const point of points) {
    assert.ok(point);
    assert.ok(Math.hypot(point.x, point.y, point.z) <= 20);
  }
  const unique = new Set(points.map((point) => `${point?.x.toFixed(2)}:${point?.y.toFixed(2)}`));
  assert.equal(unique.size, 4);
});
