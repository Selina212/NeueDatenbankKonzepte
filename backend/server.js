//Author: Raphael Falk und Selina Steuer
// Hauptserver-Datei: Verbindet mit MongoDB, definiert Middleware, bindet API-Routen ein und startet den Server.
// server.js
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Body parser
app.use(express.json());

// CORS konfigurieren und global aktivieren
const corsOptions = {
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));



// Optional: einfache Health Route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API-Routen einbinden
app.use('/api/kategorien', require('./routes/kategorien'));
app.use('/api/lieferanten', require('./routes/lieferanten'));
app.use('/api/produkte', require('./routes/produkte'));
app.use('/api/kette', require('./routes/kette'));  
app.use('/api/lagerorte', require('./routes/lagerorte'));
app.use('/api/lagerbewegungen', require('./routes/lagerbewegungen'));
app.use('/api/aggregationen', require('./routes/aggregationen'));
// Statische Dateien aus dem frontend-Ordner servieren
// Erwartet: frontend/index.html, frontend/aggregationen.html, frontend/css/style.css, frontend/js/...
app.use(express.static(path.join(__dirname, '..', 'frontend')));
// Fallback für Single Page Apps oder saubere 404-Seite (optional)
app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts('html')) {
    return res.status(404).sendFile(path.join(__dirname, '..', 'frontend', '404.html'), err => {
      if (err) res.status(404).send('Not found');
    });
  }
  next();
});

// Globales Error Handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// MongoDB Verbindung und Serverstart
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/deinedb';
mongoose.connect(mongoUri)

  .then(() => {
    console.log('MongoDB verbunden');
    app.listen(port, () => console.log(`Server läuft auf Port ${port}`));
  })
  .catch(err => {
    console.error('MongoDB Verbindung fehlgeschlagen:', err.message);
    process.exit(1);
  });
