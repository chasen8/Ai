async function analyze() {
  const symbol = document.getElementById("symbol").value.trim();
  const interval = document.getElementById("interval").value.toUpperCase();
  const result = document.getElementById("result");
  result.textContent = "分析中...";

  try {
    const res = await fetch(`https://open-api.bingx.com/openApi/market/getLatestKline?symbol=${symbol}&interval=${interval}&limit=100`);
    const raw = await res.json();

    const data = raw.data?.klines || raw.data || [];
    if (!data || data.length === 0) {
      result.textContent = "❌ 找不到 K 線資料，請確認幣種與格式是否正確（例如 BTC-USDT）";
      return;
    }

    const closes = data.map(c => parseFloat(c[4] || c.close || c[1])); // close 價
    const latest = closes.slice(-14);
    const avg = latest.reduce((a, b) => a + b, 0) / latest.length;
    const rsi = Math.round((Math.max(...latest) / avg) * 50);

    let trend = "震盪";
    if (rsi > 60) trend = "偏多";
    else if (rsi < 40) trend = "偏空";

    result.textContent = `
趨勢：${trend}
RSI：約 ${rsi}
建議：${trend === "偏多" ? "回踩進場觀察" : trend === "偏空" ? "等待止跌" : "觀望中"}
    `.trim();
  } catch (e) {
    result.textContent = "❌ 錯誤：無法連線或取得資料，請稍後再試";
  }
}
