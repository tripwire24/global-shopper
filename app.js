const App = () => {
    const [amount, setAmount] = React.useState('');
    const [fromCurrency, setFromCurrency] = React.useState('USD');
    const [toCurrency, setToCurrency] = React.useState('EUR');
    const [result, setResult] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [currencies, setCurrencies] = React.useState([]);
    const [lastUpdated, setLastUpdated] = React.useState('');

    // Fetch available currencies on component mount
    React.useEffect(() => {
        fetchCurrencies();
    }, []);

    const fetchCurrencies = async () => {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            const availableCurrencies = Object.keys(data.rates);
            setCurrencies(availableCurrencies);
            setLastUpdated(new Date(data.time_last_updated * 1000).toLocaleString());
        } catch (error) {
            console.error('Error fetching currencies:', error);
        }
    };

    const convertCurrency = async () => {
        if (!amount || isNaN(amount)) {
            alert('Please enter a valid amount');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
            const data = await response.json();
            const rate = data.rates[toCurrency];
            const convertedAmount = (parseFloat(amount) * rate).toFixed(2);
            setResult(`${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`);
            setLastUpdated(new Date(data.time_last_updated * 1000).toLocaleString());
        } catch (error) {
            console.error('Error converting currency:', error);
            setResult('Error converting currency. Please try again.');
        }
        setLoading(false);
    };

    const swapCurrencies = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    return (
        <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
            <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
                <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
                    <div className="max-w-md mx-auto">
                        <div className="divide-y divide-gray-200">
                            <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                <h1 className="text-3xl font-bold text-center mb-8 text-indigo-600">Shopperex</h1>
                                
                                {/* Amount Input */}
                                <div className="mb-4">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Currency Selectors */}
                                <div className="flex items-center gap-4 mb-4">
                                    <select
                                        value={fromCurrency}
                                        onChange={(e) => setFromCurrency(e.target.value)}
                                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {currencies.map(currency => (
                                            <option key={currency} value={currency}>{currency}</option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={swapCurrencies}
                                        className="p-2 bg-indigo-100 rounded-full hover:bg-indigo-200"
                                    >
                                        ⇄
                                    </button>

                                    <select
                                        value={toCurrency}
                                        onChange={(e) => setToCurrency(e.target.value)}
                                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {currencies.map(currency => (
                                            <option key={currency} value={currency}>{currency}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Convert Button */}
                                <button
                                    onClick={convertCurrency}
                                    disabled={loading}
                                    className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    {loading ? 'Converting...' : 'Convert'}
                                </button>

                                {/* Result Display */}
                                {result && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                        <p className="text-lg font-semibold text-center">{result}</p>
                                    </div>
                                )}

                                {/* Last Updated */}
                                <div className="text-sm text-gray-500 text-center mt-4">
                                    Last updated: {lastUpdated}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));
