// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mergeOne } from "../merge-mayers-person";

type Row = Record<string, any>;
function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === "OR") return value.some((clause: Row) => matches(row, clause));
    if (key === "personAId_personBId") return matches(row, value);
    if (typeof value === "object" && value !== null && "has" in value) return row[key].includes(value.has);
    return row[key] === value;
  });
}
function fixture(extra: Record<string, Row[]> = {}) {
  const rows: Record<string, Row[]> = {
    person: [
      { id: "z", slug: "keeper", displayName: "Keeper", altNames: [], shortBio: null, loreSummary: null, avatarUrl: null, youtubeChannelUrl: null },
      { id: "a", slug: "duplicate", displayName: "Duplicate", altNames: ["Alias"], shortBio: "bio", loreSummary: "lore", avatarUrl: "avatar", youtubeChannelUrl: "channel" },
    ],
    episodeGuest: [], episodeMentionedPerson: [], quote: [], personTopic: [], personLore: [],
    relatedPerson: [], relationshipEvent: [], personMedia: [], psychenomiconEntity: [], savedSearch: [],
    annotation: [], weeklyDigest: [], ...extra,
  };
  const calls: string[] = [];
  const client = Object.fromEntries(Object.keys(rows).map(model => [model, {
    findMany: async ({ where, select }: Row) => rows[model].filter(row => matches(row, where)).map(row =>
      select ? Object.fromEntries(Object.keys(select).map(key => [key, row[key]])) : { ...row }),
    findUnique: async ({ where, select }: Row) => {
      const row = rows[model].find(row => matches(row, where));
      return row && (select ? Object.fromEntries(Object.keys(select).map(key => [key, row[key]])) : { ...row });
    },
    update: async ({ where, data }: Row) => {
      const row = rows[model].find(row => matches(row, where));
      if (!row) throw new Error(`Missing ${model} row`);
      const next = { ...row, ...data };
      if (model === "relatedPerson" && rows[model].some(other => other !== row && other.personAId === next.personAId && other.personBId === next.personBId)) throw new Error("Duplicate pair");
      Object.assign(row, Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)));
      calls.push(`${model}.update`);
      return row;
    },
    updateMany: async ({ where, data }: Row) => {
      rows[model].filter(row => matches(row, where)).forEach(row => Object.assign(row, data));
      calls.push(`${model}.updateMany`);
    },
    delete: async ({ where }: Row) => {
      const index = rows[model].findIndex(row => matches(row, where));
      if (index < 0) throw new Error(`Missing ${model} row`);
      rows[model].splice(index, 1);
      calls.push(`${model}.delete`);
    },
  }]));
  return { rows, calls, run: (keepId = "z", dupeId = "a") => mergeOne(client as unknown as Parameters<typeof mergeOne>[0], keepId, "keeper", dupeId, "duplicate") };
}

describe("Mayers person merge", () => {
  it("repoints only person annotations before deleting the duplicate", async () => {
    const f = fixture({ annotation: [
      { id: "1", targetType: "person", targetId: "duplicate", body: "retain", votes: 3 },
      { id: "2", targetType: "episode", targetId: "duplicate" },
      { id: "3", targetType: "person", targetId: "other" },
    ] });
    await f.run();
    expect(f.rows.annotation).toEqual([
      { id: "1", targetType: "person", targetId: "keeper", body: "retain", votes: 3 },
      { id: "2", targetType: "episode", targetId: "duplicate" },
      { id: "3", targetType: "person", targetId: "other" },
    ]);
    expect(f.calls.indexOf("annotation.updateMany")).toBeLessThan(f.calls.indexOf("person.delete"));
  });
  it("backfills avatar/channel and existing profile fields", async () => {
    const f = fixture(); await f.run();
    expect(f.rows.person).toHaveLength(1);
    expect(f.rows.person[0]).toMatchObject({ avatarUrl: "avatar", youtubeChannelUrl: "channel", shortBio: "bio", loreSummary: "lore", altNames: ["Duplicate", "Alias"] });
  });
  it("preserves keeper metadata and fills missing fields independently", async () => {
    const f = fixture();
    Object.assign(f.rows.person[0], { avatarUrl: "keeper-avatar", shortBio: "keeper-bio" });
    await f.run();
    expect(f.rows.person[0]).toMatchObject({ avatarUrl: "keeper-avatar", youtubeChannelUrl: "channel", shortBio: "keeper-bio" });
  });
  it("preserves the keeper channel when the duplicate only supplies an avatar", async () => {
    const f = fixture(); f.rows.person[0].youtubeChannelUrl = "keeper-channel";
    await f.run();
    expect(f.rows.person[0]).toMatchObject({ avatarUrl: "avatar", youtubeChannelUrl: "keeper-channel" });
  });
  it.each([["a", "m", "z", "a"], ["m", "z", "a", "z"], ["m", "a", "z", "a"]])(
    "sorts related pair %s/%s when keeping %s", async (personAId, personBId, keep, dupe) => {
      const f = fixture({ relatedPerson: [{ personAId, personBId }] });
      await f.run(keep, dupe);
      expect(f.rows.relatedPerson).toEqual([{ personAId: [keep, "m"].sort()[0], personBId: [keep, "m"].sort()[1] }]);
    });
  it.each([
    [{ personAId: "m", personBId: "z" }],
    [{ personAId: "z", personBId: "m" }],
    [{ personAId: "m", personBId: "z" }, { personAId: "z", personBId: "m" }],
  ])("collapses existing related pairs in either orientation: %j", async (...existing) => {
    const f = fixture({ relatedPerson: [{ personAId: "a", personBId: "m" }, ...existing] });
    await f.run();
    expect(f.rows.relatedPerson).toEqual([{ personAId: "m", personBId: "z" }]);
  });
  it("collapses reversed duplicate pairs and removes self-references", async () => {
    const f = fixture({ relatedPerson: [
      { personAId: "a", personBId: "m" }, { personAId: "m", personBId: "a" },
      { personAId: "a", personBId: "z" }, { personAId: "z", personBId: "a" }, { personAId: "a", personBId: "a" },
    ] }); await f.run();
    expect(f.rows.relatedPerson).toEqual([{ personAId: "m", personBId: "z" }]);
  });
  it.each([["z", "a"], ["a", "z"]])("normalizes event endpoints keeping %s, preserving distinct events", async (keep, dupe) => {
    const f = fixture({ relationshipEvent: [
      { id: "1", personAId: dupe, personBId: "m", headline: "First", evidenceId: "e1" },
      { id: "2", personAId: "m", personBId: dupe, headline: "Second", evidenceId: "e2" },
      { id: "3", personAId: keep, personBId: dupe },
      { id: "4", personAId: dupe, personBId: keep },
      { id: "5", personAId: dupe, personBId: dupe },
      { id: "6", personAId: "b", personBId: "c", headline: "Unrelated" },
    ] }); await f.run(keep, dupe);
    const [personAId, personBId] = [keep, "m"].sort();
    expect(f.rows.relationshipEvent).toEqual([
      { id: "1", personAId, personBId, headline: "First", evidenceId: "e1" },
      { id: "2", personAId, personBId, headline: "Second", evidenceId: "e2" },
      { id: "6", personAId: "b", personBId: "c", headline: "Unrelated" },
    ]);
  });
});
