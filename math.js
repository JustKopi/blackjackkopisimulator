(function (root) {
  const PACK_SIZE = 100;
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

  function scaleSample() {
    const winningCount = sourcePrizes.reduce(
      (sum, prize) => sum + prize.count,
      0,
    );
    const source = [
      ...sourcePrizes,
      { amount: 0, count: SOURCE_SIZE - winningCount },
    ];
    const scaled = source.map((prize, index) => {
      const numerator = prize.count * PACK_SIZE;
      return {
        amount: prize.amount,
        originalCount: prize.count,
        count: Math.floor(numerator / SOURCE_SIZE),
        remainder: numerator % SOURCE_SIZE,
        index,
      };
    });
    const remaining =
      PACK_SIZE - scaled.reduce((sum, prize) => sum + prize.count, 0);
    const ranked = [...scaled].sort(
      (a, b) => b.remainder - a.remainder || a.index - b.index,
    );
    for (let index = 0; index < remaining; index++) ranked[index].count++;
    return scaled.map(({ amount, originalCount, count }) => ({
      amount,
      originalCount,
      count,
    }));
  }

  function validate(config) {
    if (
      !Number.isInteger(config.quantity) ||
      config.quantity < 1 ||
      config.quantity > 100000
    ) {
      throw new Error(
        "Az eladott jegyek száma 1 és 100 000 közötti egész szám legyen.",
      );
    }
    if (
      !Number.isInteger(config.price) ||
      config.price < 0 ||
      config.price > 1000000000
    ) {
      throw new Error("A jegyár 0 és 1 000 000 000 közötti egész szám legyen.");
    }
    if (!["pack", "independent"].includes(config.mode))
      throw new Error("Érvénytelen szimulációs mód.");
    if (!Array.isArray(config.prizes))
      throw new Error("Hiányzó nyereménylista.");
    let winners = 0;
    for (const prize of config.prizes) {
      if (
        !Number.isInteger(prize.amount) ||
        prize.amount < 1 ||
        prize.amount > 1000000000 ||
        !Number.isInteger(prize.count) ||
        prize.count < 0 ||
        prize.count > PACK_SIZE
      ) {
        throw new Error(
          "A nyeremény pozitív egész összeg, a darabszám 0 és 100 közötti egész szám legyen.",
        );
      }
      winners += prize.count;
    }
    if (winners > PACK_SIZE)
      throw new Error(
        "Egy 100 jegyes csomagban legfeljebb 100 nyerő jegy lehet.",
      );
    return winners;
  }

  function expected(config) {
    const winners = validate(config);
    const packPayout = config.prizes.reduce(
      (sum, prize) => sum + prize.amount * prize.count,
      0,
    );
    const revenue = config.quantity * config.price;
    const payout = (packPayout * config.quantity) / PACK_SIZE;
    const net = revenue - payout;
    return {
      winners,
      losers: PACK_SIZE - winners,
      packPayout,
      revenue,
      payout,
      net,
      profit: Math.max(0, net),
      loss: Math.max(0, -net),
    };
  }

  function makePack(config, random) {
    const pack = [];
    config.prizes.forEach((prize, index) => {
      for (let count = 0; count < prize.count; count++) pack.push(index);
    });
    while (pack.length < PACK_SIZE) pack.push(-1);
    for (let index = pack.length - 1; index > 0; index--) {
      const target = Math.floor(random() * (index + 1));
      [pack[index], pack[target]] = [pack[target], pack[index]];
    }
    return pack;
  }

  function simulate(config, random = Math.random) {
    const forecast = expected(config);
    const counts = config.prizes.map(() => 0);
    let pack = [];
    let payout = 0;
    let winners = 0;
    for (let ticket = 0; ticket < config.quantity; ticket++) {
      let selected = -1;
      if (config.mode === "pack") {
        if (ticket % PACK_SIZE === 0) pack = makePack(config, random);
        selected = pack[ticket % PACK_SIZE];
      } else {
        const draw = Math.floor(random() * PACK_SIZE);
        let cumulative = 0;
        for (let index = 0; index < config.prizes.length; index++) {
          cumulative += config.prizes[index].count;
          if (draw < cumulative) {
            selected = index;
            break;
          }
        }
      }
      if (selected !== -1) {
        counts[selected]++;
        payout += config.prizes[selected].amount;
        winners++;
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

  const api = {
    PACK_SIZE,
    SOURCE_SIZE,
    sourcePrizes,
    scaleSample,
    validate,
    expected,
    simulate,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.LotteryMath = api;
})(globalThis);
