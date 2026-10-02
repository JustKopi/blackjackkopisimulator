/* Each prize percentage is conditional on passing the global chance gate.
 * The remaining probability always pays zero; percentages are never normalized.
 */
(function (root) {
  function validate(config) {
    if (!Number.isFinite(config.winChance) || config.winChance < 0 || config.winChance > 100) {
      throw new Error('A nyerési esély 0 és 100% között legyen.');
    }
    if (!Number.isInteger(config.quantity) || config.quantity < 1 || config.quantity > 1000000) {
      throw new Error('A darabszám 1 és 1 000 000 közötti egész szám legyen.');
    }
    if (!Number.isFinite(config.price) || config.price < 0 || config.price > 1e12) {
      throw new Error('A darabár 0 és 1 000 000 000 000 $ között legyen.');
    }
    for (const prize of config.prizes) {
      if (!Number.isFinite(prize.amount) || prize.amount < 0 || prize.amount > 1e12 ||
          !Number.isFinite(prize.chance) || prize.chance < 0 || prize.chance > 100) {
        throw new Error('Minden összeg legyen 0 és 1 000 000 000 000 $ között, az esély pedig 0 és 100% között.');
      }
    }
    const total = config.prizes.reduce((sum, prize) => sum + prize.chance, 0);
    if (total > 100) throw new Error('A nyeremények összesített esélye nem lehet több 100%-nál.');
    return total;
  }

  function expected(config) {
    const total = validate(config);
    const gate = config.winChance / 100;
    const perTicket = config.prizes.reduce((sum, prize) => sum + prize.amount * prize.chance / 100 * gate, 0);
    const revenue = config.quantity * config.price;
    const payout = config.quantity * perTicket;
    return { revenue, payout, net: revenue - payout, total, effectiveChance: total * gate };
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
        cumulative += prize.chance * config.winChance / 100;
        if (draw < cumulative) {
          counts[index]++;
          payout += prize.amount;
          winners++;
          break;
        }
      }
    }
    const net = forecast.revenue - payout;
    return { payout, winners, counts, net, profit: Math.max(0, net), loss: Math.max(0, -net) };
  }

  const api = { validate, expected, simulate };
  if (typeof module !== 'undefined') module.exports = api;
  else root.LotteryMath = api;
})(globalThis);
