const axios = require('axios');
const fs = require('fs');

const symbols = ['BTCUSDT', 'ETHUSDT', 'SUIUSDT', 'DOGEUSDT', 'TRBUSDT'];
const interval = '4h';

async function fetchKlines(symbol) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`;
  const response = await axios.get(url);
  return response.data.map(k => parseFloat(k[4]));
}

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

function calculateMACD(prices) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12.slice(-ema26.length).map((val, i) => val - ema26[i]);
  const signalLine = calculateEMA(macdLine, 9);
  const histogram = macdLine.slice(-signalLine.length).map((val, i) => val - signalLine[i]);
  return { macdLine, signalLine, histogram };
}

function calculateRSI(prices, period = 14) {
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function analyzeSymbol(prices) {
  const macd = calculateMACD(prices);
  const rsi = calculateRSI(prices);
  const vegasShort = calculateEMA(prices, 21).pop();
  const vegasLong = calculateEMA(prices, 55).pop();
  const currentPrice = prices[prices.length - 1];

  let trend = '震盪';
  if (rsi > 60 && macd.histogram.at(-1) > 0 && currentPrice > vegasShort && currentPrice > vegasLong) {
    trend = '偏多';
  } else if (rsi < 40 && macd.histogram.at(-1) < 0 && currentPrice < vegasShort && currentPrice < vegasLong) {
    trend = '偏空';
  }

  let comment = '震盪整理，觀望為宜';
  if (trend === '偏多') comment = '趨勢轉強，支撐有效';
  else if (trend === '偏空') comment = '動能轉弱，留意壓力';

  return { trend, comment };
}

(async () => {
  const recommendations = [];
  for (const symbol of symbols) {
    try {
      const prices = await fetchKlines(symbol);
      const analysis = analyzeSymbol(prices);
      recommendations.push({ symbol: symbol.replace('USDT', '-USDT'), comment: analysis.comment });
    } catch (error) {
      console.error(`分析 ${symbol} 時出錯：`, error.message);
    }
  }
  fs.writeFileSync('api/recommend.js', `export default ${JSON.stringify(recommendations, null, 2)};`);
  console.log('✅ 推薦幣種已更新至 api/recommend.js');
})();
