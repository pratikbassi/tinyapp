const generateRandomString = () => { //Generates random string
  return Math.random().toString(36).slice(6);
};

const findUserId = (email, users) => { //Finds a user ID by their email
  let id = '';

  for (let item in users) {
    if (users[item]['email'] === email) {

      return item;
    }
  }
  
  return id;
};

const urlsForUser = (id, urlDatabase, users) => { //Finds the urls registered to a particular user
  let newUrls = {};
  const templateVars = {
    user: ''
  };

  templateVars['user'] = users[id];

  for (let [key, value] of Object.entries(urlDatabase)) {
    if (value['userID'] === templateVars['user']['id']) {
      newUrls[key] = value['longURL'];
    }
  }
  return newUrls;
};

const giveDate = () => { //gives the date in the format YYYY/MM/DD+HH+MI+SS
  let now = new Date();
  let dd = String(now.getUTCDate());
  let mm = String(now.getUTCMonth());
  let yyyy = String(now.getUTCFullYear());
  let hh = String(now.getUTCHours());
  let mi = String(now.getUTCMinutes());
  let ss = String(now.getUTCSeconds());

  
  return (`UTC: ${yyyy}/${mm}/${dd} + ${hh}:${mi}:${ss}`);
}

const calculateVisits = (urlDatabase) => {
  let sum = 0;

  for(let item in urlDatabase){
    sum += item["clickCount"];
  }

  return sum;
}

module.exports = {generateRandomString, findUserId, urlsForUser, giveDate, calculateVisits};