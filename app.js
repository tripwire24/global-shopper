import { Menu, Settings, Camera } from 'lucide-react';

// Utility Functions
const STORAGE_KEYS = {
    HISTORY: 'globalShopper_history',
    LAST_CURRENCIES: 'globalShopper_lastCurrencies',
    LAST_RATES_UPDATE: 'globalShopper_lastRatesUpdate'
};

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
    RUB: { flag: '🇷🇺', symbol: '₽', name: 'Ruble' }
};
// Image compression utility
const compressImage = async (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.7);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
};

// Date formatting utility
const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
};

// Custom hooks
const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = React.useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error('Error writing to localStorage:', error);
        }
    };

    return [storedValue, setValue];
};

// Exchange rates hook
const useExchangeRates = () => {
    const [rates, setRates] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [lastUpdate, setLastUpdate] = React.useState(() => {
        return localStorage.getItem(STORAGE_KEYS.LAST_RATES_UPDATE) || null;
    });

    const fetchRates = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            
            if (!response.ok) {
                throw new Error('Failed to fetch exchange rates');
            }

            const data = await response.json();
            setRates(data.rates);
            const updateTime = new Date().toISOString();
            setLastUpdate(updateTime);
            localStorage.setItem(STORAGE_KEYS.LAST_RATES_UPDATE, updateTime);
        } catch (err) {
            setError(err.message);
            // Try to load cached rates if available
            const cachedRates = localStorage.getItem('cached_rates');
            if (cachedRates) {
                setRates(JSON.parse(cachedRates));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchRates();
        const interval = setInterval(fetchRates, 3600000); // Refresh every hour
        return () => clearInterval(interval);
    }, [fetchRates]);

    return { rates, loading, error, lastUpdate, refreshRates: fetchRates };
};

// Install prompt hook
const useInstallPrompt = () => {
    const [installPrompt, setInstallPrompt] = React.useState(null);

    React.useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const promptToInstall = async () => {
        if (installPrompt) {
            const result = await installPrompt.prompt();
            console.log('Install prompt result:', result);
            setInstallPrompt(null);
        }
    };

    return { installPrompt, promptToInstall };
};
// UI Components
const CurrencyInput = ({ value, onChange, currency, onCurrencyChange, rates, label, readonly = false }) => {
    const inputRef = React.useRef(null);
        const handleValueChange = (e) => {
        // Remove non-numeric characters except decimal point
        const sanitizedValue = e.target.value.replace(/[^\d.]/g, '');
        // Ensure only one decimal point
        const parts = sanitizedValue.split('.');
        if (parts.length > 2) return;
        onChange(sanitizedValue);
    };

    return (
        <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl mr-3">
                    {CURRENCIES[currency]?.flag}
                </span>
                <select
                    value={currency}
                    onChange={(e) => onCurrencyChange(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-lg border-none focus:ring-0">
                    {Object.entries(rates || {}).sort().map(([code]) => (
                        <option key={code} value={code}>
                            {code} / {CURRENCIES[code]?.name || code}
                        </option>
                    ))}
                </select>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleValueChange}
                    readOnly={readonly}
                    className="block w-full bg-transparent border-none outline-none text-right focus:ring-0"
                    placeholder="0.00"
                />
            </div>
        </div>
    );
};

const PhotoCapture = ({ onPhotoCapture, existingPhotos = [] }) => {
    const [previewUrls, setPreviewUrls] = React.useState(existingPhotos);
    const fileInputRef = React.useRef(null);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (file && previewUrls.length < 2) {
            try {
                const compressedBlob = await compressImage(file);
                const newPhotoUrl = URL.createObjectURL(compressedBlob);
                const newPhotos = [...previewUrls, newPhotoUrl];
                setPreviewUrls(newPhotos);
                onPhotoCapture(newPhotos);
            } catch (error) {
                console.error('Error processing image:', error);
                alert('Error processing image. Please try again.');
            }
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removePhoto = (index) => {
        const newPhotos = previewUrls.filter((_, i) => i !== index);
        setPreviewUrls(newPhotos);
        onPhotoCapture(newPhotos);
    };

    return (
        <div className="space-y-4">
            {previewUrls.length < 2 && (
                <div className="flex items-center justify-center">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="photo-input"
                    />
                    <label
                        htmlFor="photo-input"
                        className="cursor-pointer bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
                    >
                        Take Photo
                    </label>
                </div>
            )}
            <div className="flex space-x-2">
                {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                        <img
                            src={url}
                            alt={`Photo ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-md"
                        />
                        <button
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StarRating = ({ value, onChange }) => {
    const [hover, setHover] = React.useState(null);

    return (
        <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(null)}
                    className="focus:outline-none">
                    <svg
                        className={`w-6 h-6 ${
                            (hover || value) >= star ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            ))}
        </div>
    );
};

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
            <div className="relative bg-white rounded-lg p-6 max-w-lg w-full mx-4 fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

const InstallPrompt = ({ onInstall }) => (
    <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg border-t flex justify-between items-center">
        <div className="flex-1">
            <h3 className="font-medium">Install Global Shopper</h3>
            <p className="text-sm text-gray-600">Add to your home screen for quick access</p>
        </div>
        <div className="flex space-x-2">
            <button
                onClick={onInstall}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark">
                Install
            </button>
        </div>
    </div>
);
// History Components
const HistoryEntry = ({ entry, onDelete, onUpdate }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [storeName, setStoreName] = React.useState(entry.storeName || '');
    const [rating, setRating] = React.useState(entry.rating || 0);
    const [showPhotoModal, setShowPhotoModal] = React.useState(false);
    const [selectedPhoto, setSelectedPhoto] = React.useState(null);

    const handleUpdate = () => {
        onUpdate({
            ...entry,
            storeName,
            rating
        });
        setIsEditing(false);
    };

    const handlePhotoClick = (photoUrl) => {
        setSelectedPhoto(photoUrl);
        setShowPhotoModal(true);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
            {/* Basic Info - Always Visible */}
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        <span className="font-medium">
                            {CURRENCY_SYMBOLS[entry.fromCurrency] || ''}{entry.fromAmount} {entry.fromCurrency}
                        </span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <span className="font-medium">
                            {CURRENCY_SYMBOLS[entry.toCurrency] || ''}{entry.toAmount} {entry.toCurrency}
                        </span>
                    </div>
                    <div className="text-sm text-gray-500">{formatDate(entry.timestamp)}</div>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-400 hover:text-gray-600">
                    <svg
                        className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="space-y-4 pt-2 border-t">
                    {/* Store Name */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Store</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                                placeholder="Enter store name"
                            />
                        ) : (
                            <div className="flex items-center justify-between">
                                <span>{storeName || 'No store name'}</span>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-primary hover:text-primary-dark">
                                    Edit
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Rating */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Shopping Experience</label>
                        <StarRating value={rating} onChange={setRating} />
                    </div>

                    {/* Photos */}
                    {entry.photos && entry.photos.length > 0 && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Photos</label>
                            <div className="flex space-x-2">
                                {entry.photos.map((photo, index) => (
                                    <img
                                        key={index}
                                        src={photo}
                                        alt={`Shopping item ${index + 1}`}
                                        className="w-20 h-20 object-cover rounded-md cursor-pointer"
                                        onClick={() => handlePhotoClick(photo)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between pt-2">
                        <button
                            onClick={() => onDelete(entry.id)}
                            className="text-red-600 hover:text-red-700 text-sm">
                            Delete Entry
                        </button>
                        {isEditing && (
                            <button
                                onClick={handleUpdate}
                                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark text-sm">
                                Save Changes
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Photo Modal */}
            <Modal
                isOpen={showPhotoModal}
                onClose={() => setShowPhotoModal(false)}
                title="Photo View">
                {selectedPhoto && (
                    <img
                        src={selectedPhoto}
                        alt="Full size view"
                        className="w-full h-auto rounded-lg"
                    />
                )}
            </Modal>
        </div>
    );
};

const HistoryList = ({ history, onDeleteEntry, onUpdateEntry, onClearHistory }) => {
    const [showClearConfirm, setShowClearConfirm] = React.useState(false);

    if (history.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No conversion history yet.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Conversion History</h2>
                {history.length > 0 && (
                    <button
                        onClick={() => setShowClearConfirm(true)}
                        className="text-red-600 hover:text-red-700 text-sm">
                        Clear All
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {history.map((entry) => (
                    <HistoryEntry
                        key={entry.id}
                        entry={entry}
                        onDelete={onDeleteEntry}
                        onUpdate={onUpdateEntry}
                    />
                ))}
            </div>

            {/* Clear Confirmation Modal */}
            <Modal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                title="Clear History">
                <div className="space-y-4">
                    <p>Are you sure you want to clear all conversion history? This cannot be undone.</p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setShowClearConfirm(false)}
                            className="px-4 py-2 border rounded-md hover:bg-gray-50">
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onClearHistory();
                                setShowClearConfirm(false);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                            Clear All
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
// Main App Component
const App = () => {
    const { rates, loading, error, lastUpdate, refreshRates } = useExchangeRates();
    const { installPrompt, promptToInstall } = useInstallPrompt();
    
    // State management
    const [fromCurrency, setFromCurrency] = useLocalStorage('globalShopper_fromCurrency', 'USD');
    const [toCurrency, setToCurrency] = useLocalStorage('globalShopper_toCurrency', 'EUR');
    const [fromAmount, setFromAmount] = React.useState('');
    const [toAmount, setToAmount] = React.useState('');
    const [history, setHistory] = useLocalStorage(STORAGE_KEYS.HISTORY, []);
    const [photos, setPhotos] = React.useState([]);
    const [offline, setOffline] = React.useState(!navigator.onLine);

    // Handle online/offline status
    React.useEffect(() => {
        const handleOnline = () => setOffline(false);
        const handleOffline = () => setOffline(true);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Conversion logic
    const convertCurrency = (amount, from, to) => {
        if (!rates || !amount) return '';
        const usdAmount = from === 'USD' ? amount : amount / rates[from];
        return (usdAmount * rates[to]).toFixed(2);
    };

    const handleFromAmountChange = (value) => {
        setFromAmount(value);
        setToAmount(convertCurrency(value, fromCurrency, toCurrency));
    };

    const handleToAmountChange = (value) => {
        setToAmount(value);
        setFromAmount(convertCurrency(value, toCurrency, fromCurrency));
    };

    // History management
    const addToHistory = () => {
        if (!fromAmount || !toAmount) return;

        const newEntry = {
            id: Date.now(),
            fromCurrency,
            toCurrency,
            fromAmount,
            toAmount,
            timestamp: new Date().toISOString(),
            rate: rates[toCurrency] / rates[fromCurrency],
            photos: [...photos]
        };

        setHistory(prev => {
            const newHistory = [newEntry, ...prev].slice(0, 10);
            return newHistory;
        });

        // Reset form
        setFromAmount('');
        setToAmount('');
        setPhotos([]);
    };

    const deleteHistoryEntry = (id) => {
        setHistory(prev => prev.filter(entry => entry.id !== id));
    };

    const updateHistoryEntry = (updatedEntry) => {
        setHistory(prev => 
            prev.map(entry => 
                entry.id === updatedEntry.id ? updatedEntry : entry
            )
        );
    };

    const clearHistory = () => {
        setHistory([]);
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Header */}
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Global Shopper</h1>
                <p className="text-gray-600">Currency Converter & Shopping Assistant</p>
            </header>

            {/* Offline Warning */}
            {offline && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                You're offline. Some features may be limited.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Currency Converter */}
<div className="bg-blue-500 rounded-lg shadow-sm p-6 mb-6">
    <div className="flex justify-between items-center mb-6 text-white">
        <Menu className="w-6 h-6" />
        <Settings className="w-6 h-6" />
    </div>

    {error ? (
        <div className="text-red-600 mb-4">
            Error loading exchange rates. Please try again later.
        </div>
    ) : loading ? (
        <div className="flex justify-center items-center py-8">
            <div className="loading-spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
    ) : (
        <div className="bg-white rounded-lg p-6">
            <div className="space-y-6">
                <CurrencyInput
                    label="From"
                    value={fromAmount}
                    onChange={handleFromAmountChange}
                    currency={fromCurrency}
                    onCurrencyChange={setFromCurrency}
                    rates={rates}
                />
                <CurrencyInput
                    label="To"
                    value={toAmount}
                    onChange={handleToAmountChange}
                    currency={toCurrency}
                    onCurrencyChange={setToCurrency}
                    rates={rates}
                />
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                        Last updated: {lastUpdate ? formatDate(lastUpdate) : 'Never'}
                    </span>
                    <button
                        onClick={refreshRates}
                        className="text-primary hover:text-primary-dark">
                        Refresh Rates
                    </button>
                </div>

                <PhotoCapture
                    onPhotoCapture={setPhotos}
                    existingPhotos={photos}
                />
                
                <button
                    onClick={addToHistory}
                    disabled={!fromAmount || !toAmount}
                    className={`w-full py-3 px-4 rounded-lg ${
                        fromAmount && toAmount
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } transition-colors`}>
                    Save Conversion
                </button>
            </div>
        </div>
    )}
</div>

            {/* Conversion History */}
            <HistoryList
                history={history}
                onDeleteEntry={deleteHistoryEntry}
                onUpdateEntry={updateHistoryEntry}
                onClearHistory={clearHistory}
            />

            {/* Install Prompt */}
            {installPrompt && <InstallPrompt onInstall={promptToInstall} />}

            {/* Footer */}
            <footer className="mt-12 text-center text-sm text-gray-500">
                © 2024 Global Shopper™ | Developed by Tripwire Digital | All Rights Reserved
            </footer>
        </div>
    );
};

// Render the app
ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);
