const path = require('path')
const express = require('express')
const app = express()
const port = 30000

app.use(express.static(path.join(__dirname, 'www')))

app.get('/', (request, response) => {
  response.sendFile('index.html')
})

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
