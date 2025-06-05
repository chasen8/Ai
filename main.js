async function analyze() {
  const symbolInput = document.getElementById("symbol").value.trim();
  const intervalInput = document.getElementById("interval").value;
  const result = document.getElementById("result");

  if (!symbolInput || !intervalInput) {
    result.textContent = "❌ 請輸入正確幣種與時間週期";
    return;
  }

  result.textContent = "分析中...";

  // Binance 要求格式：BTCUSDT, ETHUSDT，不含 -
  const symbol = symbolInput.replace('-', '');
  const interval = intervalInput.toLowerCase(); // 轉成 binance 格式 4H → 4h

  try {
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      result.textContent = "❌ 無法取得資料，請確認幣種格式（例如 BTC-USDT）";
      return;
    }

    // 取收盤價（第 4 個欄位）
    const closes = data.map(kline => parseFloat(kline[4]));
    const latest = closes.slice(-14);
    const avg = latest.reduce((a, b) => a + b, 0) / latest.length;
    const rsi = Math.round((Math.max(...latest) / avg) * 50);

    let trend = "震盪";
    if (rsi > 60) trend = "偏多";
    else if (rsi < 40) trend = "偏空";

    result.textContent = `
幣種：${symbolInput}
週期：${intervalInput}
趨勢：${trend}
RSI：約 ${rsi}
建議：${trend === "偏多" ? "回踩進場觀察" : trend === "偏空" ? "等待止跌" : "觀望中"}
    `.trim();
  } catch (err) {
    result.textContent = "❌ 錯誤：無法連線或伺服器回應錯誤";
  }
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
