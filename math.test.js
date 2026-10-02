const assert = require("node:assert/strict");
const math = require("./math.js");
const sample = math.scaleSample();
assert.equal(
  sample.reduce((sum, prize) => sum + prize.originalCount, 0),
  6000000,
);
assert.equal(
  sample.reduce((sum, prize) => sum + prize.count, 0),
  100,
);
assert.equal(sample.find((prize) => prize.amount === 0).count, 67);
assert.equal(sample.find((prize) => prize.amount === 50000000).count, 0);
assert.ok(sample.every((prize) => Number.isInteger(prize.count)));

const config = {
  price: 1100,
  quantity: 100,
  mode: "pack",
  prizes: sample.filter((prize) => prize.amount > 0 && prize.count > 0),
};
const expected = math.expected(config);
assert.equal(expected.packPayout, 65000);
assert.equal(expected.revenue, 110000);
assert.equal(expected.profit, 45000);
assert.equal(expected.loss, 0);
for (const quantity of [100, 200, 1000]) {
  for (const random of [() => 0, () => 0.999999, Math.random]) {
    const result = math.simulate({ ...config, quantity }, random);
    assert.equal(result.payout, (65000 * quantity) / 100);
    assert.equal(result.winners, (33 * quantity) / 100);
    assert.deepEqual(
      result.counts,
      config.prizes.map((prize) => (prize.count * quantity) / 100),
    );
  }
}
const partial = math.simulate({ ...config, quantity: 37 });
assert.ok(partial.winners <= 33);
assert.ok(
  partial.counts.every((count, index) => count <= config.prizes[index].count),
);
assert.equal(
  partial.payout,
  partial.counts.reduce(
    (sum, count, index) => sum + count * config.prizes[index].amount,
    0,
  ),
);
assert.equal(
  math.simulate({ ...config, mode: "independent" }, () => 0).loss,
  490000,
);
assert.equal(
  math.simulate({ ...config, mode: "independent" }, () => 0.99).profit,
  110000,
);
assert.equal(math.simulate({ ...config, prizes: [] }).payout, 0);
assert.equal(
  math.simulate({ ...config, prizes: [{ amount: 2000, count: 100 }] }).loss,
  90000,
);
for (const invalid of [
  { ...config, price: 1100.5 },
  { ...config, quantity: 0 },
  { ...config, prizes: [{ amount: 1000, count: 101 }] },
  { ...config, prizes: [{ amount: 1000, count: 0.5 }] },
  {
    ...config,
    prizes: [
      { amount: 1000, count: 60 },
      { amount: 2000, count: 50 },
    ],
  },
])
  assert.throws(() => math.validate(invalid));
console.log(
  "Passed: sample, exact packs, partial packs, independent draws, profit/loss, integer validation.",
);
