// app.js
const { useState, useEffect } = React;

function App() {
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('EUR');
    const [exchangeRate, setExchangeRate] = useState(null);
    const [amount, setAmount] = useState(1);
    const [conversionHistory, setConversionHistory] = useState(JSON.parse(localStorage.getItem('history')) || []);
    const [lastUpdate, setLastUpdate] = useState(null);

    useEffect(() => {
        fetchExchangeRate();
    }, [fromCurrency, toCurrency]);

    const fetchExchangeRate = async () => {
        try {
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
            if (response.ok) {
                const data = await response.json();
                setExchangeRate(data.rates[toCurrency]);
                setLastUpdate(data.time_last_updated);
            } else {
                throw new Error("Failed to fetch exchange rates.");
            }
        } catch (error) {
            console.error("Error fetching exchange rate: ", error);
        }
    };

    const handleConvert = (event) => {
        event.preventDefault();
        const result = amount * exchangeRate;
        saveToHistory(result);
    };

    const saveToHistory = (convertedAmount) => {
        const newHistory = [
            {
                from: fromCurrency,
                to: toCurrency,
                fromAmount: amount,
                toAmount: convertedAmount,
                rate: exchangeRate,
                storeName: "",
                rating: 0,
                photos: [],
                timestamp: new Date().toISOString(),
            },
            ...conversionHistory.slice(0, 9),
        ];
        setConversionHistory(newHistory);
        localStorage.setItem("history", JSON.stringify(newHistory));
    };

    return (
        <div className="bg-white p-5 rounded shadow">
            <h1 className="text-2xl font-bold text-indigo-600 mb-4">Global Shopper</h1>
            <form onSubmit={handleConvert} className="flex items-center gap-2">
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="border rounded p-2 w-20"
                />
                <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="border rounded p-2"
                >
                    {/* Currency options here */}
                </select>
                <span>to</span>
                <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="border rounded p-2"
                >
                    {/* Currency options here */}
                </select>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">
                    Convert
                </button>
            </form>
            {exchangeRate && (
                <p className="mt-4 text-lg">
                    {amount} {fromCurrency} = {(amount * exchangeRate).toFixed(2)} {toCurrency}
                </p>
            )}
            {lastUpdate && <p className="text-sm text-gray-500">Last updated: {new Date(lastUpdate * 1000).toLocaleString()}</p>}
            <h2 className="text-xl mt-5 font-semibold">Conversion History</h2>
            <div className="mt-3">
                {conversionHistory.map((entry, index) => (
                    <div key={index} className="border rounded p-4 mb-3">
                        <p>
                            {entry.fromAmount} {entry.from} to {entry.toAmount.toFixed(2)} {entry.to}
                        </p>
                        <p className="text-sm text-gray-500">
                            Exchange rate: {entry.rate} at {new Date(entry.timestamp).toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
