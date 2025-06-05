export default async function handler(req, res) {
  const topCoins = [
    { symbol: 'AR-USDT', comment: '強勢震盪，觀察拉回' },
    { symbol: 'DOGE-USDT', comment: '偏多走勢，有動能' },
    { symbol: 'SUI-USDT', comment: '趨勢轉強，支撐有效' },
    { symbol: 'ETH-USDT', comment: '均線多頭排列，可續抱' },
    { symbol: 'SOL-USDT', comment: '短線回踩機會' },
    { symbol: 'MATIC-USDT', comment: '突破前高，拉回關注' },
    { symbol: 'XRP-USDT', comment: '區間震盪，偏強整理' },
    { symbol: 'OP-USDT', comment: '回測支撐後轉強' },
    { symbol: 'FIL-USDT', comment: '上升趨勢穩定' },
    { symbol: 'INJ-USDT', comment: '突破下降壓力線' },
    { symbol: 'APT-USDT', comment: '走勢偏強，回踩可觀察' },
    { symbol: 'NEAR-USDT', comment: '高檔震盪偏強' },
    { symbol: 'ATOM-USDT', comment: '階梯式上升型態' },
    { symbol: 'PEPE-USDT', comment: '短線動能上升' },
    { symbol: 'ADA-USDT', comment: '逐步轉強，可佈局' }
  ];

  res.status(200).json(topCoins);
}
