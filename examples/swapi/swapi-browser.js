require('isomorphic-fetch');
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 30000

app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'www')))

app.get('/', (request, response) => {
  response.sendFile('index.html')
})

app.post('/swapi', (request, response) => {
  fetch('http://swapi.apis.guru', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request.body),
  })
  .then(res => res.json())
  .then(res => response.send(res.data))
})

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`server is listening on ${port}`)
})
