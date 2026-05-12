const mongoose = require('mongoose')

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'lagerverwaltung'
    })

    console.log('MongoDB verbunden!')
  } catch (err) {
    console.error('Fehler bei der MongoDB-Verbindung:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB
