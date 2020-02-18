const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get('/', (req, res) => {
  res.send('hello');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
})

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n')
})

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase}
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
})

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = {shortURL: req.params.shortURL, longURL:urlDatabase[req.params.shortURL] };
  res.render('urls_show', templateVars);
})

app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  let newString = generateRandomString()
  urlDatabase[newString] = req.body['longURL']
  console.log(urlDatabase)
  res.redirect(`/urls/:${newString}`);
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
})

const generateRandomString = () => {

  return Math.random().toString(36).slice(6)
}

//console.log(generateRandomString())