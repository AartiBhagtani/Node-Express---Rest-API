const fs = require('fs'); 
const path = require('path');
const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');
const io = require('../socket');

exports.getPosts = async (req, res, next) => {
  const perPage = 2;
  const currentPage = req.query.page || 1;
  try {
    const totalItems = await Post.find().countDocuments()
    const posts =  await Post.find()
      .populate('creator')
      .sort({createdAt: -1})
      .skip((currentPage - 1) * perPage)
      .limit(perPage)

    res.status(200).json({message: 'Posts fetched successfully', posts: posts, totalItems: totalItems})
  }catch(err) {
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async(req, res, next) => {
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

  try {
    const result = await post.save()
    const user = await User.findById(req.userId);
    creator = user
    user.posts.push(post);
    const savedUser = await user.save();
    io.getIo().emit('posts', {action: 'create', post: post});
    console.log(result);
    res.status(201).json({
      message: 'Post created successfully!',
      post: post, 
      creator: {_id: creator._id, name: creator.name}  
    })  
    return savedUser;
  } catch(err) {
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
  // create post in db
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId)
      if(!post){
        const error = new Error('Could not find post!');
        error.statusCode = 404;
        throw error;
      }
    res.status(200).json({message: 'Post Fetched', post: post});
  }catch(err) {
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
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
  try {
    const post = await Post.findById(postId).populate('creator');
    if(!post) {
        const error = new Error('Could not find post!');
        error.statusCode = 404;
        throw error;
    }
    if(post.creator._id.toString() !== req.userId) {
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
    const result = await post.save();
    io.getIo().emit('posts', { action: 'update', post: result});
    res.status(200).json({message: 'Updated post successfully', post: result})    
  }catch (err) {
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try{
    const post = await Post.findById(postId)
    
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
    const result = await Post.findByIdAndRemove(postId);
    console.log(result);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    const result2 = await user.save();
    io.getIo().emit('posts', {action: 'delete', post: postId});
    console.log(result);
    res.status(200).json({message: 'Deleted Successfully'})
  }catch(err) {
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getUserStatus = async(req, res, next) => {
  let status;
  try{
    const user = await User.findById(req.userId)
    if(!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    status = user.status
    res.status(200).json({message: 'Status Retrieved successfully', status: status})
  }catch(err) {
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.updateUserStatus = async (req, res, next) => {
  const updateStatus = req.body.status;
  try {
    const user = await User.findById(req.userId)
    if(!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    user.status = updateStatus;
    const result = await user.save();
    res.status(201).json({message: 'Status Updated successfully'})
  }catch(err) {
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}


const clearImage = filePath => {
  filepath = path.join(__dirname, '..', filePath);
  fs.unlink(filepath, err => {console.log(err)});
} 