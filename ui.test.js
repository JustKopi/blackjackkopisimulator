const fs = require("node:fs");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const dom = new JSDOM(fs.readFileSync("index.html", "utf8"), {
  url: "https://example.com",
  runScripts: "outside-only",
});
const w = dom.window;
const saved = {
  winChance: 40,
  quantity: 100,
  price: 1100,
  prizes: [{ amount: 2000, chance: 12.5 }],
};
w.localStorage.setItem("lottery-settings", JSON.stringify(saved));
w.eval(fs.readFileSync("math.js", "utf8"));
w.eval(fs.readFileSync("app.js", "utf8"));
const el = (id) => w.document.getElementById(id);
assert.equal(el("winChance").value, "40");
assert.equal(el("total").textContent, "12,5%");
assert.equal(
  JSON.parse(el("gameConfig").textContent).actualWinChancePercent,
  5,
);
assert.equal(w.document.querySelector('[data-key="chance"]').step, "any");
el("simulate").click();
assert.equal(el("result").hidden, false);
w.document.querySelector('[data-tab="sample"]').click();
assert.equal(el("sample").hidden, false);
assert.equal(el("sampleRows").children.length, 15);
el("sampleSimulate").click();
assert.ok(el("sampleResult").textContent.includes("100"));
assert.equal(el("winChance").value, "40");
el("loadSample").click();
assert.equal(el("planner").hidden, false);
assert.equal(w.document.querySelectorAll(".prize-row").length, 14);
assert.ok(Number(w.document.querySelector('[data-key="chance"]').value) > 0);
el("winChance").value = "101";
el("winChance").dispatchEvent(new w.Event("input", { bubbles: true }));
assert.equal(el("simulate").disabled, true);
el("winChance").value = "100";
el("winChance").dispatchEvent(new w.Event("input", { bubbles: true }));
el("save").click();
assert.equal(
  JSON.parse(w.localStorage.getItem("lottery-settings")).prizes.length,
  14,
);
w.document.querySelector('[data-tab="designer"]').click();
assert.equal(el("designer").hidden, false);
assert.equal(el("designRtp").textContent, "40%");
assert.equal(el("designActualMargin").textContent, "60%");
assert.equal(el("designMean").textContent.replace(/\s/g, ""), "440$");
el("simulateDesign").click();
assert.ok(el("designResult").textContent.includes("Kifizetés"));
el("designMargin").value = "61";
el("designMargin").dispatchEvent(new w.Event("input"));
assert.equal(el("applyDesign").disabled, true);
assert.equal(el("designContent").hidden, true);
el("designMargin").value = "20";
el("designMargin").dispatchEvent(new w.Event("input"));
assert.equal(el("designRtp").textContent, "80%");
el("applyDesign").click();
assert.equal(el("planner").hidden, false);
const applied = JSON.parse(el("gameConfig").textContent);
assert.equal(applied.prizes[0].amount, 50000);
assert.ok(Math.abs(applied.actualWinChancePercent - 35) < 1e-8);
assert.ok(el("ownEconomy").textContent.includes("80%"));
// Loading a design changes the editor, but does not overwrite saved settings.
assert.equal(
  JSON.parse(w.localStorage.getItem("lottery-settings")).prizes[0].amount,
  50000000,
);
dom.window.close();
console.log(
  "UI checks passed: original saved percentages, tabs, independent Bronze simulation, rare prizes and validation.",
);
