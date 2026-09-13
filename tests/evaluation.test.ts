import { describe, expect, it } from "vitest";
import { bucketOf, evaluate } from "@/lib/feature-flags/evaluation";

const flag = { name: "instant-payouts", enabled: true, rolloutPercentage: 50 };

describe("flag evaluation", () => {
  it("is off when the flag does not exist or is disabled", () => {
    expect(evaluate(null, { userKey: "acct_1" })).toEqual({
      enabled: false,
      reason: "flag_missing",
    });
    expect(evaluate({ ...flag, enabled: false }, { userKey: "acct_1" })).toEqual({
      enabled: false,
      reason: "flag_disabled",
    });
  });

  it("is all-or-nothing at 0% and 100%", () => {
    const subjects = ["acct_1", "acct_2", "acct_3", "acct_4"];
    for (const userKey of subjects) {
      expect(evaluate({ ...flag, rolloutPercentage: 0 }, { userKey }).enabled).toBe(false);
      expect(evaluate({ ...flag, rolloutPercentage: 100 }, { userKey }).enabled).toBe(true);
    }
  });

  it("keeps a subject in the same bucket across calls", () => {
    const first = bucketOf(flag.name, "acct_1");
    expect(bucketOf(flag.name, "acct_1")).toBe(first);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(100);
  });

  it("only ever adds subjects as the rollout percentage grows", () => {
    const userKey = "acct_42";
    const bucket = bucketOf(flag.name, userKey);
    expect(evaluate({ ...flag, rolloutPercentage: bucket }, { userKey }).enabled).toBe(false);
    expect(evaluate({ ...flag, rolloutPercentage: bucket + 1 }, { userKey }).enabled).toBe(
      true,
    );
  });

  it("buckets the same subject differently per flag", () => {
    const buckets = new Set(
      ["a-flag", "b-flag", "c-flag", "d-flag"].map((name) => bucketOf(name, "acct_1")),
    );
    expect(buckets.size).toBeGreaterThan(1);
  });
});
