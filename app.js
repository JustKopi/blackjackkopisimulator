const byId = (id) => document.getElementById(id);
const integer = (value) =>
  new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 }).format(value);
const money = (value) => `${integer(value)} $`;
const sample = LotteryMath.scaleSample();
const defaults = {
  quantity: 100,
  price: 1100,
  mode: "pack",
  prizes: sample
    .filter((prize) => prize.amount > 0 && prize.count > 0)
    .map(({ amount, count }) => ({ amount, count })),
};
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

function addRow(prize = { amount: 1000, count: 0 }) {
  const row = document.createElement("div");
  row.className = "prize-row";
  for (const [key, label] of [
    ["amount", "Nyeremény dollárban"],
    ["count", "Darab 100 jegyből"],
  ]) {
    const input = document.createElement("input");
    input.type = "number";
    input.min = key === "amount" ? "1" : "0";
    input.max = key === "amount" ? "1000000000" : "100";
    input.step = "1";
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
  for (const id of ["quantity", "price", "mode"]) byId(id).value = config[id];
  byId("rows").replaceChildren();
  config.prizes.forEach(addRow);
  refresh();
}

function readConfig() {
  return {
    quantity: byId("quantity").valueAsNumber,
    price: byId("price").valueAsNumber,
    mode: byId("mode").value,
    prizes: [...document.querySelectorAll(".prize-row")].map((row) => ({
      amount: row.querySelector('[data-key="amount"]').valueAsNumber,
      count: row.querySelector('[data-key="count"]').valueAsNumber,
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
    packSize: 100,
    globalWinChancePercent: 100,
    actualWinChancePercent: forecast.winners,
    losingTicketsPerPack: forecast.losers,
    zeroPayoutChancePercent: forecast.losers,
    packPayout: forecast.packPayout,
    prizes: config.prizes
      .filter((prize) => prize.count > 0)
      .map((prize) => ({
        amount: prize.amount,
        ticketsPerPack: prize.count,
        chancePercent: prize.count,
      })),
  };
}

function refresh() {
  byId("result").hidden = true;
  byId("gameConfig").textContent = "";
  const config = readConfig();
  byId("modeNote").textContent =
    config.mode === "pack"
      ? "Minden új csomag 100 összekevert jegy. Teljes csomagnál a darabszám és a kifizetés mindig a terv szerint alakul."
      : "Minden jegy új, független húzás. A százalékok hosszú távú átlagok; 100 jegynél a profit és a veszteség változhat.";
  try {
    const forecast = LotteryMath.expected(config);
    byId("total").textContent = `${forecast.winners} db`;
    byId("losers").textContent = `${forecast.losers} db`;
    byId("revenue").textContent = money(forecast.revenue);
    byId("expectedPayout").textContent = money(forecast.payout);
    byId("expectedProfit").textContent = money(forecast.profit);
    byId("expectedLoss").textContent = money(forecast.loss);
    byId("gamePrice").textContent = money(config.price);
    byId("gameChance").textContent = `${forecast.winners}%`;
    byId("gameRows").replaceChildren();
    config.prizes
      .filter((prize) => prize.count > 0)
      .forEach((prize) => {
        tableRow(byId("gameRows"), [
          money(prize.amount),
          `${prize.count}%`,
          `${prize.count} db`,
        ]);
      });
    tableRow(byId("gameRows"), [
      "Nem nyer · 0 $",
      `${forecast.losers}%`,
      `${forecast.losers} db`,
    ]);
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
    byId("gameError").hidden = false;
    for (const id of ["simulate", "save", "copy", "download"])
      byId(id).disabled = true;
  }
}

sample.forEach((prize) => {
  tableRow(
    byId("sampleRows"),
    [
      prize.amount === 0 ? "Nem nyer" : `${integer(prize.amount)} Ft`,
      `${integer(prize.originalCount)} db`,
      `${prize.count} db`,
      `${prize.count}%`,
    ],
    prize.count === 0,
  );
});
const sourcePayout = LotteryMath.sourcePrizes.reduce(
  (sum, prize) => sum + prize.amount * prize.count,
  0,
);
const samplePayout = sample.reduce(
  (sum, prize) => sum + prize.amount * prize.count,
  0,
);
byId("sampleSummary").textContent =
  `Eredeti összkifizetés: ${integer(sourcePayout)} Ft. A 100 jegyes minta kifizetése: ${integer(samplePayout)} Ft. Az eredeti jegyár nélkül az eredeti profit nem számolható.`;

let initial = defaults;
try {
  const saved = JSON.parse(localStorage.getItem("lottery-settings-v2"));
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
byId("mode").addEventListener("change", refresh);
byId("add").addEventListener("click", () => {
  addRow();
  refresh();
});
byId("save").addEventListener("click", () => {
  try {
    const config = readConfig();
    LotteryMath.validate(config);
    localStorage.setItem("lottery-settings-v2", JSON.stringify(config));
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
    mode: "pack",
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
  byId("runNumber").textContent =
    `#${++runs} · ${config.mode === "pack" ? "Fix csomag" : "Külön húzások"}`;
  byId("breakdown").replaceChildren();
  config.prizes.forEach((prize, index) => {
    if (prize.count > 0) {
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
  link.download = "sorsjegy-100-terv.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
