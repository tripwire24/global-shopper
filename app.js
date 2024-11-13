import React, { useState, useEffect, useRef } from 'react';

function CurrencyConverter() {
    // State declarations
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('EUR');
    const [rate, setRate] = useState(null);
    const [rates, setRates] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [expandedItem, setExpandedItem] = useState(null);
    const [expandedImage, setExpandedImage] = useState(null);
    const [currencies, setCurrencies] = useState([]);
    const videoRef = useRef(null);
    const photoRef = useRef(null);

    // Common currency symbols
    const currencySymbols = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
        'AUD': 'A$', 'NZD': 'NZ$', 'PHP': '₱', 'CAD': 'C$',
        'CHF': 'Fr', 'CNY': '¥', 'HKD': 'HK$', 'SGD': 'S$'
    };

    // Data persistence
    useEffect(() => {
        const loadSavedData = () => {
            const savedHistory = localStorage.getItem('conversionHistory');
            const savedFromCurrency = localStorage.getItem('fromCurrency');
            const savedToCurrency = localStorage.getItem('toCurrency');
            
            if (savedHistory) {
                try {
                    setHistory(JSON.parse(savedHistory));
                } catch (e) {
                    console.error('Error loading saved data:', e);
                    localStorage.removeItem('conversionHistory');
                }
            }
            
            if (savedFromCurrency) setFromCurrency(savedFromCurrency);
            if (savedToCurrency) setToCurrency(savedToCurrency);
        };

        loadSavedData();
        window.addEventListener('storage', loadSavedData);
        window.addEventListener('historyUpdate', loadSavedData);

        return () => {
            window.removeEventListener('storage', loadSavedData);
            window.removeEventListener('historyUpdate', loadSavedData);
        };
    }, []);

    // Storage check
    useEffect(() => {
        const checkStorage = async () => {
            try {
                const estimate = await navigator.storage.estimate();
                const percentageUsed = (estimate.usage / estimate.quota) * 100;
                if (percentageUsed > 80) {
                    setError('Storage space is running low. Consider deleting some photos.');
                }
            } catch (err) {
                console.log('Storage estimation not available');
            }
        };
        checkStorage();
    }, [history]);

    // Exchange rate fetching
    const fetchExchangeRates = async () => {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            setRates(data.rates);
            setCurrencies(Object.keys(data.rates).sort());
            updateRate(fromCurrency, toCurrency, data.rates);
            setLastUpdated(new Date().toLocaleString());
            setError(null);
        } catch (err) {
            setError('Failed to fetch exchange rates. Using stored rates.');
        }
    };

    // Update conversion rate
    const updateRate = (from, to, currentRates = rates) => {
        if (currentRates[from] && currentRates[to]) {
            const rateToUSD = 1 / currentRates[from];
            const rateFromUSDToTarget = currentRates[to];
            setRate(rateToUSD * rateFromUSDToTarget);
        }
    };

    // Initialize exchange rates
    useEffect(() => {
        fetchExchangeRates();
        const interval = setInterval(fetchExchangeRates, 3600000); // Refresh every hour
        return () => clearInterval(interval);
    }, []);

    // Update rate when currencies change
    useEffect(() => {
        updateRate(fromCurrency, toCurrency);
        localStorage.setItem('fromCurrency', fromCurrency);
        localStorage.setItem('toCurrency', toCurrency);
    }, [fromCurrency, toCurrency, rates]);

    // Currency conversion functions
    const convertCurrency = (value, direction = 'from') => {
        const amount = parseFloat(value);
        if (!isNaN(amount) && rate) {
            if (direction === 'from') {
                setToAmount((amount * rate).toFixed(2));
            } else {
                setFromAmount((amount / rate).toFixed(2));
            }
        } else {
            direction === 'from' ? setToAmount('') : setFromAmount('');
        }
    };

    const handleFromAmountChange = (e) => {
        const value = e.target.value;
        setFromAmount(value);
        convertCurrency(value, 'from');
    };

    const handleToAmountChange = (e) => {
        const value = e.target.value;
        setToAmount(value);
        convertCurrency(value, 'to');
    };
    // History management functions
    const saveAndReset = () => {
        if (fromAmount && toAmount) {
            const newEntry = {
                id: Date.now(),
                fromCurrency,
                toCurrency,
                fromAmount,
                toAmount,
                rate,
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

    // Star Rating Component
    const StarRating = ({ rating, onRatingChange }) => {
        return (
            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => onRatingChange(star)}
                        className="focus:outline-none"
                    >
                        <svg
                            className={`w-6 h-6 ${
                                star <= rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </button>
                ))}
            </div>
        );
    };

    // Main UI Render
    return (
        <div className="min-h-screen p-4 space-y-6">
            {/* Main converter card */}
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-indigo-600 px-6 py-4">
                    <h1 className="text-2xl font-bold text-white text-center">Global Shopper</h1>
                    {lastUpdated && (
                        <p className="text-indigo-100 text-sm text-center mt-1">
                            Last Updated: {lastUpdated}
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
                        {/* Currency Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    From Currency
                                </label>
                                <select
                                    value={fromCurrency}
                                    onChange={(e) => setFromCurrency(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {currencies.map(currency => (
                                        <option key={currency} value={currency}>
                                            {currency}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    To Currency
                                </label>
                                <select
                                    value={toCurrency}
                                    onChange={(e) => setToCurrency(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {currencies.map(currency => (
                                        <option key={currency} value={currency}>
                                            {currency}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Amount Inputs */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount ({fromCurrency})
                                </label>
                                <input
                                    type="number"
                                    value={fromAmount}
                                    onChange={handleFromAmountChange}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    placeholder={`Enter amount in ${fromCurrency}`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount ({toCurrency})
                                </label>
                                <input
                                    type="number"
                                    value={toAmount}
                                    onChange={handleToAmountChange}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
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
                    </div>
                </div>
            </div>

            {/* History section */}
            {history.length > 0 && (
                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Conversion History</h2>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="text-white hover:opacity-75 transition"
                        >
                            Delete All
                        </button>
                    </div>
                    <div className="divide-y divide-gray-200 max-h-96 overflow-auto">
                        {history.map(entry => (
                            <div key={entry.id} className="p-4 hover:bg-gray-50 transition">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-lg font-medium text-gray-900">
                                            {currencySymbols[entry.fromCurrency] || ''}{entry.fromAmount} {entry.fromCurrency}
                                        </span>
                                        <span className="mx-2 text-gray-500">→</span>
                                        <span className="text-lg font-medium text-indigo-600">
                                            {currencySymbols[entry.toCurrency] || ''}{entry.toAmount} {entry.toCurrency}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={() => handleHistoryItemExpand(entry.id)}
                                            className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                                        >
                                            {expandedItem === entry.id ? 'Less Info' : 'More Info'}
                                        </button>
                                        <button
                                            onClick={() => deleteHistoryItem(entry.id)}
                                            className="text-red-600 hover:text-red-800 transition"
                                            aria-label="Delete"
                                        >
                                            ⛔
                                        </button>
                                    </div>
                                </div>
{expandedItem === entry.id && (
                                    <div className="mt-4 space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Store Name
                                            </label>
                                            <input
                                                type="text"
                                                value={entry.storeName || ''}
                                                onChange={(e) => handleStoreNameUpdate(entry.id, e.target.value)}
                                                placeholder="Enter store name"
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Shopping Interest Rating
                                            </label>
                                            <StarRating
                                                rating={entry.rating || 0}
                                                onRatingChange={(rating) => handleRatingUpdate(entry.id, rating)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Photos
                                            </label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Photo 1 */}
                                                <div className="relative">
                                                    {entry.photo1 ? (
                                                        <div className="relative group">
                                                            <img
                                                                src={entry.photo1}
                                                                alt="Photo 1"
                                                                className="w-full h-32 object-cover rounded-lg cursor-pointer"
                                                                onClick={() => setExpandedImage(entry.photo1)}
                                                            />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const newHistory = history.map(item => {
                                                                        if (item.id === entry.id) {
                                                                            return { ...item, photo1: null };
                                                                        }
                                                                        return item;
                                                                    });
                                                                    setHistory(newHistory);
                                                                    localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
                                                                }}
                                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                ❌
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handlePhotoCapture(entry.id, 1)}
                                                            className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
                                                        >
                                                            <span className="text-4xl text-gray-400 mb-1">📷</span>
                                                            <span className="text-sm text-gray-500">Add photo</span>
                                                        </button>
                                                    )}
                                                </div>
                                                {/* Photo 2 */}
                                                <div className="relative">
                                                    {entry.photo2 ? (
                                                        <div className="relative group">
                                                            <img
                                                                src={entry.photo2}
                                                                alt="Photo 2"
                                                                className="w-full h-32 object-cover rounded-lg cursor-pointer"
                                                                onClick={() => setExpandedImage(entry.photo2)}
                                                            />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const newHistory = history.map(item => {
                                                                        if (item.id === entry.id) {
                                                                            return { ...item, photo2: null };
                                                                        }
                                                                        return item;
                                                                    });
                                                                    setHistory(newHistory);
                                                                    localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
                                                                }}
                                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                ❌
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handlePhotoCapture(entry.id, 2)}
                                                            className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
                                                        >
                                                            <span className="text-4xl text-gray-400 mb-1">📷</span>
                                                            <span className="text-sm text-gray-500">Add photo</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Rate: 1 {entry.fromCurrency} = {entry.rate?.toFixed(4)} {entry.toCurrency}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {entry.timestamp}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Delete All Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Delete All History?</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete all conversion history? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteAllHistory}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                Delete All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Expanded Image Modal */}
            {expandedImage && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
                    onClick={() => setExpandedImage(null)}
                >
                    <img 
                        src={expandedImage} 
                        alt="Expanded view" 
                        className="max-w-full max-h-full object-contain"
                    />
                    <button 
                        className="absolute top-4 right-4 text-white text-xl p-2"
                        onClick={() => setExpandedImage(null)}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Hidden video and canvas elements for photo capture */}
            <video
                ref={videoRef}
                style={{ display: 'none' }}
                playsInline
            />
            <canvas
                ref={photoRef}
                style={{ display: 'none' }}
            />
        </div>
    );
}

export default CurrencyConverter;
