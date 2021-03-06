const authMiddleware = require('../middleware/is-auth');
const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

const User = require('../models/user');
const AuthController = require('../controllers/auth');
const feedController = require('../controllers/feed');

require('dotenv').config()


describe('Auth Controller - Login', function() {
  // before hook runs once for whole describe block and then executing it blocks
  before(function(done) {
    const mongoDBString = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.k8mns.mongodb.net/test_messages?retryWrites=true&w=majority`
    console.log(mongoDBString);
    mongoose
    .connect(mongoDBString)
    .then(result => {
      const user = new User({
        email: 'test@test.com',
        password: 'test',
        posts: [],
        name: 'Test',
        _id: '604392d7282e1c12eb047ee4' 
      });
      return user.save();
    })
    .then((result) => {
      console.log(result);
      done()
    })
    .catch(err => {
      console.log(err)
      done(err);
    })
  })
  // beforeEach hook runs once for 'it' blocks
  // beforeEach(function() {
  // })
  it('should throw error with status code of 500 if database connection fails', function(done) {
    sinon.stub(User, 'findOne');
    User.findOne.throws();

    const req = {
      body: {
        email: 'test@gmail.com',
        password: 'testtest'
      }
    }
    AuthController.login(req, {}, () => {})
    .then(result => {
      expect(result).to.be.an('error');
      expect(result).to.have.property('statusCode', 500);
      done();
    })
    // .catch(err => {
    //   done(err);
    // })
    User.findOne.restore();
  })

  // afterEach hook runs once at the end of every 'it' blocks
  // afterEach(function() => {
  // })
  // after hook runs once for whole describe block and after executing all the it blocks
  after(function(done) {
    User.deleteMany({})         
    .then(() => {
      return mongoose.disconnect();
    })
    .then(() => {
      done();
    })
    .catch(err => {
      console.log(err)
      done(err);
    })
  })
});
