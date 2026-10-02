const fs = require("node:fs");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const dom = new JSDOM(fs.readFileSync("index.html", "utf8"), {
  url: "https://justkopi.github.io/blackjackkopisimulator/",
  runScripts: "outside-only",
});
const window = dom.window;
window.eval(fs.readFileSync("math.js", "utf8"));
window.eval(fs.readFileSync("app.js", "utf8"));
const el = (id) => window.document.getElementById(id);
assert.equal(window.document.querySelectorAll(".prize-row").length, 6);
assert.equal(el("total").textContent, "33 db");
assert.equal(el("losers").textContent, "67 db");
assert.equal(JSON.parse(el("gameConfig").textContent).packPayout, 65000);
el("simulate").click();
assert.equal(el("result").hidden, false);
assert.equal(el("winners").textContent, "33 / 100");
assert.ok(el("profit").textContent.replace(/\s/g, "").startsWith("45000"));
window.document.querySelector('[data-tab="sample"]').click();
assert.equal(el("sample").hidden, false);
assert.equal(el("planner").hidden, true);
assert.equal(el("sampleRows").children.length, 15);
el("loadSample").click();
assert.equal(el("planner").hidden, false);
el("price").value = "1100.5";
el("price").dispatchEvent(new window.Event("input", { bubbles: true }));
assert.equal(el("simulate").disabled, true);
assert.equal(el("gameContent").hidden, true);
el("price").value = "1100";
el("price").dispatchEvent(new window.Event("input", { bubbles: true }));
el("add").click();
assert.equal(window.document.querySelectorAll(".prize-row").length, 7);
window.document.querySelector(".prize-row:last-child .remove").click();
assert.equal(window.document.querySelectorAll(".prize-row").length, 6);
el("save").click();
assert.equal(
  JSON.parse(window.localStorage.getItem("lottery-settings-v2")).price,
  1100,
);
el("mode").value = "independent";
el("mode").dispatchEvent(new window.Event("change", { bubbles: true }));
el("simulate").click();
assert.equal(el("result").hidden, false);
assert.ok(el("runNumber").textContent.includes("Külön húzások"));
dom.window.close();
console.log(
  "UI checks passed: tabs, sample, simulation, invalid inputs, rows, save, independent mode.",
);
