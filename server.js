"use strict"

const express = require("express");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require("./config");
const { BlogPost, Author } = require("./models");

const app = express();
app.use(express.json());

app.get("/posts", (req,res) => {
  BlogPost.find()
    .then(posts => {
    res.json(posts.map(post => {
        return {
          id: post._id,
          title: post.title,
          author: post.authorName,
          content: post.content
        };
      }))
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error 1"})
  })
});

app.get("/posts/:id", (req, res) => {
  BlogPost
    .findOne({ _id: req.params.id })
    .then(post => res.json(post.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error"})
    });
});

app.get("/authors", (req, res) => {
  Author
    .find()
    .then(authors => {
      res.json(authors.map(author => {
        return {
          id: author._id,
          name: `${author.firstName} ${author.lastName}`,
          userName: author.userName
        };
      }));
    }) 
    .catch(err => {
      console.error(err);
      res.status(500).json({message: "something went wrong!"})
    })
})

app.get("/authors/:id", (req,res) => {
  Author
    .findOne({_id: req.params.id})
    .then(author => res.json(author))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: "something went terribly wrong!"})
    })

})

app.post("/posts", (req, res) => {
  const requiredFields = ["title", "content", "author_id"];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }

  Author
    .findById(req.body.author_id)
    .then(author => {
      if (author) {
        BlogPost.create({
          title: req.body.title,
          author: req.body.id,
          content: req.body.content
        })
        .then(post => res.status(201).json({
          id: post.id,
          title: post.title,
          author: `${author.firstName} ${author.lastName}`,
          content: post.content,
          comments: post.comments,
        }))
        .catch(err => {
          console.error(err);
          res.status(500).json({message: "Internal Server Error"});
          });
      } else {
        const message = 'Author not found';
        console.error(message);
        return res.status(400).send(message)
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: "Internal Server Error"});
      });
  });

app.post("/authors", (req, res) => {
  const requiredFields = ["firstName", "lastName", "userName"];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message)
    }
  };

  Author
    .findOne({userName: req.body.userName})
    .then(author => {
      if (author) {
        const message = 'Usernaame already exists';
        console.error(message);
        return res.status(400).send(message);
      }else{
        Author
          .create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            userName: req.body.userName
          })
          .then(author => res.status(201).json(author.serialize()))
          .catch(err => {
            console.error(err);
            res.status(500).json({message: "Internal Server Error"})
          });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: "Internal Server Error"})
    });
  });


app.put("/posts/:id", (req,res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = `Request path id (${req.params.id}) and ` +
    `request body id (${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({message});
  }

  const toUpdate = {};
  const updateableFields = ["title", "content"];
  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  BlogPost
    .findOneAndUpdate({_id: req.params.id}, {$set : toUpdate})
    .then(post => res.status(204).json({
      id: post.id,
      title: post.title,
      content: post.content
    }))
    .catch(err => res.status(500).json({message: "Internal Server Error"}));
});

app.put("/authors/:id", (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = `Request path id ${req.params.id} must match`
                    + ` request body id ${req.body.id}`;
    console.error(message);
    return res.status(400).json({message});
  }

  const toUpdate= {};
  const updateableFields = ["firstName", "lastName", "userName"];
  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  Author //what does this line underneath mean
    .findOne({userName: toUpdate.userName || '', _id: {$ne: req.params.id}})
    .then(author => {
      if (author) {
        const message = 'username already exists';
        console.error(message);
        return res.status(400).send(message);
      } else {
        Author
          .findByIdAndUpdate({_id: req.params.id}, {$set: toUpdate})
          .then(author => {
            res.status(204).json({
              id: author.id,
              name: `${author.firstName} ${author.lastName}`,
              userName: author.userName 
            });
          })
        .catch(err => res.status(500).json({message: "somesing went bad"}));
      }
    });
});

app.delete("/authors/:id", (req,res) => {
  BlogPost
    .remove({author: req.params.id})
    .then(() => {
      Author
        .findByIdAndRemove(req.params.id)
        .then(() => {
          res.status(204).json({message: 'Deleted blog posts owned by author'})
        });
      })
    .catch(err => res.status(500).json({message: "Not good!"}));
})

      

app.delete("/posts/:id", (req, res) => {
  BlogPost
    .findByIdAndRemove(req.params.id)
    .then(post => res.status(204).end())
    .catch(err => res.status(500).json({message: "Internal Server Error"}));
})

app.use("*", function(req,res) {
  res.status(404).json({message: "Not Found"});
}); 

let server;

function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
        if (err) {
          return reject(err);
        }
        server = app.listen(port, () => {
            console.log(`Your App is listening on port ${port}`);
            resolve();
          })
          .on("error", err => {
            mongoose.disconnect();
            reject(err);
          });
      }
    );
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log("Closing Server");
      server.close(err => {
        if (err) {
          return reject (err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer}
