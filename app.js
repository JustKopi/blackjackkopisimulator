const byId = (id) => document.getElementById(id);
const integer = (value) =>
  new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 }).format(value);
const money = (value) => `${integer(value)} $`;
const defaults = {
  winChance: 100,
  quantity: 100,
  price: 1100,
  prizes: [
    { amount: 50000, chance: 0.00001 },
    { amount: 20000, chance: 0.0001 },
    { amount: 10000, chance: 0.01 },
    { amount: 2000, chance: 15 },
    { amount: 1000, chance: 14 },
  ],
};
const sample = LotteryMath.sourcePrizes.map(({ amount, count }) => ({
  amount,
  chance: (count / LotteryMath.SOURCE_SIZE) * 100,
}));
const percent = (value) =>
  `${new Intl.NumberFormat(
    "hu-HU",
    value > 0 && value < 1e-8
      ? { notation: "scientific", maximumSignificantDigits: 4 }
      : { maximumFractionDigits: 10 },
  ).format(value)}%`;
let runs = 0;

function notify(message, error = false) {
  byId("message").textContent = message;
  byId("message").className = error ? "negative" : "positive";
}

function showTab(name) {
  document.querySelectorAll(".tab-page").forEach((page) => {
    page.hidden = page.id !== name;
  });
  document.querySelectorAll("[data-tab]").forEach((button) => {
    if (button.dataset.tab === name)
      button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function addRow(prize = { amount: 1000, chance: 0 }) {
  const row = document.createElement("div");
  row.className = "prize-row";
  for (const [key, label] of [
    ["amount", "Nyeremény dollárban"],
    ["chance", "Nyeremény esélye százalékban"],
  ]) {
    const input = document.createElement("input");
    input.type = "number";
    input.min = key === "amount" ? "1" : "0";
    input.max = key === "amount" ? "1000000000" : "100";
    input.step = "any";
    input.value = prize[key];
    input.dataset.key = key;
    input.setAttribute("aria-label", label);
    row.append(input);
  }
  const remove = document.createElement("button");
  remove.className = "remove";
  remove.textContent = "×";
  remove.setAttribute("aria-label", "Nyeremény törlése");
  remove.addEventListener("click", () => {
    row.remove();
    refresh();
  });
  row.append(remove);
  byId("rows").append(row);
}

function load(config) {
  for (const id of ["quantity", "price", "winChance"])
    byId(id).value = config[id];
  byId("rows").replaceChildren();
  config.prizes.forEach(addRow);
  refresh();
}

function readConfig() {
  return {
    quantity: byId("quantity").valueAsNumber,
    price: byId("price").valueAsNumber,
    winChance: byId("winChance").valueAsNumber,
    prizes: [...document.querySelectorAll(".prize-row")].map((row) => ({
      amount: row.querySelector('[data-key="amount"]').valueAsNumber,
      chance: row.querySelector('[data-key="chance"]').valueAsNumber,
    })),
  };
}

function tableRow(target, values, muted = false) {
  const row = document.createElement("tr");
  if (muted) row.className = "muted";
  for (const value of values) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.append(cell);
  }
  target.append(row);
}

function gamePlan(config) {
  const forecast = LotteryMath.expected(config);
  return {
    ticketPrice: config.price,
    globalWinChancePercent: config.winChance,
    actualWinChancePercent: forecast.effectiveChance,
    zeroPayoutChancePercent: forecast.losers,
    prizes: config.prizes.map((prize) => ({
      amount: prize.amount,
      chancePercent: prize.chance,
    })),
  };
}

function refresh() {
  byId("result").hidden = true;
  byId("gameConfig").textContent = "";
  const config = readConfig();
  try {
    const forecast = LotteryMath.expected(config);
    byId("total").textContent = percent(forecast.total);
    byId("losers").textContent = percent(forecast.losers);
    byId("revenue").textContent = money(forecast.revenue);
    byId("expectedPayout").textContent = money(forecast.payout);
    byId("expectedProfit").textContent = money(forecast.profit);
    byId("expectedLoss").textContent = money(forecast.loss);
    const economy = LotteryMath.analyze(config);
    byId("ownEconomy").textContent =
      `Visszaosztás (RTP): ${economy.rtp === null ? "—" : percent(economy.rtp)} · Ház maradéka: ${economy.rtp === null ? "—" : percent(100 - economy.rtp)} · Jegyár visszanyerése: ${percent(economy.refundChance)} · Jegyár feletti nyeremény: ${percent(economy.gainChance)}`;
    byId("gamePrice").textContent = money(config.price);
    byId("gameGlobalChance").textContent = percent(config.winChance);
    byId("gameChance").textContent = percent(forecast.effectiveChance);
    byId("gameRows").replaceChildren();
    config.prizes
      .filter((prize) => prize.chance > 0)
      .forEach((prize) => {
        tableRow(byId("gameRows"), [
          money(prize.amount),
          percent(prize.chance),
        ]);
      });
    tableRow(byId("gameRows"), ["Nem nyer · 0 $", percent(forecast.losers)]);
    byId("gameConfig").textContent = JSON.stringify(gamePlan(config), null, 2);
    byId("gameContent").hidden = false;
    byId("gameError").hidden = true;
    for (const id of ["simulate", "save", "copy", "download"])
      byId(id).disabled = false;
    notify("");
  } catch (error) {
    notify(error.message, true);
    for (const id of [
      "revenue",
      "expectedPayout",
      "expectedProfit",
      "expectedLoss",
      "total",
      "losers",
    ]) {
      byId(id).textContent = "—";
    }
    byId("gameContent").hidden = true;
    byId("ownEconomy").textContent = "";
    byId("gameError").hidden = false;
    for (const id of ["simulate", "save", "copy", "download"])
      byId(id).disabled = true;
  }
}

sample.forEach((prize) => {
  tableRow(byId("sampleRows"), [money(prize.amount), percent(prize.chance)]);
});
const sampleChance = sample.reduce((sum, prize) => sum + prize.chance, 0);
tableRow(byId("sampleRows"), ["Nem nyer · 0 $", percent(100 - sampleChance)]);
byId("sampleSummary").textContent =
  `Felső nyerési esély: 100%. Tényleges nyerési esély: ${percent(sampleChance)}. Az eredeti arányok kerekítés nélkül kerülnek a szimulációba.`;

let initial = defaults;
try {
  const saved = JSON.parse(localStorage.getItem("lottery-settings"));
  if (saved) {
    LotteryMath.validate(saved);
    initial = saved;
  }
} catch {
  // The previous percentage-based settings stay stored under their original key.
}
load(initial);
document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => showTab(button.dataset.tab));
});
byId("planner").addEventListener("input", refresh);

byId("add").addEventListener("click", () => {
  addRow();
  refresh();
});
byId("save").addEventListener("click", () => {
  try {
    const config = readConfig();
    LotteryMath.validate(config);
    localStorage.setItem("lottery-settings", JSON.stringify(config));
    notify("Beállítások elmentve ebben a böngészőben.");
  } catch {
    notify(
      "A mentés nem sikerült. Ellenőrizd a beállításokat és a böngésző tárolási engedélyét.",
      true,
    );
  }
});
byId("loadSample").addEventListener("click", () => {
  load({
    ...defaults,
    price: byId("price").valueAsNumber,
    quantity: 100,
    winChance: 100,
    prizes: sample,
  });
  showTab("planner");
  notify(
    "A Bronz minta betöltve. Az összegek játékbeli $ egységben szerepelnek.",
  );
});
byId("simulate").addEventListener("click", () => {
  const config = readConfig();
  const result = LotteryMath.simulate(config);
  byId("actualPayout").textContent = money(result.payout);
  byId("winners").textContent =
    `${integer(result.winners)} / ${integer(config.quantity)}`;
  byId("profit").textContent = money(result.profit);
  byId("loss").textContent = money(result.loss);
  byId("runNumber").textContent = `#${++runs} · Külön húzások`;
  byId("breakdown").replaceChildren();
  config.prizes.forEach((prize, index) => {
    if (prize.chance > 0) {
      tableRow(byId("breakdown"), [
        money(prize.amount),
        integer(result.counts[index]),
        money(prize.amount * result.counts[index]),
      ]);
    }
  });
  tableRow(byId("breakdown"), [
    "Nem nyer",
    integer(config.quantity - result.winners),
    "0 $",
  ]);
  byId("result").hidden = false;
});
byId("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(byId("gameConfig").textContent);
    notify("A játékba illeszthető terv a vágólapra került.");
  } catch {
    notify(
      "A másolás nem engedélyezett. Jelöld ki a tervet, vagy töltsd le a JSON fájlt.",
      true,
    );
  }
});
byId("download").addEventListener("click", () => {
  const blob = new Blob([byId("gameConfig").textContent], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sorsjegy-terv.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

function runSample() {
  const config = {
    winChance: 100,
    quantity: byId("sampleQuantity").valueAsNumber,
    price: byId("samplePrice").valueAsNumber,
    prizes: sample,
  };
  try {
    const forecast = LotteryMath.expected(config);
    const result = LotteryMath.simulate(config);
    byId("sampleResult").textContent =
      `Bevétel: ${money(forecast.revenue)} · Várható kifizetés: ${money(forecast.payout)} · Tényleges kifizetés: ${money(result.payout)} · Nyerő: ${integer(result.winners)} / ${integer(config.quantity)} · Ház profitja: ${money(result.profit)} · Ház vesztesége: ${money(result.loss)}`;
  } catch (error) {
    byId("sampleResult").textContent = error.message;
  }
}
byId("sampleSimulate").addEventListener("click", runSample);

let designedConfig;
const shortPercent = (value) =>
  `${new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 2 }).format(value)}%`;
const preciseNumber = (value) =>
  new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 2 }).format(value);
const preciseMoney = (value) => `${preciseNumber(value)} $`;
const designInputs = [
  "designPrice",
  "designMax",
  "designMargin",
  "designHit",
  "designJackpot",
  "designQuantity",
];

function refreshDesign() {
  designedConfig = undefined;
  byId("designResult").textContent = "";
  try {
    const config = LotteryMath.design({
      price: byId("designPrice").valueAsNumber,
      maxPrize: byId("designMax").valueAsNumber,
      margin: byId("designMargin").valueAsNumber,
      hitChance: byId("designHit").valueAsNumber,
      jackpotEvery: byId("designJackpot").valueAsNumber,
    });
    config.quantity = byId("designQuantity").valueAsNumber;
    const forecast = LotteryMath.analyze(config);
    byId("designRtp").textContent = shortPercent(forecast.rtp);
    byId("designActualMargin").textContent = shortPercent(100 - forecast.rtp);
    byId("designRefund").textContent = shortPercent(forecast.refundChance);
    byId("designGain").textContent = shortPercent(forecast.gainChance);
    byId("designLose").textContent = shortPercent(100 - forecast.payoutChance);
    byId("designMean").textContent = preciseMoney(forecast.perTicket);
    byId("designRows").replaceChildren();
    config.prizes.forEach((prize) =>
      tableRow(byId("designRows"), [
        money(prize.amount),
        percent(prize.chance),
        preciseNumber(100 / prize.chance),
        preciseMoney((prize.amount * prize.chance) / 100),
      ]),
    );
    tableRow(byId("designRows"), [
      "Nem nyer · 0 $",
      percent(forecast.losers),
      forecast.losers > 0 ? preciseNumber(100 / forecast.losers) : "—",
      "0 $",
    ]);
    byId("designForecast").textContent =
      `${integer(config.quantity)} jegynél: bevétel ${money(forecast.revenue)}, várható kifizetés ${money(forecast.payout)}, várható nettó maradék ${money(forecast.net)}.`;
    const jackpot = config.prizes[0];
    const seenChance =
      -Math.expm1(config.quantity * Math.log1p(-jackpot.chance / 100)) * 100;
    byId("designRisk").textContent =
      `Legalább egy főnyeremény esélye ebben a futtatásban: ${shortPercent(seenChance)}. A teljes kifizetés szórása: ${money(forecast.standardDeviation)}. Ez az ingadozás mértéke, nem veszteségi korlát vagy garantált tartomány. Rövid távon pozitív profitcél mellett is lehet veszteség.`;
    byId("designError").textContent = "";
    byId("designContent").hidden = false;
    byId("applyDesign").disabled = false;
    byId("simulateDesign").disabled = false;
    designedConfig = config;
  } catch (error) {
    byId("designError").textContent = error.message;
    byId("designContent").hidden = true;
    byId("applyDesign").disabled = true;
    byId("simulateDesign").disabled = true;
  }
}

designInputs.forEach((id) => byId(id).addEventListener("input", refreshDesign));
byId("applyDesign").addEventListener("click", () => {
  if (!designedConfig) return;
  load(designedConfig);
  showTab("planner");
  notify(
    "A számolt játékbeli terv betöltve. A százalékokat továbbra is szerkesztheted.",
  );
});
byId("simulateDesign").addEventListener("click", () => {
  if (!designedConfig) return;
  const result = LotteryMath.simulate(designedConfig);
  byId("designResult").textContent =
    `Kifizetés: ${money(result.payout)} · Nyerő: ${integer(result.winners)} / ${integer(designedConfig.quantity)} · Ház profitja: ${money(result.profit)} · Ház vesztesége: ${money(result.loss)}`;
});
document.querySelectorAll("[data-design-margin]").forEach((button) => {
  button.addEventListener("click", () => {
    byId("designMargin").value = button.dataset.designMargin;
    refreshDesign();
  });
});
refreshDesign();
