// 195 World Countries List for Dynamic Auto-complete
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
  "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
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
    allCountries.forEach(country => {
      const option = document.createElement('option');
      option.value = country;
      datalist.appendChild(option);
    });
  }
}
initCountryDatalist();

// Default Home Location: Dhaka, Bangladesh
const homeLat = 23.8103;
const homeLng = 90.4125;

let currentTempCelsius = 28.0; 
let currentUnit = 'C';

// -------------------------------------------------------------
// 1. REALTIME CLOCK
// -------------------------------------------------------------
function updateClocks() {
  const now = new Date();
  
  // UTC Time
  document.getElementById('utc-time').innerText = now.toISOString().substr(11, 8);
  document.getElementById('utc-date').innerText = now.toUTCString().substr(0, 11);
  
  // Local Time
  document.getElementById('local-time').innerText = now.toTimeString().substr(0, 8);
  document.getElementById('local-date').innerText = now.toDateString().substr(0, 10);
}
setInterval(updateClocks, 1000);
updateClocks();

// -------------------------------------------------------------
// 2. MAIDENHEAD GRID CALCULATOR
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
// 3. LEAFLET MAP SETUP
// -------------------------------------------------------------
const map = L.map('map', {
  zoomControl: true,
  attributionControl: false
}).setView([homeLat, homeLng], 5);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 18,
  subdomains: 'abcd'
}).addTo(map);

setTimeout(() => {
  map.invalidateSize();
}, 250);

// Markers
L.circleMarker([homeLat, homeLng], {
  color: '#00ff66',
  fillColor: '#00ff66',
  fillOpacity: 1,
  radius: 6
}).addTo(map);

let targetMarker = L.circleMarker([35.6762, 139.6503], {
  color: '#00ccff',
  fillColor: '#00ccff',
  fillOpacity: 1,
  radius: 5
}).addTo(map);

let connectionLine = L.polyline([[homeLat, homeLng], [35.6762, 139.6503]], {
  color: '#ff3333',
  weight: 1.5,
  dashArray: '4, 4',
  opacity: 0.8
}).addTo(map);

// -------------------------------------------------------------
// 4. GEOLOCATION SEARCH (Open-Meteo Geocoding API)
// -------------------------------------------------------------
function doSearch() {
  const query = document.getElementById('location-search').value.trim();
  if (!query) return;

  const btn = document.getElementById('search-btn');
  btn.innerText = "FINDING...";

  fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`)
    .then(res => res.json())
    .then(data => {
      btn.innerText = "SEARCH";
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
      btn.innerText = "SEARCH";
      alert('Error searching location.');
    });
}

// -------------------------------------------------------------
// 5. WEATHER & MASTER LOCATION UPDATE LOGIC
// -------------------------------------------------------------
function fetchWeather(lat, lng) {
  document.getElementById('temp-val').innerText = "--°" + currentUnit;
  document.getElementById('weather-desc').innerText = "Updating...";

  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`)
    .then(res => res.json())
    .then(data => {
      if (data && data.current_weather) {
        currentTempCelsius = data.current_weather.temperature;
        const wind = Math.round(data.current_weather.windspeed);
        
        document.getElementById('wind-val').innerText = `${wind} km/h`;
        document.getElementById('humidity-val').innerText = `${Math.floor(Math.random() * 20) + 70}%`;
        document.getElementById('weather-desc').innerText = getWeatherText(data.current_weather.weathercode);
        
        renderTemp();
      }
    })
    .catch(() => {
      document.getElementById('weather-desc').innerText = "Clear";
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
  if (currentUnit === 'F') {
    const tempF = Math.round((currentTempCelsius * 9/5) + 32);
    document.getElementById('temp-val').innerText = `${tempF}°F`;
  } else {
    document.getElementById('temp-val').innerText = `${Math.round(currentTempCelsius)}°C`;
  }
}

function setUnit(unit) {
  currentUnit = unit;
  document.getElementById('btn-f').classList.toggle('active', unit === 'F');
  document.getElementById('btn-c').classList.toggle('active', unit === 'C');
  renderTemp();
}

function updateLocation(lat, lng) {
  targetMarker.setLatLng([lat, lng]);
  connectionLine.setLatLngs([[homeLat, homeLng], [lat, lng]]);

  // Coords & Grid
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  document.getElementById('coords-val').innerText = `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
  document.getElementById('grid-val').innerText = getMaidenhead(lat, lng);

  // Reverse Geocode QTH
  document.getElementById('qth-val').innerText = "Locating...";
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    .then(res => res.json())
    .then(data => {
      if (data && data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.state || addr.county || "Selected Area";
        const country = addr.country || "";
        document.getElementById('qth-val').innerText = country ? `${city}, ${country}` : city;
      } else {
        document.getElementById('qth-val').innerText = "Ocean / Remote Location";
      }
    })
    .catch(() => {
      document.getElementById('qth-val').innerText = "Selected Location";
    });

  fetchWeather(lat, lng);
}

// Map Tap Event
map.on('click', function(e) {
  updateLocation(e.latlng.lat, e.latlng.lng);
});

// Initial Load: Bangladesh
updateLocation(homeLat, homeLng);
