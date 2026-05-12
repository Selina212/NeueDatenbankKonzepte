const express = require('express')
const cors = require('cors')
require('dotenv').config()

const connectDB = require('./config/db')
const kategorienRoutes = require('./routes/kategorien')
const lieferantenRoutes = require('./routes/lieferanten')
const produkteRoutes = require('./routes/produkte')
const lagerbewegungenRoutes = require('./routes/lagerbewegungen')

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/kategorien', kategorienRoutes)
app.use('/api/lieferanten', lieferantenRoutes)
app.use('/api/produkte', produkteRoutes)
app.use('/api/lagerbewegungen', lagerbewegungenRoutes)

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server laeuft auf Port ${port}`)
  })
})
