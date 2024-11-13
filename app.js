import React, { useState, useEffect, useRef } from 'react';

function CurrencyConverter() {
    const [fromCurrency, setFromCurrency] = useState('PHP');
    const [toCurrency, setToCurrency] = useState('NZD');
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
    const videoRef = useRef(null);
    const photoRef = useRef(null);

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
            // Provide some basic currencies as fallback
            setCurrencies(['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'PHP', 'NZD']);
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

    const handleCurrencyChange = (value, type) => {
        if (type === 'from') {
            setFromCurrency(value);
            setToAmount(convertCurrency(fromAmount, value, toCurrency));
        } else {
            setToCurrency(value);
            setToAmount(convertCurrency(fromAmount, fromCurrency, value));
        }
    };

    // StarRating component remains the same
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

    return (
        <div className="min-h-screen p-4 space-y-6">
            {/* Main converter card */}
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-indigo-600 px-6 py-4">
                    <h1 className="text-2xl font-bold text-white text-center">Currency Converter</h1>
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
                        {/* From Currency Section */}
                        <div className="space-y-2">
                            <div className="flex space-x-2">
                                <div className="w-1/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        From
                                    </label>
                                    <select
                                        value={fromCurrency}
                                        onChange={(e) => handleCurrencyChange(e.target.value, 'from')}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {currencies.map(curr => (
                                            <option key={curr} value={curr}>{curr}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-2/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        value={fromAmount}
                                        onChange={handleFromAmountChange}
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder={`Enter amount in ${fromCurrency}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* To Currency Section */}
                        <div className="space-y-2">
                            <div className="flex space-x-2">
                                <div className="w-1/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        To
                                    </label>
                                    <select
                                        value={toCurrency}
                                        onChange={(e) => handleCurrencyChange(e.target.value, 'to')}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {currencies.map(curr => (
                                            <option key={curr} value={curr}>{curr}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-2/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Converted Amount
                                    </label>
                                    <input
                                        type="text"
                                        value={toAmount}
                                        readOnly
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50"
                                    />
                                </div>
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
                                Updating rates...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* History section remains largely the same, just update display of currencies */}
            {history.length > 0 && (
                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Conversion History</h2>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="text-white hover:text-red-200 transition"
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
                                            {entry.fromAmount} {entry.fromCurrency}
                                        </span>
                                        <span className="mx-2 text-gray-500">→</span>
                                        <span className="text-lg font-medium text-indigo-600">
                                            {entry.toAmount} {entry.toCurrency}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleHistoryItemExpand(entry.id)}
                                        className="text-sm text-indigo-600 hover:text-indigo-800"
                                    >
                                        {expandedItem === entry.id ? 'Less' : 'More'}
                                    </button>
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
                                                onChange={(e) => {
                                                    const newHistory = history.map(item => {
                                                        if (item.id === entry.id) {
                                                            return { ...item, storeName: e.target.value };
                                                        }
                                                        return item;
                                                    });
                                                    setHistory(newHistory);
                                                    localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
                                                }}
                                                placeholder="Enter store name"
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Purchase Intent Rating
                                            </label>
                                            <StarRating
                                                rating={entry.rating || 0}
                                                onRatingChange={(rating) => {
                                                    const newHistory = history.map(item => {
                                                        if (item.id === entry.id) {
                                                            return { ...item, rating };
                                                        }
                                                        return item;
                                                    });
                                                    setHistory(newHistory);
                                                    localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
                                                }}
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
                                                            <span className="text-sm text-gray-500">Tap to capture</span>
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
                                                            <span className="text-sm text-gray-500">Tap to capture</span>
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

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-medium mb-4">Delete All History?</h3>
                        <p className="text-gray-500 mb-4">This action cannot be undone.</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setHistory([]);
                                    localStorage.removeItem('conversionHistory');
                                    setShowDeleteConfirm(false);
                                }}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                            >
                                Delete
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
