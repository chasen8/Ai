async function analyze() {
  const symbol = document.getElementById("symbol").value.trim();
  const interval = document.getElementById("interval").value;
  const result = document.getElementById("result");
  result.textContent = "分析中...";

  try {
    const res = await fetch(`/api/bingx?symbol=${symbol}&interval=${interval}`);
    const raw = await res.json();
    const data = raw.data?.klines || raw.data || [];

    if (!data || data.length === 0) {
      result.textContent = "❌ 無法取得資料，請確認幣種格式（如 BTC-USDT）";
      return;
    }

    const closes = data.map(c => parseFloat(c[4]));
    const latest = closes.slice(-14);
    const avg = latest.reduce((a, b) => a + b, 0) / latest.length;
    const rsi = Math.round((Math.max(...latest) / avg) * 50);

    let trend = "震盪";
    if (rsi > 60) trend = "偏多";
    else if (rsi < 40) trend = "偏空";

    result.textContent = `
幣種：${symbol}
週期：${interval}
趨勢：${trend}
RSI：約 ${rsi}
建議：${trend === "偏多" ? "回踩進場觀察" : trend === "偏空" ? "等待止跌" : "觀望中"}
    `.trim();
  } catch (err) {
    result.textContent = "❌ 伺服器錯誤，請稍後再試";
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
    ul.innerHTML = "<li>無法取得推薦幣清單</li>";
  }
}

window.onload = fetchRecommend;
