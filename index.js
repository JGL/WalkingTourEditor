const express = require('express');
const Datastore = require('nedb');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Starting server at ${port}`);
});
app.use(express.static('public'));
app.use(express.json()) // for parsing application/json - need this to be able to parse the body of a json file from the request object

const database = new Datastore('database.db');
database.loadDatabase();

app.post('/api', (request, response) => {
  let data = request.body;
  //console.log(`The data is ${JSON.stringify(data)}`);
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
  let timestamp = Date.now();
  data.timestamp = timestamp;
  database.insert(data);
  response.json(data);
});

app.get('/api', (request, response) => {
  database.find({}, (err, data) => {
    if (err) {
      response.end();
      return;
    }
    response.json(data);
  });
});
