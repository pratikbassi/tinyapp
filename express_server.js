//-------------------------------------------------IMPORTS

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const {generateRandomString, findUserId, urlsForUser, giveDate, calculateVisits} = require('./helpers');
const methodOverride = require('method-override');

//-------------------------------------------------APP SETUP

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));

//-------------------------------------------------CONST GLOBAL VARIABLES
const PORT = 8080;

const users = { //user 'database'
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

const urlDatabase = { //url database
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca", 
    userID:'userRandomID', 
    clickCount: 1,
    visitList: {'admin': giveDate()},
    createdOn: giveDate()
  },
  "9sm5xK": {
    longURL: "http://www.google.com", 
    userID: 'user2RandomID', 
    clickCount: 1,
    visitList: {'admin': giveDate()},
    createdOn: giveDate()
  }
};


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
  res.redirect('/urls'); //urls will automatically check for login cookie
});

app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}`);
});


//--------------------------------------------------LONGURL GETS

app.get('/urls', (req, res) => {
  const templateVars = {
    user: ''
  };
  templateVars['user'] = users[req.session.userID];
  if (!req.session.userID) { // checks login cookie
    res.redirect('/login');
  } else {
    templateVars['urls'] = urlsForUser(req.session.userID, urlDatabase, users); // provides header and index page with data
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
  res.json(templateVars['urls']); //renders a JSON version of the urls
});

app.get('/urls/new', (req, res) => {
  const templateVars = {
    user: ''
  };
  templateVars['user'] = users[req.session.userID];
  if (!templateVars['user']) {
    res.redirect('/login');
  }
  res.render('urls_new', templateVars); //renders the new URL page
});

//---------------------------------------------LONGURL POSTS


app.post("/urls", (req, res) => {
  
  if (!req.session.userID) {
    res.status(403).send('You are not logged in!');
    res.redirect('/login'); 
  } else{ //generates a new entry into the url database
    let newString = generateRandomString();
    urlDatabase[newString] = {
      longURL:req.body['longURL'], 
      userID: req.session.userID, 
      clickCount: 1,
      visitList: [],
      createdOn: giveDate()
      };
    res.redirect(`/urls/:${newString}`);
  }
});

//---------------------------------------------SHORTURL GETS

app.get('/u/:shortURL', (req, res) => {
  if(urlDatabase[req.params.shortURL.slice(1)]) {
    res.redirect(urlDatabase[req.params.shortURL.slice(1)]);
  } else {
    res.status(404).send('This short link does not exist! (404)');
  } //redirects the browser to the long url link
});

app.get('/urls/:shortURL/edit', (req, res) => {
  if (!req.session.userID) {
    res.redirect('/login');
  }
  res.redirect(`/urls/:${req.params.shortURL}`);
});//redirects the button on the index page to the edit page

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = {
    user: ''
  };
  if (!req.params.shortURL.slice(1) || !urlDatabase[req.params.shortURL.slice(1)]) {
    res.status(404).send('This short link does not exist! (404)');
    res.redirect('/urls')
  } else {
    if (!req.session.userID && !req.session.visitor) { // checks to see if the user has already accessed a short url or logged in
      req.session.visitor = generateRandomString(); //generates a visitor cookie for a new visitor
      urlDatabase[req.params.shortURL.slice(1)]['visitList'][req.session.visitor] = giveDate(); //adds the visitor to the shortURL's list
    } else if (req.session.userID && !urlDatabase[req.params.shortURL.slice(1)]['visitList'][req.session.userID]) { //checks to see if the user has seen this one
      urlDatabase[req.params.shortURL.slice(1)]['visitList'][req.session.userID] = giveDate(); //adds the user to the shortURL's list
    } else if (req.session.visitor && !urlDatabase[req.params.shortURL.slice(1)]['visitList'][req.session.visitor]) { //checks to see if the visitor has seen this one
      urlDatabase[req.params.shortURL.slice(1)]['visitList'][req.session.visitor] = giveDate(); // adds the visitor to the shortURL's list
    }
    let input = req.params.shortURL.slice(1)
    templateVars = {
      'user': users[req.session.userID],//userdata for header
      'shortURL': input,//shortURL
      'longURL': urlDatabase[input]['longURL'],//longURL from database
      'clickCount': urlDatabase[input]['clickCount'],//total page loads
      'visitList': urlDatabase[input]['visitList'],//list of unique visitors
      'uniques': Object.keys(urlDatabase[input]['visitList']).length, //count of unique visitors
      'createdOn': urlDatabase[input]['createdOn']
    }
    //above code creates a templateVars object to display all the data for a specific shortURL
    urlDatabase[templateVars['shortURL']]['clickCount'] ++; //counts every non-unique visitor to the url
    res.render('urls_show', templateVars); 
  }
});

//---------------------------------------------SHORTURL POSTS UPDATE DELETE
app.post('/urls/:shortURL', (req, res) => { //redirects to update page
  res.redirect('/urls/:shortURL/update');
})

app.delete('/urls/:shortURL', (req, res) => { //deletes from url database
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

app.put('/urls/:shortURL', (req, res) => { //updates longurl in database
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

app.post('/login', (req, res) => { //sends the login request
  let email = req.body.email;
  let userId = findUserId(email, users);
  if (!userId) {
    res.status(403).send('This email is not in our server!(403)');
  }
  let password = users[userId]['password'];
  if (!bcrypt.compareSync(req.body.password, password)) { //compares hashed password
    res.status(403).send('Your password is not correct!(403)');
  }
  req.session.userID = userId; //sets the encoded user cookie
  
  res.redirect('/urls');
});

app.get('/login', (req, res) => { //renders login page
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

app.post('/logout', (req, res) => { //deletes cookie and sends to logout

  req.session = null;
  res.redirect('/urls');
});

//-----------------------------------------------REGISTER POST/GET

app.post('/register', (req, res) => { //registers new user
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
  users[newId] = { //creates new user
    id:newId,
    email:req.body.email,
    password:bcrypt.hashSync(req.body.password, 10)
  };

  req.session.userID = users[newId]['id']; //logs new user in
  res.redirect('/urls');
});

app.get('/register', (req, res) => { //renders registration page
  const templateVars = {
    'user': ''
  };

  templateVars['user'] = users[req.session.userID];
  res.render('urls_reg', templateVars);
});

//-----------------------------------------------REGISTER ERROR PAGE

app.get('/regerror', (req, res) => { //experimental: created an error page for passwords that don't match each other
  const templateVars = {
    user: ''
  };

  templateVars['user'] = users[req.session.userID];
  res.render('urls_reg_error', templateVars);
});
