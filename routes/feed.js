const express = require('express');
const { body } = require('express-validator')

const feedController = require('../controllers/feed');

const isAuth = require('../middleware/is-auth');
const router = express.Router();


// GET /feed/posts
router.get('/posts', isAuth, feedController.getPosts);

router.post('/post', isAuth, [
  body('title').trim().isLength({min: 5}),
  body('content').trim().isLength({min: 5})
], feedController.createPost);

router.get('/post/:postId', isAuth, feedController.getPost)

router.put('/post/:postId', isAuth, [
  body('title').trim().isLength({min: 5}),
  body('content').trim().isLength({min: 5})
], feedController.updatePost)

router.delete('/post/:postId', isAuth, feedController.deletePost);

router.get('/status', isAuth, feedController.getUserStatus)

router.patch('/edit-post', isAuth, [
  body('status').trim().not().isEmpty()
], feedController.updateUserStatus)

module.exports = router;