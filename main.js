// ===== 幣種即時分析功能 =====
async function analyze() {
  const symbolInput = document.getElementById("symbol").value.trim();
  const intervalInput = document.getElementById("interval").value;
  const result = document.getElementById("result");

  if (!symbolInput || !intervalInput) {
    result.textContent = "❌ 請輸入幣種與週期";
    return;
  }

  result.textContent = "分析中...";

  const symbol = symbolInput.replace("-", "").toUpperCase();
  const interval = intervalInput.toLowerCase();

  try {
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length < 60) {
      result.textContent = "❌ 無法取得有效資料";
      return;
    }

    const closes = data.map(k => parseFloat(k[4]));
    const recent = closes.slice(-14);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const rsi = Math.round((Math.max(...recent) / avg) * 50);

    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    const macdLine = ema12.slice(-ema26.length).map((val, i) => val - ema26[i]);
    const signalLine = calculateEMA(macdLine, 9);
    const macdHist = macdLine.slice(-signalLine.length).map((val, i) => val - signalLine[i]);
    const macdTrend = macdHist.at(-1) > 0 ? "柱體翻紅，動能偏強" : "柱體翻綠，動能轉弱";

    const vegasShort = calculateEMA(closes, 21).pop();
    const vegasLong = calculateEMA(closes, 55).pop();
    const priceNow = closes.at(-1);
    const vegasTrend =
      priceNow > vegasShort && priceNow > vegasLong
        ? "上升趨勢（價格在通道上方）"
        : priceNow < vegasShort
        ? "下降趨勢（價格跌破短期通道）"
        : "橫盤震盪（靠近通道中段）";

    const vp = calcVolumeProfile(closes);
    const poc = vp.poc;
    const vah = vp.vah;
    const val = vp.val;

    let trend = "震盪";
    if (rsi > 60 && macdHist.at(-1) > 0) trend = "偏多";
    else if (rsi < 40 && macdHist.at(-1) < 0) trend = "偏空";

    let suggestion = "觀望為宜";
    if (trend === "偏多") suggestion = `可等待價格回踩 ${val}～${poc} 區間，考慮短多`;
    if (trend === "偏空") suggestion = `若跌破 ${val}，可考慮短空，留意 ${vah} 壓力`;

    // 🧠 智能 TP / SL 推論
    let tp = "-", sl = "-";
    if (trend === "偏多") {
      tp = Math.max(vah, priceNow * 1.01).toFixed(2);
      sl = Math.min(poc, val).toFixed(2);
    } else if (trend === "偏空") {
      tp = Math.min(val, priceNow * 0.99).toFixed(2);
      sl = Math.max(poc, vah).toFixed(2);
    }

    result.innerHTML = `
<span style="color:#58a6ff;">🧠 AI 智能分析結果（合約）</span><br><br>
幣種：<b>${symbolInput.toUpperCase()}</b><br>
週期：${intervalInput}<br>
趨勢分類：<b>${trend}</b><br>
RSI：約 <b>${rsi}</b><br>
MACD：${macdTrend}<br>
Vegas 通道：${vegasTrend}<br>
籌碼密集區：<br>
 &nbsp;&nbsp;• VAL（下緣）：${val}<br>
 &nbsp;&nbsp;• POC（高交易密集）：${poc}<br>
 &nbsp;&nbsp;• VAH（上緣）：${vah}<br><br>
📈 建議進場價格：約 <b>${priceNow}</b><br>
🎯 TP（止盈）：<b>${tp}</b><br>
🛡 SL（停損）：<b>${sl}</b><br><br>
📌 <span style="color:orange;"><b>建議</b></span>：${suggestion}
    `;
  } catch (err) {
    result.textContent = "❌ 分析錯誤，請稍後再試";
  }
}


// ===== EMA 計算器 =====

function calculateEMA(prices, period) {
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
  const emaArray = [ema];
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
    emaArray.push(ema);
  }
  return emaArray;
}

// ===== 籌碼密集區計算 =====

function calcVolumeProfile(prices) {
  const bins = {};
  prices.forEach(p => {
    const price = Math.round(p);
    bins[price] = (bins[price] || 0) + 1;
  });

  const sorted = Object.entries(bins).sort((a, b) => b[1] - a[1]);
  const poc = Number(sorted[0][0]);

  const total = prices.length;
  let cum = 0;
  let vah = poc;
  let val = poc;
  for (const [price, count] of sorted) {
    cum += count;
    if (cum / total >= 0.7) {
      vah = Number(sorted[0][0]);
      val = Number(price);
      break;
    }
  }

  return { poc, vah, val };
}

// ===== 載入推薦幣種 =====

async function fetchRecommendations() {
  try {
    const res = await fetch('/api/recommend.js');
    const list = await res.json();
    const ul = document.getElementById('recommend-list');
    ul.innerHTML = list.map(rec => `<li><b>${rec.symbol}</b> → ${rec.comment}</li>`).join('');
  } catch {
    document.getElementById('recommend-list').innerHTML = '<li>⚠️ 無法取得推薦資料</li>';
  }
}

// ===== 載入每日操作建議 =====

async function fetchStrategy() {
  try {
    const res = await fetch('/api/strategy.js');
    const list = await res.json();
    const ul = document.getElementById('strategy-list');
    ul.innerHTML = list.map(s =>
      `<li>
        <b>${s.symbol}</b>（${s.trend}）<br>
        ▸ 進場：${s.entry}<br>
        ▸ TP：${s.tp}<br>
        ▸ SL：${s.sl}<br>
        ▸ 理由：${s.reason}
      </li><br>`
    ).join('');
  } catch {
    document.getElementById('strategy-list').innerHTML = '<li>⚠️ 無法取得策略資料</li>';
  }
}

// ===== 初始化載入 =====

window.onload = () => {
  fetchRecommendations();
  fetchStrategy();
};
