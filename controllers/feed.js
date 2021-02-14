exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [{title: 'first post', content: 'Content for my first post'}]
  })
};

exports.createPost = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;

  // create post in db

  // response 201 to denote we are creating resource on server
  res.status(201).json({
    message: 'Post created successfully!',
    posts: [{id: new Date().toISOString(),title: title, content: content}]
  })
};