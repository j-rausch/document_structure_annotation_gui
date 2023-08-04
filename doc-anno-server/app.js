var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var bodyParser = require('body-parser')

var documentsRouter = require('./routes/documents')

var app = express()

app.use(bodyParser.json({ limit: '50mb', type: 'application/json' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000, type: 'application/x-www-form-urlencoded' }))

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, '..', 'doc-anno-client', 'build')))
app.use(express.static(path.join(__dirname, 'public')))

app.use('/api/documents', documentsRouter)
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, '..', 'doc-anno-client', 'build', 'index.html'))
})

module.exports = app
