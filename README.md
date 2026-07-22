# 🛰️ Tactical Ham & Solar Dashboard

A dark-themed, real-time tactical dashboard designed for Radio Operators (Ham Radio) and Space Weather enthusiasts. Built with pure **HTML5, CSS3, and JavaScript**, fetching live data automatically using free public APIs—no API keys or external image downloads required!

![Dashboard Preview](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

- ⏰ **Live Dual Clocks:** Synchronized real-time **UTC** and **Local Time** displays.
- 📡 **Interactive Dark Map:** Interactive map via [Leaflet.js](https://leafletjs.com/) with CartoDB Dark Tiles, featuring contact spot markers and radio propagation signal lines.
- ☀️ **NASA SDO Solar Imagery:** Live stream of solar imagery directly from NASA's Solar Dynamics Observatory (SDO) with multiple filter view options.
- 🌤️ **Live Local Weather:** Real-time temperature, condition, humidity, and wind updates via **Open-Meteo API**.
- 🌌 **Space Weather Data:** Live Kp-Index tracking via **NOAA Space Weather Prediction Center (SWPC) API**.
- 🚨 **NOAA Alert Ticker:** Dynamic scrolling news ticker displaying real-time space weather alerts and DX news.

---

## 📁 File Structure

```text
├── index.html     # Dashboard layout and structure
├── style.css      # Custom dark/tactical styling & layouts
├── script.js     # Logic, clocks, Leaflet map setup, and live API fetching
└── README.md      # Project documentation
