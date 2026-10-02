/* Each prize percentage is conditional on passing the global chance gate.
 * The remaining probability always pays zero; percentages are never normalized.
 */
(function (root) {
  const SOURCE_SIZE = 6000000;
  const sourcePrizes = [
    { amount: 50000000, count: 1 },
    { amount: 1000000, count: 20 },
    { amount: 100000, count: 140 },
    { amount: 50000, count: 400 },
    { amount: 20000, count: 2500 },
    { amount: 15000, count: 4000 },
    { amount: 10000, count: 6000 },
    { amount: 7000, count: 8000 },
    { amount: 6000, count: 25000 },
    { amount: 5000, count: 60000 },
    { amount: 4000, count: 120000 },
    { amount: 3000, count: 240000 },
    { amount: 2000, count: 540000 },
    { amount: 1000, count: 960000 },
  ];

  function validate(config) {
    if (
      !Number.isFinite(config.winChance) ||
      config.winChance < 0 ||
      config.winChance > 100
    ) {
      throw new Error("A nyerési esély 0 és 100% között legyen.");
    }
    if (
      !Number.isInteger(config.quantity) ||
      config.quantity < 1 ||
      config.quantity > 1000000
    ) {
      throw new Error("A darabszám 1 és 1 000 000 közötti egész szám legyen.");
    }
    if (
      !Number.isFinite(config.price) ||
      config.price < 0 ||
      config.price > 1e12
    ) {
      throw new Error("A darabár 0 és 1 000 000 000 000 $ között legyen.");
    }
    for (const prize of config.prizes) {
      if (
        !Number.isFinite(prize.amount) ||
        prize.amount < 0 ||
        prize.amount > 1e12 ||
        !Number.isFinite(prize.chance) ||
        prize.chance < 0 ||
        prize.chance > 100
      ) {
        throw new Error(
          "Minden összeg legyen 0 és 1 000 000 000 000 $ között, az esély pedig 0 és 100% között.",
        );
      }
    }
    const total = config.prizes.reduce((sum, prize) => sum + prize.chance, 0);
    if (total > 100 + 1e-10)
      throw new Error(
        "A nyeremények összesített esélye nem lehet több 100%-nál.",
      );
    return total;
  }

  function expected(config) {
    const total = validate(config);
    const gate = config.winChance / 100;
    const perTicket = config.prizes.reduce(
      (sum, prize) => sum + ((prize.amount * prize.chance) / 100) * gate,
      0,
    );
    const revenue = config.quantity * config.price;
    const payout = config.quantity * perTicket;
    return {
      revenue,
      payout,
      net: revenue - payout,
      total,
      effectiveChance: total * gate,
      winners: total * gate,
      losers: 100 - total * gate,
      profit: Math.max(0, revenue - payout),
      loss: Math.max(0, payout - revenue),
    };
  }

  function simulate(config, random = Math.random) {
    const forecast = expected(config);
    const counts = config.prizes.map(() => 0);
    let payout = 0;
    let winners = 0;
    for (let ticket = 0; ticket < config.quantity; ticket++) {
      const draw = random() * 100;
      let cumulative = 0;
      for (let index = 0; index < config.prizes.length; index++) {
        const prize = config.prizes[index];
        cumulative += (prize.chance * config.winChance) / 100;
        if (draw < cumulative) {
          counts[index]++;
          payout += prize.amount;
          winners++;
          break;
        }
      }
    }
    const net = forecast.revenue - payout;
    return {
      payout,
      winners,
      counts,
      net,
      profit: Math.max(0, net),
      loss: Math.max(0, -net),
    };
  }

  function analyze(config) {
    const forecast = expected(config);
    const gate = config.winChance / 100;
    const chanceFor = (predicate) =>
      config.prizes.reduce(
        (sum, prize) =>
          sum + (predicate(prize.amount) ? prize.chance * gate : 0),
        0,
      );
    const mean = forecast.payout / config.quantity;
    const secondMoment = config.prizes.reduce(
      (sum, prize) => sum + ((prize.amount ** 2 * prize.chance) / 100) * gate,
      0,
    );
    return {
      ...forecast,
      perTicket: mean,
      rtp: config.price > 0 ? (mean / config.price) * 100 : null,
      payoutChance: chanceFor((amount) => amount > 0),
      refundChance: chanceFor(
        (amount) => amount === config.price && amount > 0,
      ),
      gainChance: chanceFor((amount) => amount > config.price),
      standardDeviation: Math.sqrt(
        Math.max(0, secondMoment - mean ** 2) * config.quantity,
      ),
    };
  }

  function design({ price, maxPrize, margin, hitChance, jackpotEvery }) {
    if (
      !Number.isFinite(price) ||
      price < 1 ||
      price > 1e9 ||
      !Number.isFinite(maxPrize) ||
      maxPrize <= price ||
      maxPrize > 50000
    ) {
      throw new Error(
        "A jegyár legalább 1 $, a főnyeremény a jegyárnál nagyobb, legfeljebb 50 000 $ legyen.",
      );
    }
    if (
      !Number.isFinite(margin) ||
      margin < 0 ||
      margin > 60 ||
      !Number.isFinite(hitChance) ||
      hitChance <= 0 ||
      hitChance > 100 ||
      !Number.isFinite(jackpotEvery) ||
      jackpotEvery <= 1 ||
      jackpotEvery > 1e12
    ) {
      throw new Error(
        "A profitcél 0–60% között, a találati esély 0 fölött és legfeljebb 100%, a főnyeremény átlagos gyakorisága 1-nél nagyobb legyen.",
      );
    }
    const jackpotProbability = 1 / jackpotEvery;
    const remainingProbability = hitChance / 100 - jackpotProbability;
    if (remainingProbability <= 0) {
      throw new Error(
        "A főnyeremény esélye legyen kisebb az összes találat esélyénél.",
      );
    }
    // Compress the source prize range logarithmically, preserving its ordering.
    // Source counts supply the starting weights; the budget then adjusts them.
    const sourceMin = Math.min(...sourcePrizes.map((prize) => prize.amount));
    const sourceMax = Math.max(...sourcePrizes.map((prize) => prize.amount));
    const grouped = new Map();
    for (const prize of sourcePrizes.filter(
      (prize) => prize.amount < sourceMax,
    )) {
      const position =
        Math.log(prize.amount / sourceMin) / Math.log(sourceMax / sourceMin);
      const mapped = price * (maxPrize / price) ** position;
      const amount = Math.max(
        price,
        Math.min(
          maxPrize - Math.min(1, (maxPrize - price) / 2),
          Math.round(mapped),
        ),
      );
      grouped.set(amount, (grouped.get(amount) || 0) + prize.count);
    }
    const tiers = [...grouped]
      .map(([amount, weight]) => ({ amount, weight }))
      .sort((a, b) => a.amount - b.amount);
    const budget = price * (1 - margin / 100);
    const meanNeeded =
      (budget - maxPrize * jackpotProbability) / remainingProbability;
    const minBudget =
      maxPrize * jackpotProbability + remainingProbability * tiers[0].amount;
    const maxBudget =
      maxPrize * jackpotProbability +
      remainingProbability * tiers.at(-1).amount;
    if (budget < minBudget - 1e-8 || budget > maxBudget + 1e-8) {
      throw new Error(
        `Ezek a célok együtt nem teljesíthetők. A megadott találati és főnyeremény-esély mellett a kifizetés jegyenként ${minBudget.toFixed(2)}–${maxBudget.toFixed(2)} $ lehet. Módosítsd a profitcélt, a találati esélyt vagy a főnyeremény gyakoriságát.`,
      );
    }
    function distribution(tilt) {
      const scores = tiers.map(
        (tier) => Math.log(tier.weight) + tilt * Math.log(tier.amount / price),
      );
      const maximum = Math.max(...scores);
      const weights = scores.map((score) => Math.exp(score - maximum));
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      return weights.map((weight) => weight / total);
    }
    let probabilities;
    if (meanNeeded <= tiers[0].amount) {
      probabilities = tiers.map((_, index) => (index === 0 ? 1 : 0));
    } else if (meanNeeded >= tiers.at(-1).amount) {
      probabilities = tiers.map((_, index) =>
        index === tiers.length - 1 ? 1 : 0,
      );
    } else {
      let low = -10000;
      let high = 10000;
      for (let iteration = 0; iteration < 160; iteration++) {
        const middle = (low + high) / 2;
        probabilities = distribution(middle);
        const mean = tiers.reduce(
          (sum, tier, index) => sum + tier.amount * probabilities[index],
          0,
        );
        if (mean < meanNeeded) low = middle;
        else high = middle;
      }
    }
    const prizes = tiers
      .map((tier, index) => ({
        amount: tier.amount,
        chance: probabilities[index] * remainingProbability * 100,
      }))
      .filter((prize) => prize.chance > 0);
    prizes.push({ amount: maxPrize, chance: jackpotProbability * 100 });
    const config = {
      price,
      quantity: 1000,
      winChance: 100,
      prizes: prizes.reverse(),
    };
    validate(config);
    return config;
  }

  const api = {
    SOURCE_SIZE,
    sourcePrizes,
    validate,
    expected,
    simulate,
    analyze,
    design,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.LotteryMath = api;
})(globalThis);
