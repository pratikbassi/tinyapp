const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const templateVars = {
  username: '',
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get('/', (req, res) => {
  res.redirect('/urls')
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/urls', (req, res) => {
  templateVars['urls'] = urlDatabase;
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  templateVars['shortURL'] = req.params.shortURL;
  templateVars['longURL'] = urlDatabase[req.params.shortURL.slice(1)];
  res.render('urls_show', templateVars);
});

app.post("/urls", (req, res) => {

  let newString = generateRandomString();
  urlDatabase[newString] = req.body['longURL'];
  res.redirect(`/urls/:${newString}`);
});

app.get('/u/:shortURL', (req, res) => {
  //console.log(urlDatabase[req.params.shortURL]);
  res.redirect(urlDatabase[req.params.shortURL.slice(1)]);
});

const generateRandomString = () => {

  return Math.random().toString(36).slice(6);
};

app.post('/urls/:shortURL/delete', (req, res) => {
  //console.log('delete called')
  //console.log(req.params.shortURL)
  delete urlDatabase[req.params.shortURL];
  //console.log(urlDatabase)
  res.redirect('/urls');
});

app.post('/urls/:shortURL/update', (req, res) => {
  urlDatabase[req.params.shortURL.slice(1)] = req.body.fname;
  res.redirect('/urls');
});

app.get('/urls/:shortURL/edit', (req, res) => {
  //console.log(req.params.shortURL);
  res.redirect(`/urls/:${req.params.shortURL}`);
});

app.post('/login', (req, res) => {
  res.cookie('username',req.body.username);
  templateVars.username = req.body.username;
  // let templateVars = {
  //   username: req.cookies["username"],
  //   // ... any other vars
  // };
  res.render("urls_index", templateVars);
  res.render('urls_new', templateVars);
  res.render('urls_show', templateVars);
  //console.log(req.body.username)
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  templateVars.username = '';
  res.redirect('/urls');
})

