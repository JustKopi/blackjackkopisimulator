const assert = require("node:assert/strict");
const math = require("./math.js");
const config = {
  winChance: 50,
  quantity: 100,
  price: 10,
  prizes: [{ amount: 100, chance: 12.5 }],
};
assert.equal(math.expected(config).effectiveChance, 6.25);
assert.equal(math.expected(config).payout, 625);
assert.equal(math.simulate(config, () => 0.0624).winners, 100);
assert.equal(math.simulate(config, () => 0.0625).winners, 0);
assert.equal(math.simulate({ ...config, winChance: 0 }, () => 0).payout, 0);
assert.throws(() =>
  math.validate({ ...config, prizes: [{ amount: 1, chance: 101 }] }),
);
const prizes = math.sourcePrizes.map(({ amount, count }) => ({
  amount,
  chance: (count / math.SOURCE_SIZE) * 100,
}));
const source = { ...config, winChance: 100, quantity: 1000000, prizes };
const payout = math.sourcePrizes.reduce(
  (sum, prize) => sum + prize.amount * prize.count,
  0,
);
assert.ok(Math.abs(math.expected(source).payout - payout / 6) < 0.000001);
assert.ok(prizes[0].chance > 0 && prizes[0].chance < 0.001);
assert.equal(
  math.simulate({ ...source, quantity: 1 }, () => 0).payout,
  50000000,
);
console.log(
  "Math checks passed: fractional chances, global gate, original distribution and rare prize.",
);

const targets = {
  price: 1100,
  maxPrize: 50000,
  margin: 60,
  hitChance: 35,
  jackpotEvery: 10000,
};
for (const margin of [0, 20, 39.09, 60]) {
  const plan = math.design({ ...targets, margin });
  const forecast = math.analyze(plan);
  assert.ok(Math.abs(forecast.rtp - (100 - margin)) < 1e-8);
  assert.ok(Math.abs(forecast.payoutChance - 35) < 1e-8);
  assert.equal(plan.prizes[0].amount, 50000);
  assert.equal(plan.prizes[0].chance, 0.01);
  assert.ok(
    plan.prizes.every((prize) => prize.amount >= 1100 && prize.amount <= 50000),
  );
  assert.ok(Math.abs(forecast.refundChance + forecast.gainChance - 35) < 1e-8);
  assert.ok(forecast.standardDeviation > 0);
}
for (const change of [
  { margin: 61 },
  { hitChance: 80 },
  { jackpotEvery: 2 },
  { maxPrize: 50001 },
  { maxPrize: 1000 },
  { price: NaN },
  { hitChance: 0 },
]) {
  assert.throws(() => math.design({ ...targets, ...change }));
}
const simple = math.analyze({
  price: 10,
  quantity: 100,
  winChance: 100,
  prizes: [{ amount: 10, chance: 50 }],
});
assert.equal(simple.standardDeviation, 50);
assert.equal(simple.refundChance, 50);
assert.equal(simple.gainChance, 0);
assert.equal(simple.rtp, 50);
console.log(
  "Design checks passed: payout budget, jackpot cap, hit rate, infeasible targets and variance.",
);
