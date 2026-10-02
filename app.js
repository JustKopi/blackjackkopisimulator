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
const byId = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat('hu-HU', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 2,
}).format(value);
const percent = (value) => new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 6 }).format(value) + '%';
let runs = 0;

function addRow(prize = { amount: 0, chance: 0 }) {
  const row = document.createElement('div');
  row.className = 'prize-row';
  for (const [key, label] of [['amount', 'Nyeremény összege dollárban'], ['chance', 'Nyeremény esélye százalékban']]) {
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.step = 'any';
    input.value = prize[key];
    input.dataset.key = key;
    input.setAttribute('aria-label', label);
    if (key === 'chance') {
      input.max = '100';
      input.className = 'probability';
    }
    row.append(input);
  }
  const remove = document.createElement('button');
  remove.className = 'remove danger';
  remove.textContent = '×';
  remove.setAttribute('aria-label', 'Nyeremény törlése');
  remove.addEventListener('click', () => { row.remove(); refresh(); });
  row.append(remove);
  byId('rows').append(row);
}

function readConfig() {
  return {
    winChance: byId('winChance').valueAsNumber,
    quantity: byId('quantity').valueAsNumber,
    price: byId('price').valueAsNumber,
    prizes: [...document.querySelectorAll('.prize-row')].map((row) => ({
      amount: row.querySelector('[data-key="amount"]').valueAsNumber,
      chance: row.querySelector('[data-key="chance"]').valueAsNumber,
    })),
  };
}

function refresh() {
  byId('result').hidden = true;
  const config = readConfig();
  const total = config.prizes.reduce((sum, prize) => sum + prize.chance, 0);
  byId('total').textContent = percent(total);
  byId('total').style.color = total > 100 ? 'var(--red)' : 'var(--blue)';
  try {
    const forecast = LotteryMath.expected(config);
    byId('revenue').textContent = money(forecast.revenue);
    byId('expectedPayout').textContent = money(forecast.payout);
    byId('expectedNet').textContent = money(forecast.net);
    byId('expectedNet').className = forecast.net >= 0 ? 'positive' : 'negative';
    byId('odds').textContent = `Tényleges találati esély: ${percent(forecast.effectiveChance)} · Nulla kifizetés: ${percent(100 - forecast.effectiveChance)}`;
    byId('message').textContent = '';
    byId('simulate').disabled = false;
    byId('save').disabled = false;
  } catch (error) {
    byId('message').textContent = error.message;
    byId('message').style.color = 'var(--red)';
    for (const id of ['revenue', 'expectedPayout', 'expectedNet']) byId(id).textContent = '—';
    byId('odds').textContent = '';
    byId('simulate').disabled = true;
    byId('save').disabled = true;
  }
}

let initial = defaults;
try {
  const saved = JSON.parse(localStorage.getItem('lottery-settings'));
  if (saved) { LotteryMath.validate(saved); initial = saved; }
} catch { /* Invalid or unavailable storage falls back to the screenshot values. */ }
for (const id of ['winChance', 'quantity', 'price']) byId(id).value = initial[id];
initial.prizes.forEach(addRow);
document.querySelector('.workspace').addEventListener('input', refresh);
byId('add').addEventListener('click', () => { addRow(); refresh(); });
byId('save').addEventListener('click', () => {
  try {
    const config = readConfig();
    LotteryMath.validate(config);
    localStorage.setItem('lottery-settings', JSON.stringify(config));
    byId('message').style.color = 'var(--green)';
    byId('message').textContent = 'Beállítások elmentve ebben a böngészőben.';
  } catch (error) {
    byId('message').style.color = 'var(--red)';
    byId('message').textContent = `A mentés nem sikerült: ${error.message}`;
  }
});
byId('simulate').addEventListener('click', () => {
  const config = readConfig();
  const result = LotteryMath.simulate(config);
  byId('actualPayout').textContent = money(result.payout);
  byId('winners').textContent = `${result.winners} / ${config.quantity}`;
  byId('profit').textContent = money(result.profit);
  byId('loss').textContent = money(result.loss);
  byId('runNumber').textContent = `#${++runs} futtatás`;
  byId('breakdown').replaceChildren();
  const breakdown = config.prizes.map((prize, index) => [prize.amount, result.counts[index], prize.amount * result.counts[index]]);
  breakdown.push([0, config.quantity - result.winners, 0]);
  for (const [amount, count, payout] of breakdown) {
    const row = document.createElement('tr');
    for (const value of [money(amount), String(count), money(payout)]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    byId('breakdown').append(row);
  }
  byId('result').hidden = false;
});
byId('close').addEventListener('click', () => { byId('settings').hidden = true; byId('reopen').hidden = false; });
byId('reopen').addEventListener('click', () => { byId('settings').hidden = false; byId('reopen').hidden = true; });
refresh();
