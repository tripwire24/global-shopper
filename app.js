// Currency flag emoji mapping
const CURRENCY_FLAGS = {
    USD: '🇺🇸',
    EUR: '🇪🇺',
    GBP: '🇬🇧',
    JPY: '🇯🇵',
    AUD: '🇦🇺',
    CAD: '🇨🇦',
    CHF: '🇨🇭',
    CNY: '🇨🇳',
    NZD: '🇳🇿',
    PHP: '🇵🇭',
};

// Simple Card components
const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = '' }) => (
    <div className={`p-4 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }) => (
    <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = '' }) => (
    <div className={`p-4 ${className}`}>{children}</div>
);

function GlobalShopper() {
    const [fromCurrency, setFromCurrency] = useState('EUR');
    const [toCurrency, setToCurrency] = useState('USD');
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [rate, setRate] = useState(null);
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
    const fetchExchangeRate = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            setRate(data.rates[toCurrency] / data.rates[fromCurrency]);
            setLastUpdated(new Date().toLocaleString());
            setError(null);
        } catch (err) {
            setError('Failed to fetch exchange rate. Using stored rate.');
        } finally {
            setIsLoading(false);
        }
    };

    // Exchange rate fetch useEffect
    useEffect(() => {
        fetchExchangeRate();
        const interval = setInterval(fetchExchangeRate, 3600000); // Update every hour
        return () => clearInterval(interval);
    }, [fromCurrency, toCurrency]);

    // Filter currencies based on search term
    const filteredCurrencies = Object.keys(CURRENCY_FLAGS).filter(currency => 
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
        };
        return currencyNames[code] || code;
    }

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
const convertCurrency = (value, from, to) => {
        if (!rate) return '';
        
        const amount = parseFloat(value);
        if (isNaN(amount)) return '';

        const converted = amount * rate;
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

    // Handle photo capture function
    const handlePhotoCapture = async (id, photoNumber) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });

            // Create and add camera UI
            const cameraUI = document.createElement('div');
            cameraUI.innerHTML = `
                <div class="fixed inset-0 bg-black z-50 flex flex-col">
                    <video autoplay playsinline class="h-full w-full object-cover"></video>
                    <div class="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-4">
                        <button class="capture-btn bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
                            <span class="text-3xl">📸</span>
                        </button>
                        <button class="cancel-btn bg-red-500 text-white px-4 py-2 rounded-lg">
                            Cancel
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(cameraUI);

            const video = cameraUI.querySelector('video');
            video.srcObject = stream;
            await video.play();

            return new Promise((resolve, reject) => {
                const captureBtn = cameraUI.querySelector('.capture-btn');
                const cancelBtn = cameraUI.querySelector('.cancel-btn');

                cancelBtn.onclick = () => {
                    stream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(cameraUI);
                    reject('Camera cancelled');
                };

                captureBtn.onclick = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    canvas.getContext('2d').drawImage(video, 0, 0);

                    // Compress the image
                    const photoData = canvas.toDataURL('image/jpeg', 0.7); // 70% quality

                    stream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(cameraUI);

                    // Update history with new photo
                    const newHistory = history.map(item => {
                        if (item.id === id) {
                            return {
                                ...item,
                                [`photo${photoNumber}`]: photoData
                            };
                        }
                        return item;
                    });
                    setHistory(newHistory);
                    localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
                    resolve();
                };
            });
        } catch (err) {
            setError('Camera access denied or not available. Please check your permissions.');
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
                rate: rate,
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
                            {rate && (
                                <p>
                                    1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
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
{/* History Section */}
                {history.length > 0 && (
                    <div className="mt-8 bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900">Conversion History</h2>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="text-gray-500 hover:text-red-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {history.map(entry => (
                                <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-lg">{CURRENCY_FLAGS[entry.fromCurrency]}</span>
                                                    <span className="font-medium">{entry.fromAmount} {entry.fromCurrency}</span>
                                                </div>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className="text-lg">{CURRENCY_FLAGS[entry.toCurrency]}</span>
                                                    <span className="text-blue-600 font-medium">{entry.toAmount} {entry.toCurrency}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => handleHistoryItemExpand(entry.id)}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-full transition-colors"
                                            >
                                                {expandedItem === entry.id ? 'Less Info' : 'More Info'}
                                            </button>
                                            <button
                                                onClick={() => deleteHistoryItem(entry.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {expandedItem === entry.id && (
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Store Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={entry.storeName || ''}
                                                    onChange={(e) => handleStoreNameUpdate(entry.id, e.target.value)}
                                                    placeholder="Enter store name"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Purchase Intent Rating
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
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handlePhotoCapture(entry.id, 1)}
                                                                className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                                            >
                                                                <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
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
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handlePhotoCapture(entry.id, 2)}
                                                                className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                                            >
                                                                <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                <span className="text-sm text-gray-500">Add photo</span>
                                                            </button>
                    }}
                                                            </div>
                                                        </div>
                                                        </div>
                    
                                                        <div className="text-sm text-gray-500 space-y-1">
                                                            <p>Rate: 1 {entry.fromCurrency} = {entry.rate ? entry.rate.toFixed(4) : '0.0000'} {entry.toCurrency}</p>
                                                            <p>{entry.timestamp ? entry.timestamp : ''}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                {/* Delete All Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Delete All History?</h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Are you sure you want to delete all conversion history? This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={deleteAllHistory}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                        className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                        onClick={() => setExpandedImage(null)}
                    >
                        <div className="relative max-w-4xl w-full">
                            <img 
                                src={expandedImage} 
                                alt="Expanded view" 
                                className="max-w-full max-h-[90vh] object-contain mx-auto rounded-lg"
                            />
                            <button 
                                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                                onClick={() => setExpandedImage(null)}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
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
        </div>
    );
}

// Render the app
ReactDOM.render(
    <GlobalShopper />,
    document.getElementById('root')
);
