const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

const User = require('../models/user');
const Post = require('../models/post');
const FeedController = require('../controllers/feed');
require('dotenv').config()

describe('Feed Controller', function() {
  before(function(done) {
    mongoose
    .connect(process.env.MONGODB_CONNECTION_STRING_TEST, {useUnifiedTopology: true, useNewUrlParser: true})
    .then(result => {
      const user = new User({
        email: 'test@test.com',
        password: 'tester',
        name: 'Test',
        posts: [],
        _id: '6143b1cb58e86ceab069cb40'
      });
      return user.save();
    })
    .then((result) => {
      console.log(result);
      done();
    })
    .catch(err => {
      console.log(err)
      done(err);
    })
  })

  it('should add a created post to the posts of the creator', function(done){
    const req = {
      body: {
        title: 'Test Post',
        content: 'A test Post'
      }, 
      file: {
        path: 'abc'
      },
      userId: '6143b1cb58e86ceab069cb40'
    };
    const res = {status: function() {
      return this;
    }, json: function() {}};

    FeedController.createPost(req, res, ()=> {})
    .then((savedUser) => {
      expect(savedUser).to.have.property('posts');
      expect(savedUser.posts).to.have.length(1);
      done();
    })
  })

  after(function(done) {
    User.deleteMany({})
    .then((result) => {
      console.log(result);
      return mongoose.disconnect();
    })
    .then((result) => {
      console.log(result);
      done();
    })
    .catch(err => {
      console.log(err)
      done(err);
    })
  })
})
