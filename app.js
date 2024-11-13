// app.js: Main JavaScript for Global Shopper PWA

// Base URL for exchange rates API
const BASE_URL = 'https://api.exchangerate-api.com/v4/latest/';

// DOM elements
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const fromAmount = document.getElementById('fromAmount');
const toAmount = document.getElementById('toAmount');
const historyList = document.getElementById('historyList');
const convertButton = document.getElementById('convertButton');
const lastUpdate = document.getElementById('lastUpdate');

// Conversion history array
let conversionHistory = JSON.parse(localStorage.getItem('conversionHistory')) || [];

// Initialize the app
async function init() {
  loadCurrencies();
  displayHistory();
  convertButton.addEventListener('click', convertCurrency);
  registerServiceWorker();
}

// Load currencies into select elements
async function loadCurrencies() {
  try {
    const res = await fetch(BASE_URL + 'USD'); // Fetching for example to get all currency codes
    const data = await res.json();
    const currencies = Object.keys(data.rates);
    currencies.forEach(currency => {
      const option1 = document.createElement('option');
      option1.value = currency;
      option1.textContent = currency;
      fromCurrency.appendChild(option1);

      const option2 = document.createElement('option');
      option2.value = currency;
      option2.textContent = currency;
      toCurrency.appendChild(option2);
    });

    // Set last selected currencies
    fromCurrency.value = localStorage.getItem('fromCurrency') || 'USD';
    toCurrency.value = localStorage.getItem('toCurrency') || 'EUR';
  } catch (error) {
    console.error('Error loading currencies', error);
  }
}

// Convert the currency
async function convertCurrency() {
  const from = fromCurrency.value;
  const to = toCurrency.value;
  const amount = parseFloat(fromAmount.value);

  if (isNaN(amount)) {
    alert('Please enter a valid amount');
    return;
  }

  try {
    const res = await fetch(BASE_URL + from);
    const data = await res.json();
    const rate = data.rates[to];
    const convertedAmount = (amount * rate).toFixed(2);
    toAmount.value = convertedAmount;

    // Save conversion details
    saveConversion({ from, to, amount, rate });

    // Update UI
    const updateTime = new Date(data.time_last_updated * 1000).toLocaleString();
    lastUpdate.textContent = `Last updated: ${updateTime}`;

    // Store last selected currencies
    localStorage.setItem('fromCurrency', from);
    localStorage.setItem('toCurrency', to);
  } catch (error) {
    console.error('Error fetching exchange rate', error);
  }
}

// Save conversion to history
function saveConversion({ from, to, amount, rate }) {
  const conversion = {
    from,
    to,
    amount,
    convertedAmount: (amount * rate).toFixed(2),
    rate,
    timestamp: new Date().toLocaleString(),
    storeName: '',
    interestRating: 0
  };

  conversionHistory.unshift(conversion);
  if (conversionHistory.length > 10) {
    conversionHistory.pop();
  }

  localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
  displayHistory();
}

// Display conversion history
function displayHistory() {
  historyList.innerHTML = '';
  conversionHistory.forEach((entry, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${entry.amount} ${entry.from} ➞ ${entry.convertedAmount} ${entry.to}</strong>
        <p>Rate: ${entry.rate} | ${entry.timestamp}</p>
        <input type="text" placeholder="Store name" value="${entry.storeName}" data-index="${index}" class="storeNameInput">
        <input type="number" min="1" max="5" value="${entry.interestRating}" data-index="${index}" class="interestRatingInput">
      </div>
    `;
    historyList.appendChild(li);
  });

  // Event listeners for editable fields
  document.querySelectorAll('.storeNameInput').forEach(input => {
    input.addEventListener('input', updateStoreName);
  });

  document.querySelectorAll('.interestRatingInput').forEach(input => {
    input.addEventListener('input', updateInterestRating);
  });
}

// Update store name in history
function updateStoreName(event) {
  const index = event.target.dataset.index;
  conversionHistory[index].storeName = event.target.value;
  localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
}

// Update interest rating in history
function updateInterestRating(event) {
  const index = event.target.dataset.index;
  conversionHistory[index].interestRating = parseInt(event.target.value);
  localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
}

// Register service worker for PWA features
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed', error);
    }
  }
}

init();
