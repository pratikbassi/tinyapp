const { assert, expect } = require('chai');

const {generateRandomString, findUserId, urlsForUser} = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "user3RandomID": {
    id: "user3RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID:'userRandomID'
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: 'user2RandomID'
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserId("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.strictEqual(user, expectedOutput);
  });
  it('should return an empty string', function() {
    const user = findUserId("user3@example.com", testUsers);
    const expectedOutput = "";
    assert.strictEqual(user, expectedOutput);
  });

  describe('generateRandomString', function() {
    it('should return a different string everytime', function() {
      const user = generateRandomString();
      const expectedOutput = generateRandomString();
      assert.notStrictEqual(user, expectedOutput);
    });
  });

  describe('urlsForUser', function() {
    it('should return an empty object', function() {
      const user = urlsForUser('user3RandomID', urlDatabase, testUsers);
      assert.isEmpty(user);
    });
    it('should return the correct urls', function() {
      const user = urlsForUser('user2RandomID', urlDatabase, testUsers);
      const expectedOutput = {"9sm5xK":"http://www.google.com"};
      expect(user).to.deep.equal(expectedOutput);
    });
  });
});