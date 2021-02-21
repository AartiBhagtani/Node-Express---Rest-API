const fs = require('fs'); 
const path = require('path');
const { validationResult } = require('express-validator');
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
  const perPage = 2;
  const currentPage = req.query.page || 1;
  let totalItems; 
  Post.find().countDocuments()
  .then(count => {
    totalItems = count;
    return Post.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
  })
  .then(posts => {
    res.status(200).json({message: 'Posts fetched successfully', posts: posts, totalItems: totalItems})
  })
  .catch(err => {
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  })
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    throw error;
  }

  if(!req.file) {
    const err = new Error('No image provided');
    err.statusCode = 422;
    throw err;
  }
  const imageUrl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;
  let creator;
  const post = new Post({
    title: title, 
    content: content,
    imageUrl: imageUrl, 
    creator: req.userId
  })
  post.save()
  .then(result => {
    return User.findById(req.userId);
    // response 201 to denote we are creating resource on server
  })
  .then(user => {
    creator = user
    user.posts.push(post);
    return user.save();
  })
  .then(result => {
    console.log(result);
    res.status(201).json({
      message: 'Post created successfully!',
      post: post, 
      creator: {_id: creator._id, name: creator.name}  
    })  
  })
  .catch(err => {
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  })
  // create post in db
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId).then(post => {
    if(!post){
      const error = new Error('Could not find post!');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({message: 'Post Fetched', post: post});
  })
  .catch(err => {
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  })
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;

  if(req.file) {
    imageUrl = req.file.path;
  }
  if(!imageUrl) {
    const error = new Error('No image picked');
    error.statusCode = 422;
    throw error;
  }
  Post.findById(postId)
  .then(post => {
    if(!post) {
      const error = new Error('Could not find post!');
      error.statusCode = 404;
      throw error;
    }
    if(post.creator.toString() !== req.userId) {
      const error = new Error('User is forbidden for this action');
      error.statusCode = 403;
      throw error;
    }
    if(imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;
    return post.save();
  })
  .then(result => {
    res.status(200).json({message: 'Updated post successfully', post: result})
  })
  .catch(err => {
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  })
 }

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
  .then(post => {
    if(!post) {
      const error = new Error('Could not find post!');
      error.statusCode = 404;
      throw error;
    }
    // check logged in user
    if(post.creator.toString() !== req.userId) {
      const error = new Error('User is forbidden for this action');
      error.statusCode = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    return Post.findByIdAndRemove(postId);
  })
  .then(result => {
    console.log(result);
    return User.findById(req.userId);
  })
  .then(user => {
    user.posts.pull(postId);
    return user.save();
  })
  .then(result => {
    console.log(result);
    res.status(200).json({message: 'Deleted Successfully'})
  })
  .catch(err => {
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  })
};

exports.getUserStatus = (req, res, next) => {
  let status;
  User.findById(req.userId)
  .then(user => {
    if(!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    status = user.status
    res.status(200).json({message: 'Status Retrieved successfully', status: status})
  })
  .catch(err => {
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  })
}

exports.updateUserStatus = (req, res, next) => {
  const updateStatus = req.body.status;
  User.findById(req.userId)
  .then(user => {
    if(!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    user.status = updateStatus;
    return user.save();
  })
  .then(result => {
    res.status(201).json({message: 'Status Updated successfully'})
  })
  .catch(err => {
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  })
}

const clearImage = filePath => {
  filepath = path.join(__dirname, '..', filePath);
  fs.unlink(filepath, err => {console.log(err)});
} 