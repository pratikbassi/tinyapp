const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const templateVars = {
  user: ''
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
//--------------------------------------------------------
const generateRandomString = () => {

  return Math.random().toString(36).slice(6);
};

const findUserId = (email) => {
  let id = '';

  for(let item in users){
    if (users[item]['email'] === email){

      return item;
    }
  }
  
  return id
}
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
  res.redirect(urlDatabase[req.params.shortURL.slice(1)]);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post('/urls/:shortURL/update', (req, res) => {
  urlDatabase[req.params.shortURL.slice(1)] = req.body.fname;
  res.redirect('/urls');
});

app.get('/urls/:shortURL/edit', (req, res) => {
  res.redirect(`/urls/:${req.params.shortURL}`);
});

//------------------------------------------------------------

app.post('/login', (req, res) => {
  let email = req.body.email;
  let userId = findUserId(email);
  if (!userId){
    res.status(403).send({message: 'This email is not in our server!'});
  }
  let password = users[userId]['password'];
  if (req.body.password !== password) {
    res.status(403).send({message: 'Your password is not correct!'});
  } 
  templateVars['user'] = users[userId]
  res.cookie(userId);
  res.redirect('/urls');
});

  

app.get('/login', (req, res) => {
  //console.log('This is being called')
  res.render('login', templateVars);
});

app.post('/logout', (req, res) => {
  res.clearCookie(templateVars['user']['id']);
  templateVars.user = '';
  res.redirect('/urls');
});


app.post('/register', (req, res) => {
  let newId = generateRandomString;
  
  console.log(req.body);
  if (!req.body.password || !req.body.email || !req.body.email) {
    res.status(400).send({
      message: 'One of the fields was blank!'
    })
  }else if (req.body.password !== req.body.password2) {
    res.redirect('/regerror');
  } else {
    for(let item in users){
      if (findUserId(req.body.email)){
        res.status(400).send({
          message: 'Your email was already in the database!'
        })
      }
    }
  }

  users[newId] = {id:newId, email:req.body.email, password:req.body.password};
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  res.render('urls_reg', templateVars);
});

app.get('/regerror', (req, res) => {
  res.render('urls_reg_error', templateVars);
});
