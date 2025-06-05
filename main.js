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

    // === RSI 指標 ===
    const recent = closes.slice(-14);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const rsi = Math.round((Math.max(...recent) / avg) * 50);

    // === MACD ===
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    const macdLine = ema12.slice(-ema26.length).map((val, i) => val - ema26[i]);
    const signalLine = calculateEMA(macdLine, 9);
    const macdHist = macdLine.slice(-signalLine.length).map((val, i) => val - signalLine[i]);
    const macdTrend = macdHist.at(-1) > 0 ? "柱體翻紅，動能偏強" : "柱體翻綠，動能轉弱";

    // === Vegas通道 ===
    const vegasShort = calculateEMA(closes, 21);
    const vegasLong = calculateEMA(closes, 55);
    const priceNow = closes.at(-1);
    const vegasTrend =
      priceNow > vegasShort.at(-1) && priceNow > vegasLong.at(-1)
        ? "上升趨勢（價格在通道上方）"
        : priceNow < vegasShort.at(-1)
        ? "下降趨勢（價格跌破短期通道）"
        : "橫盤震盪（靠近通道中段）";

    // === 籌碼密集區 ===
    const vp = calcVolumeProfile(closes);
    const poc = vp.poc;
    const vah = vp.vah;
    const val = vp.val;

    // === 趨勢分類與建議 ===
    let trend = "震盪";
    if (rsi > 60 && macdHist.at(-1) > 0) trend = "偏多";
    else if (rsi < 40 && macdHist.at(-1) < 0) trend = "偏空";

    let suggestion = "觀望為宜";
    if (trend === "偏多") suggestion = `可等待價格回踩 ${val}～${poc} 區間，考慮短多`;
    if (trend === "偏空") suggestion = `若跌破 ${val}，可考慮短空，留意 ${vah} 壓力`;

    // === 輸出文字 ===
    result.textContent = `
🧠 AI 智能分析結果（合約）

幣種：${symbolInput.toUpperCase()}
週期：${intervalInput}
趨勢分類：${trend}
RSI：約 ${rsi}
MACD：${macdTrend}
Vegas 通道：${vegasTrend}
籌碼密集區：
 - VAL（下緣）：${val}
 - POC（高交易密集）：${poc}
 - VAH（上緣）：${vah}

📌 建議：${suggestion}
    `.trim();
  } catch (err) {
    result.textContent = "❌ 分析錯誤，請稍後再試";
  }
}

// === 工具函數區 ===

function calculateEMA(prices, period) {
  const k = 2 / (period + 1);
  const emaArray = [];
  emaArray[0] = prices.slice(0, period).reduce((a, b) => a + b) / period;
  for (let i = period; i < prices.length; i++) {
    const ema = prices[i] * k + emaArray[emaArray.length - 1] * (1 - k);
    emaArray.push(ema);
  }
  return emaArray;
}

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

async function fetchRecommend() {
  const ul = document.getElementById("recommend-list");
  try {
    const res = await fetch("/api/recommend");
    const list = await res.json();
    ul.innerHTML = list.map(
      coin => `<li><b>${coin.symbol}</b> → ${coin.comment}</li>`
    ).join("");
  } catch (e) {
    ul.innerHTML = "<li>⚠️ 無法取得推薦幣清單</li>";
  }
}

window.onload = fetchRecommend;
