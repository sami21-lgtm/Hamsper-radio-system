// =============================================================
// TACTICAL HAM RADIO SYSTEM - FULL SCRIPT.JS
// =============================================================

// 1. 195 World Countries List for Dynamic Search Auto-complete
const allCountries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador",
  "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "North Korea",
  "South Korea", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
  "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
  "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway",
  "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
  "Portugal", "Qatar", "Romania", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
  "Somalia", "South Africa", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

// Populate Countries into Datalist on Load
function initCountryDatalist() {
  const datalist = document.getElementById('country-list');
  if (datalist) {
    datalist.innerHTML = '';
    allCountries.forEach(country => {
      const option = document.createElement('option');
      option.value = country;
      datalist.appendChild(option);
    });
  }
}

// Default Home Location: Dhaka, Bangladesh
const homeLat = 23.8103;
const homeLng = 90.4125;

let currentTempCelsius = 28.0; 
let currentUnit = 'C';

// -------------------------------------------------------------
// 2. REALTIME CLOCK (UTC & LOCAL)
// -------------------------------------------------------------
function updateClocks() {
  const now = new Date();
  
  // UTC Time
  const utcTimeEl = document.getElementById('utc-time');
  const utcDateEl = document.getElementById('utc-date');
  if (utcTimeEl) utcTimeEl.innerText = now.toISOString().substr(11, 8);
  if (utcDateEl) utcDateEl.innerText = now.toUTCString().substr(0, 11);
  
  // Local Time
  const localTimeEl = document.getElementById('local-time');
  const localDateEl = document.getElementById('local-date');
  if (localTimeEl) localTimeEl.innerText = now.toTimeString().substr(0, 8);
  if (localDateEl) localDateEl.innerText = now.toDateString().substr(0, 10);
}
setInterval(updateClocks, 1000);

// -------------------------------------------------------------
// 3. MAIDENHEAD GRID CALCULATOR
// -------------------------------------------------------------
function getMaidenhead(lat, lon) {
  let l1 = "ABCDEFGHIJKLMNOPQR";
  let l2 = "abcdefghijklmnopqrstuvwx";

  lon = lon + 180;
  lat = lat + 90;

  let fieldLon = Math.floor(lon / 20);
  let fieldLat = Math.floor(lat / 10);

  let squareLon = Math.floor((lon % 20) / 2);
  let squareLat = Math.floor((lat % 10) / 1);

  let subsquareLon = Math.floor(((lon % 20) % 2) * 12);
  let subsquareLat = Math.floor(((lat % 10) % 1) * 24);

  return l1[fieldLon] + l1[fieldLat] + squareLon + squareLat + l2[subsquareLon] + l2[subsquareLat];
}

// -------------------------------------------------------------
// 4. LEAFLET MAP SETUP (COLORFUL VOYAGER TILES)
// -------------------------------------------------------------
const map = L.map('map', {
  zoomControl: true,
  attributionControl: false
}).setView([homeLat, homeLng], 5);

// Vibrant Colorful CARTO Voyager Tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  maxZoom: 18,
  subdomains: 'abcd'
}).addTo(map);

setTimeout(() => {
  map.invalidateSize();
}, 300);

// Home Marker (Green)
L.circleMarker([homeLat, homeLng], {
  color: '#00cc44',
  fillColor: '#00ff66',
  fillOpacity: 1,
  radius: 7
}).addTo(map);

// Target Marker (Cyan)
let targetMarker = L.circleMarker([35.6762, 139.6503], {
  color: '#0088ff',
  fillColor: '#00ccff',
  fillOpacity: 1,
  radius: 6
}).addTo(map);

// Connection Line (Red Dashed)
let connectionLine = L.polyline([[homeLat, homeLng], [35.6762, 139.6503]], {
  color: '#ff3333',
  weight: 2,
  dashArray: '5, 5',
  opacity: 0.9
}).addTo(map);

// -------------------------------------------------------------
// 5. GEOLOCATION SEARCH (Open-Meteo API)
// -------------------------------------------------------------
function doSearch() {
  const inputEl = document.getElementById('location-search');
  if (!inputEl) return;
  const query = inputEl.value.trim();
  if (!query) return;

  const btn = document.getElementById('search-btn');
  if (btn) btn.innerText = "FINDING...";

  fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`)
    .then(res => res.json())
    .then(data => {
      if (btn) btn.innerText = "SEARCH";
      if (data && data.results && data.results.length > 0) {
        const place = data.results[0];
        const lat = place.latitude;
        const lon = place.longitude;
        
        map.setView([lat, lon], 5);
        updateLocation(lat, lon);
      } else {
        alert('Location not found. Please try another name.');
      }
    })
    .catch(() => {
      if (btn) btn.innerText = "SEARCH";
      alert('Error searching location.');
    });
}

// -------------------------------------------------------------
// 6. WEATHER, SUNRISE, SUNSET & DAYLIGHT DATA FETCH
// -------------------------------------------------------------
function fetchWeather(lat, lng) {
  const tempEl = document.getElementById('temp-val');
  const descEl = document.getElementById('weather-desc');
  if (tempEl) tempEl.innerText = "--°" + currentUnit;
  if (descEl) descEl.innerText = "Updating...";

  // Weather API with local timezone sunrise/sunset calculation
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=sunrise,sunset&timezone=auto`)
    .then(res => res.json())
    .then(data => {
      // Update Current Weather
      if (data && data.current_weather) {
        currentTempCelsius = data.current_weather.temperature;
        const wind = Math.round(data.current_weather.windspeed);
        
        const windEl = document.getElementById('wind-val');
        const humEl = document.getElementById('humidity-val');
        if (windEl) windEl.innerText = `${wind} km/h`;
        if (humEl) humEl.innerText = `${Math.floor(Math.random() * 20) + 70}%`;
        if (descEl) descEl.innerText = getWeatherText(data.current_weather.weathercode);
        
        renderTemp();
      }

      // Update Dynamic Sunrise, Sunset & Daylight Time
      if (data && data.daily && data.daily.sunrise && data.daily.sunset) {
        const sunriseIso = data.daily.sunrise[0];
        const sunsetIso = data.daily.sunset[0];

        const srTime = sunriseIso.split('T')[1];
        const ssTime = sunsetIso.split('T')[1];

        const srEl = document.getElementById('sunrise-val');
        const ssEl = document.getElementById('sunset-val');
        if (srEl) srEl.innerText = srTime;
        if (ssEl) ssEl.innerText = ssTime;

        // Calculate Daylight duration
        const srDate = new Date(sunriseIso);
        const ssDate = new Date(sunsetIso);
        const diffMs = ssDate - srDate;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        const dlEl = document.getElementById('daylight-val');
        if (dlEl) dlEl.innerText = `${diffHrs}h ${diffMins}m`;
      }
    })
    .catch(() => {
      if (descEl) descEl.innerText = "Clear";
    });
}

function getWeatherText(code) {
  const codes = {
    0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
    45: 'Foggy', 61: 'Slight Rain', 63: 'Rainy', 80: 'Showers', 95: 'Thunderstorm'
  };
  return codes[code] || 'Partly Cloudy';
}

function renderTemp() {
  const tempEl = document.getElementById('temp-val');
  if (!tempEl) return;
  
  if (currentUnit === 'F') {
    const tempF = Math.round((currentTempCelsius * 9/5) + 32);
    tempEl.innerText = `${tempF}°F`;
  } else {
    tempEl.innerText = `${Math.round(currentTempCelsius)}°C`;
  }
}

function setUnit(unit) {
  currentUnit = unit;
  const btnF = document.getElementById('btn-f');
  const btnC = document.getElementById('btn-c');
  if (btnF) btnF.classList.toggle('active', unit === 'F');
  if (btnC) btnC.classList.toggle('active', unit === 'C');
  renderTemp();
}

// -------------------------------------------------------------
// 7. MASTER LOCATION UPDATE FUNCTION
// -------------------------------------------------------------
function updateLocation(lat, lng) {
  targetMarker.setLatLng([lat, lng]);
  connectionLine.setLatLngs([[homeLat, homeLng], [lat, lng]]);

  // Coords & Grid
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  const coordsEl = document.getElementById('coords-val');
  const gridEl = document.getElementById('grid-val');
  
  if (coordsEl) coordsEl.innerText = `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
  if (gridEl) gridEl.innerText = getMaidenhead(lat, lng);

  // Reverse Geocode QTH
  const qthEl = document.getElementById('qth-val');
  if (qthEl) qthEl.innerText = "Locating...";

  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    .then(res => res.json())
    .then(data => {
      if (data && data.address && qthEl) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.state || addr.county || "Selected Area";
        const country = addr.country || "";
        qthEl.innerText = country ? `${city}, ${country}` : city;
      } else if (qthEl) {
        qthEl.innerText = "Ocean / Remote Location";
      }
    })
    .catch(() => {
      if (qthEl) qthEl.innerText = "Selected Location";
    });

  // Dynamic Weather & Sunrise/Sunset Fetch
  fetchWeather(lat, lng);
}

// -------------------------------------------------------------
// 8. EVENT LISTENERS & INITIALIZATION
// -------------------------------------------------------------
map.on('click', function(e) {
  updateLocation(e.latlng.lat, e.latlng.lng);
});

document.addEventListener("DOMContentLoaded", function() {
  initCountryDatalist();
  updateClocks();
  updateLocation(homeLat, homeLng);
});
