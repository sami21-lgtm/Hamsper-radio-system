// Global Weather State
let currentTempCelsius = null;
let currentWind = null;
let currentUnit = 'C'; // 'C' or 'F'

// -------------------------------------------------------------
// 1. CLOCK LOGIC (UTC & Local Time)
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
// 2. MAIDENHEAD GRID LOCATOR CALCULATOR
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
// 3. WEATHER API (Open-Meteo Free API Integration)
// -------------------------------------------------------------
function fetchRealWeather(lat, lng) {
  document.getElementById('temp-val').innerText = "--°" + currentUnit;
  document.getElementById('weather-desc').innerText = "Updating...";

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data && data.current_weather) {
        currentTempCelsius = data.current_weather.temperature;
        currentWind = data.current_weather.windspeed;
        const code = data.current_weather.weathercode;

        document.getElementById('wind-val').innerText = `${currentWind} km/h`;
        document.getElementById('weather-desc').innerText = getWeatherCondition(code);
        
        renderTemperature();
      }
    })
    .catch(() => {
      document.getElementById('weather-desc').innerText = "Unavailable";
    });
}

// Convert WMO Weather Codes to Human Readable Text
function getWeatherCondition(code) {
  const conditions = {
    0: 'Clear Sky',
    1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Depositing Rime Fog',
    51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
    61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
    71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
    80: 'Rain Showers', 81: 'Moderate Showers', 82: 'Violent Showers',
    95: 'Thunderstorm'
  };
  return conditions[code] || 'Clear';
}

// Render Temp based on selected unit (°C or °F)
function renderTemperature() {
  if (currentTempCelsius === null) return;

  if (currentUnit === 'C') {
    document.getElementById('temp-val').innerText = `${Math.round(currentTempCelsius)}°C`;
  } else {
    const tempF = (currentTempCelsius * 9/5) + 32;
    document.getElementById('temp-val').innerText = `${Math.round(tempF)}°F`;
  }
}

// Unit Switch Handler
function setUnit(unit) {
  currentUnit = unit;
  document.getElementById('btn-c').classList.toggle('active', unit === 'C');
  document.getElementById('btn-f').classList.toggle('active', unit === 'F');
  renderTemperature();
}

// -------------------------------------------------------------
// 4. MAP INITIALIZATION & INTERACTION
// -------------------------------------------------------------
const homeLat = 23.8103; // Default Location (e.g. Bangladesh / Home)
const homeLng = 90.4125;

const map = L.map('map', {
  zoomControl: true,
  attributionControl: false
}).setView([20, 0], 2);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 18,
  subdomains: 'abcd'
}).addTo(map);

// Home Base Red Marker
L.circleMarker([homeLat, homeLng], {
  color: '#ff3333',
  fillColor: '#ff3333',
  fillOpacity: 1,
  radius: 6
}).addTo(map);

// Clicked Target Blue Marker
let targetMarker = L.circleMarker([homeLat, homeLng], {
  color: '#00ccff',
  fillColor: '#00ccff',
  fillOpacity: 1,
  radius: 6
}).addTo(map);

// Red Line Connector
let connectionLine = L.polyline([[homeLat, homeLng], [homeLat, homeLng]], {
  color: '#ff3333',
  weight: 1.5,
  dashArray: '4, 4',
  opacity: 0.8
}).addTo(map);

// Master Function to update map & fetch details on tap
function updateDashboardLocation(lat, lng) {
  // Update Marker & Line
  targetMarker.setLatLng([lat, lng]);
  connectionLine.setLatLngs([[homeLat, homeLng], [lat, lng]]);

  // Update Coordinates & Maidenhead Grid
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  document.getElementById('coords-val').innerText = `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
  document.getElementById('grid-val').innerText = getMaidenhead(lat, lng);

  // Reverse Geocoding (Fetch Country / City)
  document.getElementById('qth-val').innerText = "Locating...";
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    .then(res => res.json())
    .then(data => {
      if (data && data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.state || addr.county || "Ocean / Remote";
        const country = addr.country || "";
        document.getElementById('qth-val').innerText = country ? `${city}, ${country}` : city;
      } else {
        document.getElementById('qth-val').innerText = "Ocean / Remote";
      }
    })
    .catch(() => {
      document.getElementById('qth-val').innerText = "Selected Location";
    });

  // Fetch Real Weather for Tapped Location
  fetchRealWeather(lat, lng);
}

// Listen for Map Click / Tap Events
map.on('click', function(e) {
  updateDashboardLocation(e.latlng.lat, e.latlng.lng);
});

// Initial Load
updateDashboardLocation(homeLat, homeLng);
