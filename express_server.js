//-------------------------------------------------IMPORTS

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const {generateRandomString, findUserId, urlsForUser, giveDate, createTimestamp, calculateVisits} = require('./helpers');
const methodOverride = require('method-override');

//-------------------------------------------------APP SETUP

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));

//-------------------------------------------------CONST GLOBAL VARIABLES
const PORT = 8080;

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
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca", 
    userID:'userRandomID', 
    clickCount: 1,
    visitList: {'admin': giveDate()}
  },
  "9sm5xK": {
    longURL: "http://www.google.com", 
    userID: 'user2RandomID', 
    clickCount: 1,
    visitList: {'admin': giveDate()}
  }
};
const analytics = {
  totalVisitorCount: calculateVisits(urlDatabase),
}

//---------------------------------------------------COOKIE ENCODER

app.set('trust proxy', 1);

app.use(cookieSession({
  name: 'session',
  keys: ['mocha', 'chai'],
  userID: '',

  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


//-------------------------------------------------REDIRECTS AND SERVER TESTS

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});


//--------------------------------------------------LONGURL GETS

app.get('/urls', (req, res) => {
  const templateVars = {
    user: ''
  };
  templateVars['user'] = users[req.session.userID];
  if (!req.session.userID) {
    res.redirect('/login');
  } else {
    templateVars['urls'] = urlsForUser(req.session.userID, urlDatabase, users);
    res.render('urls_index', templateVars);
  }
});

app.get('/urls.json', (req, res) => {
  const templateVars = {
    user: ''
  };
  templateVars['user'] = users[req.session.userID];
  if (!req.session.userID) {
    res.redirect('/login');
  }
  templateVars['urls'] = urlsForUser(req.session.userID, urlDatabase, users);
  res.json(templateVars['urls']);
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

//---------------------------------------------LONGURL POSTS


app.post("/urls", (req, res) => {
  
  if (!req.session.userID) {
    res.status(403).send('You are not logged in!');
    res.redirect('/login');
  }
  let newString = generateRandomString();
  urlDatabase[newString] = {
    longURL:req.body['longURL'], 
    userID: req.session.userID, 
    clickCount: 1,
    visitList: []
    };
  res.redirect(`/urls/:${newString}`);
});

//---------------------------------------------SHORTURL GETS

app.get('/u/:shortURL', (req, res) => {
  if(urlDatabase[req.params.shortURL.slice(1)]) {
    res.redirect(urlDatabase[req.params.shortURL.slice(1)]);
  } else {
    res.status(404).send('This short link does not exist! (404)');
  }
});

app.get('/urls/:shortURL/edit', (req, res) => {
  if (!req.session.userID) {
    res.redirect('/login');
  }
  res.redirect(`/urls/:${req.params.shortURL}`);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    user: ''
  };
  if (!req.params.shortURL.slice(1) || !urlDatabase[req.params.shortURL.slice(1)]) {
    res.status(404).send('This short link does not exist! (404)');
    res.redirect('/urls')
  } else {
    if (!req.session.id && !req.session.visitor) {
      req.session.visitor = generateRandomString();
      urlDatabase[req.params.shortURL.slice(1)]['visitList'][req.session.visitor] = giveDate();
    } else if (req.session.id && !urlDatabase[req.params.shortURL.slice(1)]['visitList'][req.session.id]) {
      urlDatabase[req.params.shortURL.slice(1)]['visitList'][req.session.id] = giveDate();
    } else if (req.session.visitor && !urlDatabase[req.params.shortURL.slice(1)]['visitList'][req.session.visitor]) {
      urlDatabase[req.params.shortURL.slice(1)]['visitList'][req.session.visitor] = giveDate(); 
    }
    templateVars['user'] = users[req.session.userID];
    templateVars['shortURL'] = req.params.shortURL.slice(1); 
    templateVars['longURL'] = urlDatabase[templateVars['shortURL']]['longURL'];
    templateVars['clickCount'] = urlDatabase[templateVars['shortURL']]['clickCount'];
    templateVars['visitList'] = urlDatabase[templateVars['shortURL']]['visitList']
    templateVars['uniques'] = Object.keys(templateVars['visitList']).length;
    urlDatabase[templateVars['shortURL']]['clickCount'] ++;
    res.render('urls_show', templateVars); 
  }
});

//---------------------------------------------SHORTURL POSTS UPDATE DELETE
app.post('/urls/:shortURL', (req, res) => {
  res.redirect('/urls/:shortURL/update');
})

app.delete('/urls/:shortURL', (req, res) => {
  if (!req.session.userID) {
    res.status(403).send('You are not logged in! (403)');
    res.redirect('/login');
  }  else if (urlDatabase[req.params.shortURL]['userID'] !== req.session.userID) { 
    res.status(403).send('You are not logged in to the right account! (403)');
    res.redirect('/login');
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.put('/urls/:shortURL', (req, res) => {
  if (!req.session.userID) {
    res.status(403).send('You are not logged in! (403)');
    res.redirect('/login');
  }  else if (urlDatabase[req.params.shortURL]['userID'] !== req.session.userID) { 
    res.status(403).send('You are not logged in to the right account! (403)');
    res.redirect('/login');
  } else {
    urlDatabase[req.params.shortURL]['longURL'] = req.body.fname;
  }
  res.redirect('/urls');
});

//-----------------------------------------------LOGIN POST/GET

app.post('/login', (req, res) => {
  let email = req.body.email;
  let userId = findUserId(email, users);
  if (!userId) {
    res.status(403).send('This email is not in our server!(403)');
  }
  let password = users[userId]['password'];
  if (!bcrypt.compareSync(req.body.password, password)) {
    res.status(403).send('Your password is not correct!(403)');
  }
  req.session.userID = userId;
  
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const templateVars = {
    user: ''
  };
  if (req.session.userID) {
    res.redirect('/urls')
  } else {
    templateVars['user'] = users[req.session.userID];
    res.render('login', templateVars);  
  }
});

//-----------------------------------------------LOGOUT POST

app.post('/logout', (req, res) => {

  req.session = null;
  res.redirect('/urls');
});

//-----------------------------------------------REGISTER POST/GET

app.post('/register', (req, res) => {
  let newId = generateRandomString();
  
  if (!req.body.password || !req.body.email || !req.body.email) {
    res.status(400).send('One of the fields was blank!(400)');
  } else if (req.body.password !== req.body.password2) {
    res.redirect('/regerror');
  } else {
    if (findUserId(req.body.email, users)) {
      res.status(400).send( 'Your email was already in the database!(400)');
    }
  }
  users[newId] = {
    id:newId,
    email:req.body.email,
    password:bcrypt.hashSync(req.body.password, 10)
  };

  req.session.userID = users[newId]['id'];
  //console.log(req.session.userID);
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const templateVars = {
    'user': ''
  };

  templateVars['user'] = users[req.session.userID];
  res.render('urls_reg', templateVars);
});

//-----------------------------------------------REGISTER ERROR PAGE

app.get('/regerror', (req, res) => {
  const templateVars = {
    user: ''
  };

  templateVars['user'] = users[req.session.userID];
  res.render('urls_reg_error', templateVars);
});
