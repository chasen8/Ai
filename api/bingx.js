export default async function handler(req, res) {
  const { symbol = 'BTC-USDT', interval = '4H' } = req.query;

  try {
    const apiRes = await fetch(
      `https://open-api.bingx.com/openApi/market/getLatestKline?symbol=${symbol}&interval=${interval}&limit=100`
    );
    const data = await apiRes.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: '中繼失敗', detail: err.message });
  }
}
