// ふるさと納税ナビ｜控除上限額シミュレーター（概算）

// 給与所得控除
function deduction(g) {
  if (g <= 1625000) return 550000;
  if (g <= 1800000) return g * 0.4 - 100000;
  if (g <= 3600000) return g * 0.3 + 80000;
  if (g <= 6600000) return g * 0.2 + 440000;
  if (g <= 8500000) return g * 0.1 + 1100000;
  return 1950000;
}

// 所得税の限界税率
function incomeTaxRate(ti) {
  if (ti <= 1950000) return 0.05;
  if (ti <= 3300000) return 0.10;
  if (ti <= 6950000) return 0.20;
  if (ti <= 9000000) return 0.23;
  if (ti <= 18000000) return 0.33;
  if (ti <= 40000000) return 0.40;
  return 0.45;
}

// メイン計算
function simulate(grossYen, dependents) {
  dependents = dependents || 0;

  // (1) 給与所得
  const salaryIncome = Math.max(0, grossYen - deduction(grossYen));

  // (2) 社会保険料（概算）
  const shaho = grossYen * 0.15;

  // (3) 所得税の課税所得・限界税率
  const ti = Math.max(0, salaryIncome - shaho - 480000 - 380000 * dependents);
  const rate = incomeTaxRate(ti);

  // (4) 住民税の課税所得・所得割額
  const tr = Math.max(0, salaryIncome - shaho - 430000 - 330000 * dependents);
  const juminzeiShotokuwari = Math.floor(tr * 0.10);

  // (5) ふるさと納税の控除上限額
  let limit = juminzeiShotokuwari * 0.2 / (0.9 - rate * 1.021) + 2000;
  limit = Math.floor(limit / 1000) * 1000;
  if (tr <= 0 || limit < 0) limit = 0;

  return { limit, juminzeiShotokuwari, salaryIncome, rate };
}

const formatYen = v => v.toLocaleString('ja-JP') + ' 円';

// ===== ブラウザ用 UI =====
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('sim-form');
    const errorEl = document.getElementById('form-error');
    const resultEl = document.getElementById('result');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorEl.textContent = '';

      const incomeRaw = document.getElementById('income').value.trim();
      const depRaw = document.getElementById('dependents').value.trim();

      // バリデーション
      const incomeMan = Number(incomeRaw);
      if (incomeRaw === '' || !isFinite(incomeMan) || incomeMan <= 0) {
        errorEl.textContent = '年収は正の数で入力してください。';
        return;
      }

      let dependents = 0;
      if (depRaw !== '') {
        dependents = Number(depRaw);
        if (!isFinite(dependents) || dependents < 0 || !Number.isInteger(dependents)) {
          errorEl.textContent = '家族の人数は0以上の整数で入力してください。';
          return;
        }
      }

      const grossYen = Math.round(incomeMan * 10000);
      const r = simulate(grossYen, dependents);

      resultEl.innerHTML =
        '<h2>計算結果</h2>' +
        '<div class="result-card-main">' +
        '<p class="result-label">控除上限額の目安</p>' +
        '<p class="result-value">' + formatYen(r.limit) + '</p>' +
        '<p class="result-sub">この金額までの寄附なら、自己負担は約2,000円に収まる目安です。</p>' +
        '</div>' +
        '<div class="result-grid">' +
        '<div class="result-card"><p class="rc-label">住民税の所得割額（概算）</p><p class="rc-value">' + formatYen(r.juminzeiShotokuwari) + '</p></div>' +
        '<div class="result-card"><p class="rc-label">所得税の限界税率</p><p class="rc-value">' + (r.rate * 100) + '%</p></div>' +
        '</div>' +
        '<p class="result-note">上限額を超えた寄附分は自己負担になります。あくまで概算です。</p>';

      resultEl.hidden = false;
      // アニメーション用
      requestAnimationFrame(function () {
        resultEl.classList.add('visible');
      });
      resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { simulate, deduction, incomeTaxRate, formatYen };
}
