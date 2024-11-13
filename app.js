import React, { useState, useEffect, useRef } from 'react';

// Currency flag emoji mapping
const CURRENCY_FLAGS = {
    USD: '🇳🇱',
    EUR: '🇪🇺',
    GBP: '🇬🇧',
    JPY: '🇯🇵',
    AUD: '🇦🇺',
    CAD: '🇨🇦',
    CHF: '🇨🇭',
    CNY: '🇨🇳',
    NZD: '🇳🇿',
    PHP: '🇵🇭',
    // Add more currencies as needed
};

function GlobalShopper() {
    const [fromCurrency, setFromCurrency] = useState('EUR');
    const [toCurrency, setToCurrency] = useState('USD');
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [rates, setRates] = useState({});
    const [currencies, setCurrencies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [expandedItem, setExpandedItem] = useState(null);
    const [expandedImage, setExpandedImage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
    const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
    const videoRef = useRef(null);
    const photoRef = useRef(null);
    const fromDropdownRef = useRef(null);
    const toDropdownRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target)) {
                setIsFromDropdownOpen(false);
            }
            if (toDropdownRef.current && !toDropdownRef.current.contains(event.target)) {
                setIsToDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Filter currencies based on search term
    const filteredCurrencies = currencies.filter(currency => 
        currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCurrencyName(currency).toLowerCase().includes(searchTerm.toLowerCase())
    );

    function getCurrencyName(code) {
        const currencyNames = {
            USD: 'US Dollar',
            EUR: 'Euro',
            GBP: 'British Pound',
            JPY: 'Japanese Yen',
            AUD: 'Australian Dollar',
            CAD: 'Canadian Dollar',
            CHF: 'Swiss Franc',
            CNY: 'Chinese Yuan',
            NZD: 'New Zealand Dollar',
            PHP: 'Philippine Peso',
            // Add more currency names as needed
        };
        return currencyNames[code] || code;
    }
    // Data persistence useEffect
    useEffect(() => {
        const loadSavedData = () => {
            const savedHistory = localStorage.getItem('conversionHistory');
            if (savedHistory) {
                try {
                    setHistory(JSON.parse(savedHistory));
                } catch (e) {
                    console.error('Error loading saved data:', e);
                    localStorage.removeItem('conversionHistory');
                }
            }
        };

        loadSavedData();
        window.addEventListener('storage', loadSavedData);
        window.addEventListener('historyUpdate', loadSavedData);

        return () => {
            window.removeEventListener('storage', loadSavedData);
            window.removeEventListener('historyUpdate', loadSavedData);
        };
    }, []);

    // Exchange rate fetch function
    const fetchExchangeRates = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            setRates(data.rates);
            setCurrencies(Object.keys(data.rates).sort());
            setLastUpdated(new Date().toLocaleString());
            setError(null);
        } catch (err) {
            setError('Failed to fetch exchange rates. Using stored rates.');
            setCurrencies(Object.keys(CURRENCY_FLAGS));
        } finally {
            setIsLoading(false);
        }
    };

    // Exchange rate fetch useEffect
    useEffect(() => {
        fetchExchangeRates();
        const interval = setInterval(fetchExchangeRates, 3600000); // Update every hour
        return () => clearInterval(interval);
    }, []);

    const convertCurrency = (value, from, to) => {
        if (!rates.USD) return '';
        
        const amount = parseFloat(value);
        if (isNaN(amount)) return '';

        // Convert through USD as base rate
        const inUSD = amount / rates[from];
        const converted = inUSD * rates[to];
        return converted.toFixed(2);
    };

    const handleFromAmountChange = (e) => {
        const value = e.target.value;
        setFromAmount(value);
        setToAmount(convertCurrency(value, fromCurrency, toCurrency));
    };

    const handleCurrencyChange = (currency, type) => {
        if (type === 'from') {
            setFromCurrency(currency);
            setToAmount(convertCurrency(fromAmount, currency, toCurrency));
            setIsFromDropdownOpen(false);
        } else {
            setToCurrency(currency);
            setToAmount(convertCurrency(fromAmount, fromCurrency, currency));
            setIsToDropdownOpen(false);
        }
    };

    const saveAndReset = () => {
        if (fromAmount && toAmount) {
            const newEntry = {
                id: Date.now(),
                fromCurrency,
                toCurrency,
                fromAmount,
                toAmount,
                rate: rates[toCurrency] / rates[fromCurrency],
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

    const handleHistoryItemExpand = (id) => {
        setExpandedItem(expandedItem === id ? null : id);
    };

    const handleStoreNameUpdate = (id, storeName) => {
        const newHistory = history.map(item => {
            if (item.id === id) {
                return { ...item, storeName };
            }
            return item;
        });
        setHistory(newHistory);
        localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
    };

    const handleRatingUpdate = (id, rating) => {
        const newHistory = history.map(item => {
            if (item.id === id) {
                return { ...item, rating };
            }
            return item;
        });
        setHistory(newHistory);
        localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
    };

    const deleteHistoryItem = (id) => {
        const newHistory = history.filter(item => item.id !== id);
        setHistory(newHistory);
        localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
    };

    const deleteAllHistory = () => {
        setHistory([]);
        localStorage.removeItem('conversionHistory');
        setShowDeleteConfirm(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">
                            🌍 The Global Shopper
                        </h1>
                        {lastUpdated && (
                            <p className="text-sm text-gray-500">
                                Updated: {lastUpdated}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Converter Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="p-6">
                        {error && (
                            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Currency Converter Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* From Currency Section */}
                            <div ref={fromDropdownRef} className="relative">
                                <div 
                                    onClick={() => setIsFromDropdownOpen(!isFromDropdownOpen)}
                                    className="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">
                                                {CURRENCY_FLAGS[fromCurrency]}
                                            </span>
                                            <div>
                                                <div className="font-medium">{fromCurrency}</div>
                                                <div className="text-sm text-gray-500">
                                                    {getCurrencyName(fromCurrency)}
                                                </div>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <input
                                        type="number"
                                        value={fromAmount}
                                        onChange={handleFromAmountChange}
                                        className="mt-4 w-full bg-white rounded-lg border-2 border-gray-200 p-3 text-lg focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder={`Enter amount in ${fromCurrency}`}
                                    />
                                </div>
                                
                                {/* From Currency Dropdown */}
                                {isFromDropdownOpen && (
                                    <div className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                                        <div className="p-2">
                                            <input
                                                type="text"
                                                placeholder="Search currency..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {filteredCurrencies.map((currency) => (
                                                <div
                                                    key={currency}
                                                    onClick={() => handleCurrencyChange(currency, 'from')}
                                                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                                                >
                                                    <span className="text-xl">{CURRENCY_FLAGS[currency] || '🌐'}</span>
                                                    <div>
                                                        <div className="font-medium">{currency}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {getCurrencyName(currency)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
{/* To Currency Section */}
                            <div ref={toDropdownRef} className="relative">
                                <div 
                                    onClick={() => setIsToDropdownOpen(!isToDropdownOpen)}
                                    className="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">
                                                {CURRENCY_FLAGS[toCurrency]}
                                            </span>
                                            <div>
                                                <div className="font-medium">{toCurrency}</div>
                                                <div className="text-sm text-gray-500">
                                                    {getCurrencyName(toCurrency)}
                                                </div>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={toAmount}
                                        readOnly
                                        className="mt-4 w-full bg-white rounded-lg border-2 border-gray-200 p-3 text-lg"
                                        placeholder={`Converted amount in ${toCurrency}`}
                                    />
                                </div>

                                {/* To Currency Dropdown */}
                                {isToDropdownOpen && (
                                    <div className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                                        <div className="p-2">
                                            <input
                                                type="text"
                                                placeholder="Search currency..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {filteredCurrencies.map((currency) => (
                                                <div
                                                    key={currency}
                                                    onClick={() => handleCurrencyChange(currency, 'to')}
                                                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                                                >
                                                    <span className="text-xl">{CURRENCY_FLAGS[currency] || '🌐'}</span>
                                                    <div>
                                                        <div className="font-medium">{currency}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {getCurrencyName(currency)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Exchange Rate Display */}
                        <div className="mt-6 text-center text-sm text-gray-500">
                            {rates[fromCurrency] && rates[toCurrency] && (
                                <p>
                                    1 {fromCurrency} = {(rates[toCurrency] / rates[fromCurrency]).toFixed(4)} {toCurrency}
                                </p>
                            )}
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={saveAndReset}
                            disabled={!fromAmount || !toAmount}
                            className="mt-6 w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save & Reset
                        </button>

                        {isLoading && (
                            <div className="mt-4 text-center text-gray-600">
                                <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                <span className="ml-2">Updating rates...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GlobalShopper;
