const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken'); 

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  try{
    const hashedPassword = await bcrypt.hash(password, 12)
    const user = new User({
      email: email,
      password: hashedPassword, 
      name: name
    })
    const result = await user.save();
    res.status(201).json({message: 'User created Successfully', userId: result._id})
    return
  }catch(err){
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
    return err;
  }
}

exports.login = async(req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser; 
  try{
    const user = await User.findOne({email: email})
  
    if(!user) {
      const error = new Error('A user with Email Id not found');
      error.statusCode = 401;
      throw error;
    }
    loadedUser = user;
    const isPasswordEqual =  bcrypt.compare(password, user.password);
  
    if(!isPasswordEqual){
      const errror = new Error('Password is incorrect');
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign({
      email: loadedUser.email,
      userId: loadedUser._id.toString()
    }, 'secretsecretkey', {expiresIn: '1h'});
    res.status(200).json({token: token, userId: loadedUser._id.toString()})
    return;
  }catch(err) {
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
    return err;
  }
}