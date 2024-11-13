const { useState, useEffect, useRef } = React;

// Add currencies configuration
const CURRENCIES = {
    USD: { flag: '🇺🇸', symbol: '$', name: 'Dollar' },
    EUR: { flag: '🇪🇺', symbol: '€', name: 'Euro' },
    GBP: { flag: '🇬🇧', symbol: '£', name: 'Pound' },
    JPY: { flag: '🇯🇵', symbol: '¥', name: 'Yen' },
    AUD: { flag: '🇦🇺', symbol: 'A$', name: 'Dollar' },
    CAD: { flag: '🇨🇦', symbol: 'C$', name: 'Dollar' },
    CHF: { flag: '🇨🇭', symbol: 'Fr', name: 'Franc' },
    CNY: { flag: '🇨🇳', symbol: '¥', name: 'Yuan' },
    HKD: { flag: '🇭🇰', symbol: 'HK$', name: 'Dollar' },
    NZD: { flag: '🇳🇿', symbol: 'NZ$', name: 'Dollar' },
    PHP: { flag: '🇵🇭', symbol: '₱', name: 'Peso' }
};

function CurrencyConverter() {
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [fromCurrency, setFromCurrency] = useState('PHP');
    const [toCurrency, setToCurrency] = useState('NZD');
    const [rates, setRates] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [expandedItem, setExpandedItem] = useState(null);
    const [expandedImage, setExpandedImage] = useState(null);
    const videoRef = useRef(null);
    const photoRef = useRef(null);
// Exchange rate fetch function
    const fetchExchangeRate = async () => {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            setRates(data.rates);
            setLastUpdated(new Date().toLocaleString());
            setError(null);
        } catch (err) {
            setError('Failed to fetch exchange rates. Using stored rates.');
            // Load cached rates if available
            const cachedRates = localStorage.getItem('cachedRates');
            if (cachedRates) {
                setRates(JSON.parse(cachedRates));
            }
        }
    };

    // Convert currency function
    const convertCurrency = (amount, from, to) => {
        if (!rates || !amount) return '';
        const usdAmount = from === 'USD' ? amount : amount / rates[from];
        return (usdAmount * rates[to]).toFixed(2);
    };

    const handleFromAmountChange = (e) => {
        const value = e.target.value;
        setFromAmount(value);
        setToAmount(convertCurrency(value, fromCurrency, toCurrency));
    };

    const handleCurrencyChange = (type, value) => {
        if (type === 'from') {
            setFromCurrency(value);
            setToAmount(convertCurrency(fromAmount, value, toCurrency));
        } else {
            setToCurrency(value);
            setToAmount(convertCurrency(fromAmount, fromCurrency, value));
        }
    };
return (
        <div className="min-h-screen p-4 space-y-6">
            {/* Main converter card */}
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-indigo-600 px-6 py-4">
                    <h1 className="text-2xl font-bold text-white text-center">Currency Converter</h1>
                    {lastUpdated && rates && (
                        <p className="text-indigo-100 text-sm text-center mt-1">
                            Rate: 1 {fromCurrency} = {convertCurrency(1, fromCurrency, toCurrency)} {toCurrency} (Updated: {lastUpdated})
                        </p>
                    )}
                </div>
                
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* From Currency Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                From Currency
                            </label>
                            <div className="flex space-x-2">
                                <select
                                    value={fromCurrency}
                                    onChange={(e) => handleCurrencyChange('from', e.target.value)}
                                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg shadow-sm"
                                >
                                    {Object.entries(CURRENCIES).map(([code, { flag, name }]) => (
                                        <option key={code} value={code}>
                                            {flag} {code}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    value={fromAmount}
                                    onChange={handleFromAmountChange}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm"
                                    placeholder={`Enter amount in ${fromCurrency}`}
                                />
                            </div>
                        </div>

                        {/* To Currency Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                To Currency
                            </label>
                            <div className="flex space-x-2">
                                <select
                                    value={toCurrency}
                                    onChange={(e) => handleCurrencyChange('to', e.target.value)}
                                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg shadow-sm"
                                >
                                    {Object.entries(CURRENCIES).map(([code, { flag, name }]) => (
                                        <option key={code} value={code}>
                                            {flag} {code}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    value={toAmount}
                                    readOnly
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50"
                                    placeholder={`Amount in ${toCurrency}`}
                                />
                            </div>
                        </div>

                        <button
                            onClick={saveAndReset}
                            disabled={!fromAmount || !toAmount}
                            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save & Reset
                        </button>

                        {isLoading && (
                            <div className="text-center text-gray-600 animate-pulse">
                                Processing...
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Rest of your existing components... */}
const saveAndReset = () => {
        if (fromAmount && toAmount) {
            const newEntry = {
                id: Date.now(),
                fromCurrency,
                toCurrency,
                fromAmount,
                toAmount,
                rate: convertCurrency(1, fromCurrency, toCurrency),
                timestamp: new Date().toLocaleString(),
                storeName: '',
                rating: 0,
                photo1: null,
                photo2: null
            };
            const newHistory = [newEntry, ...history.slice(0, 9)];
            setHistory(newHistory);
            localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
            setFromAmount('');
            setToAmount('');
        }
    };
// Inside your history mapping, update the display:
    <div className="flex justify-between items-center">
        <div>
            <span className="text-lg font-medium text-gray-900">
                {CURRENCIES[entry.fromCurrency].symbol}{entry.fromAmount} {entry.fromCurrency}
            </span>
            <span className="mx-2 text-gray-500">→</span>
            <span className="text-lg font-medium text-indigo-600">
                {CURRENCIES[entry.toCurrency].symbol}{entry.toAmount} {entry.toCurrency}
            </span>
        </div>
        {/* Rest of your entry display... */}
    </div>

    // Update the rate display in expanded view:
    <div className="text-sm text-gray-500">
        Rate: 1 {entry.fromCurrency} = {entry.rate} {entry.toCurrency}
    </div>
