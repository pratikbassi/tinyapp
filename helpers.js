const generateRandomString = () => {
  return Math.random().toString(36).slice(6);
};

const findUserId = (email, users) => {
  let id = '';

  for (let item in users) {
    if (users[item]['email'] === email) {

      return item;
    }
  }
  
  return id;
};

const urlsForUser = (id, urlDatabase, users) => {
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


module.exports = {generateRandomString, findUserId, urlsForUser};