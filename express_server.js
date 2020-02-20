const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const {generateRandomString, findUserId, urlsForUser} = require('./helpers');

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));


const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync('password', 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync('password', 10)
  }
};



const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID:'userRandomID' },
  "9sm5xK": {longURL: "http://www.google.com", userID: 'user2RandomID'}
};
//--------------------------------------------------------

//----------------------------------------------------------
app.set('trust proxy', 1);

app.use(cookieSession({
  name: 'session',
  keys: ['mocha', 'chai'],

  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
//----------------------------------------------------------

app.get('/', (req, res) => {
  res.redirect('/urls');
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

//-----------------------------------------------------------

app.get('/urls', (req, res) => {
  const templateVars = {
    user: ''
  };

  templateVars['user'] = users[req.session.userID];

  if (!req.session.userID) {
    res.redirect('/login');
  }
  
  templateVars['urls'] = urlsForUser(req.session.userID, urlDatabase, users);
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const templateVars = {
    user: ''
  };
  templateVars['user'] = users[req.session.userID];

  if (!templateVars['user']) {
    res.redirect('/login');
  }
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    user: ''
  };

  templateVars['user'] = users[req.session.userID];
  console.log(templateVars);
  templateVars['shortURL'] = req.params.shortURL.slice(1);
  console.log(templateVars);

  templateVars['longURL'] = urlDatabase[templateVars['shortURL']]['longURL'];
  console.log(templateVars);

  res.render('urls_show', templateVars);
});

app.post("/urls", (req, res) => {
  
  if (!req.session.userID) {
    res.redirect('/login');
  }
  let newString = generateRandomString();
  urlDatabase[newString] = {longURL:req.body['longURL'], userID: req.session.userID};
  res.redirect(`/urls/:${newString}`);
});

app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL.slice(1)]);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (!req.session.userID) {
    res.redirect('/login');
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post('/urls/:shortURL/update', (req, res) => {
  if (!req.session.userID) {
    res.redirect('/login');
  }
  urlDatabase[req.params.shortURL]['longURL'] = req.body.fname;
  res.redirect('/urls');
});

app.get('/urls/:shortURL/edit', (req, res) => {
  if (!req.session.userID) {
    res.redirect('/login');
  }
  res.redirect(`/urls/:${req.params.shortURL}`);
});

//------------------------------------------------------------

app.post('/login', (req, res) => {
  let email = req.body.email;
  let userId = findUserId(email, users);
  if (!userId) {
    res.status(403).send({message: 'This email is not in our server!'});
  }
  let password = users[userId]['password'];
  if (!bcrypt.compareSync(req.body.password, password)) {
    res.status(403).send({message: 'Your password is not correct!'});
  }
  
  
  res.redirect('/urls');
});

  

app.get('/login', (req, res) => {
  const templateVars = {
    user: ''
  };

  templateVars['user'] = users[req.session.userID];
  res.render('login', templateVars);
});

app.post('/logout', (req, res) => {

  req.session = null;
  res.redirect('/urls');
});


app.post('/register', (req, res) => {
  

  let newId = generateRandomString();
  
  if (!req.body.password || !req.body.email || !req.body.email) {
    res.status(400).send({
      message: 'One of the fields was blank!'
    });
  } else if (req.body.password !== req.body.password2) {
    res.redirect('/regerror');
  } else {
    if (findUserId(req.body.email, users)) {
      res.status(400).send({
        message: 'Your email was already in the database!'
      });
      
    }
  }
  users[newId] = {
    id:newId,
    email:req.body.email,
    password:bcrypt.hashSync(req.body.password, 10)
  };

  req.session.userID = users[newId]['id'];
  console.log(req.session.userID);
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const templateVars = {
    'user': ''
  };

  templateVars['user'] = users[req.session.userID];
  res.render('urls_reg', templateVars);
});

app.get('/regerror', (req, res) => {
  const templateVars = {
    user: ''
  };

  templateVars['user'] = users[req.session.userID];
  res.render('urls_reg_error', templateVars);
});
