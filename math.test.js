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
