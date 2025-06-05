import requests
import pandas as pd
import pandas_ta as ta
import json
import os

symbols = [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
    "DOGEUSDT", "ADAUSDT", "LTCUSDT", "AVAXUSDT", "MATICUSDT",
    "DOTUSDT", "LINKUSDT", "OPUSDT", "ARBUSDT", "PEPEUSDT",
    "SHIBUSDT", "TONUSDT", "FTMUSDT", "SUIUSDT", "NEARUSDT"
]

def fetch_klines(symbol, interval="1h", limit=200):
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit={limit}"
    try:
        res = requests.get(url, timeout=10)
        data = res.json()
        df = pd.DataFrame(data, columns=[
            "timestamp", "open", "high", "low", "close", "volume",
            "close_time", "qav", "trades", "tbbav", "tbqav", "ignore"
        ])
        df["close"] = df["close"].astype(float)
        return df
    except:
        return None

def analyze(df):
    df["EMA144"] = ta.ema(df["close"], length=144)
    df["EMA169"] = ta.ema(df["close"], length=169)
    df["EMA576"] = ta.ema(df["close"], length=576)
    df["EMA676"] = ta.ema(df["close"], length=676)
    macd = ta.macd(df["close"])
    df["MACD"] = macd["MACD_12_26_9"]
    df["MACD_signal"] = macd["MACDs_12_26_9"]
    df["RSI"] = ta.rsi(df["close"])
    return df

def is_candidate(df):
    latest = df.iloc[-1]
    if latest["close"] > latest["EMA144"] and latest["close"] > latest["EMA169"]:
        if latest["MACD"] > latest["MACD_signal"]:
            if 50 < latest["RSI"] < 70:
                return True
    return False

results = []

for sym in symbols:
    df = fetch_klines(sym)
    if df is not None and len(df) > 150:
        df = analyze(df)
        if is_candidate(df):
            results.append({
                "symbol": sym.replace("USDT", "-USDT"),
                "comment": "符合多頭條件（Vegas + MACD + RSI）"
            })

results = results[:15]

output = f"export default {json.dumps(results, indent=2)};"
os.makedirs("api", exist_ok=True)

with open("api/recommend.js", "w", encoding="utf-8") as f:
    f.write(output)

print("✅ 已輸出 api/recommend.js 共推薦：", len(results), "隻幣")
