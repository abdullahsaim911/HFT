import yfinance as yf
import pandas as pd
import os
from datetime import datetime

# 1. Setup Storage Folder
DATA_DIR = "historical_data"
os.makedirs(DATA_DIR, exist_ok=True)

# 2. Define Coins and Start Dates (Earliest realistic dates)
coins = {
    "BTC":  "BTC-USD",  # Bitcoin
    "ETH":  "ETH-USD",  # Ethereum
    "XRP":  "XRP-USD",  # Ripple
    "LTC":  "LTC-USD",  # Litecoin
    "ADA":  "ADA-USD",  # Cardano
    "DOGE": "DOGE-USD", # Dogecoin
    "BNB":  "BNB-USD"   # Binance Coin
}

print(f"--- Downloading Historical Data to '{DATA_DIR}/' ---")

for name, ticker in coins.items():
    print(f"⬇️ Downloading {name} ({ticker})...")
    
    # 3. Fetch Maximum History
    # 'period="max"' fetches data from the day the coin was listed on Yahoo Finance
    df = yf.download(ticker, period="max", interval="1d")
    
    # 4. Clean and Format Data for your HFT Engine
    if len(df) > 0:
        # Reset index to make 'Date' a column
        df.reset_index(inplace=True)
        
        # Standardize Columns (Lowercase, specific names)
        # yfinance columns are: Date, Open, High, Low, Close, Adj Close, Volume
        df = df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
        df.columns = ['date', 'open', 'high', 'low', 'close', 'volume']
        
        # Save to CSV
        file_path = os.path.join(DATA_DIR, f"{name}_history.csv")
        df.to_csv(file_path, index=False)
        
        # Stats
        start_date = df['date'].iloc[0].date()
        end_date = df['date'].iloc[-1].date()
        years = round((df['date'].iloc[-1] - df['date'].iloc[0]).days / 365, 1)
        
        print(f"   ✅ Saved {len(df)} rows ({years} years)")
        print(f"      Range: {start_date} -> {end_date}")
    else:
        print(f"   ❌ No data found for {name}")

print("\n✨ Download Complete! Check the 'historical_data' folder.")