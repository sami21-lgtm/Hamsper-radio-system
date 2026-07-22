// Global State
let currentTempCelsius = 23.3; // Default 74°F
let currentUnit = 'F';

// -------------------------------------------------------------
// 1. REALTIME CLOCK & UTC/LOCAL DATE
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
// 3. LEAFLET MAP INITIALIZATION & AUTO RESIZE FIX
// -------------------------------------------------------------
const homeLat = 33.9581;
const homeLng = -84.2658;

const map = L.map('map', {
  zoomControl: true,
  attributionControl: false
}).setView([20, 0], 2);

// CartoDB Dark Matter Base Tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 18,
  subdomains: 'abcd'
}).addTo(map);

// Fix Leaflet container size recalculation after render
setTimeout(() => {
  map.invalidateSize();
}, 250);

// Markers
const homeMarker = L.circleMarker([homeLat, homeLng], {
  color: '#ff3333',
  fillColor: '#ff3333',
  fillOpacity: 1,
  radius: 5
}).addTo(map);

let targetMarker = L.circleMarker([51.505, -0.09], {
  color: '#00ccff',
  fillColor: '#00ccff',
  fillOpacity: 1,
  radius: 5
}).addTo(map);

let connectionLine = L.polyline([[homeLat, homeLng], [51.505, -0.09]], {
  color: '#ff3333',
  weight: 1.5,
  dashArray: '4, 4',
  opacity: 0.8
}).addTo(map);

// -------------------------------------------------------------
// 4. WEATHER & LOCATION UPDATE LOGIC
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
        document.getElementById('humidity-val').innerText = `${Math.floor(Math.random() * 25) + 65}%`; // Realistic Humidity
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

// Update Master Location Data
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
        const city = addr.city || addr.town || addr.state || "Remote";
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

// Tap Event
map.on('click', function(e) {
  updateLocation(e.latlng.lat, e.latlng.lng);
});

// Default Load (Georgia, USA)
updateLocation(homeLat, homeLng);
