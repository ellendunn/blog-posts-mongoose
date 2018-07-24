"use strict"

const express = require("express");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require("./config");
const { BlogPost } = require("./models.js");

const app = express();
app.use(express.json());

// BlogPost.create({
//   title: 'How to Lose A Guy In 10 Days',
//   content: 'content content content',
//   author: {
//     firstName: 'Andy',
//     lastName: 'Anderson'
//   },
//   created: 'May 15, 2018'});

// BlogPost.create({
//   title: 'Makeup Tutorial for the Low-Budget Professional',
//   content: 'content content content',
//   author: {
//     firstName: 'Sam',
//     lastName: 'Sameulson'
//   },
//   created: 'June 12, 2018'});


app.get("/posts", (req,res) => {
  BlogPost.find()
    .then(posts => {
    res.json({
      posts: posts.map(post => post.serialize())
    });
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error"})
  })
});

app.get("/posts/:id", (req, res) => {
  BlogPost
    .findByID(req.params.id)
    .then(post => res.json(post.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error"})
    });
});

app.post("/posts", (req, res) => {
  const requiredFields = ["title", "content", "author"];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }

  BlogPost.create({
    title: req.body.title,
    content: req.body.content,
    author: req.body.author
  })
    .then(post => res.status(201).json(post.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: "Internal Server Error"});
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
  const updateableFields = ["title", "content", "author", "created"];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  BlogPost
    .findByIdAndUpdate(req.params.id, {$set : toUpdate})
    .then(post => res.status(204).end())
    .catch(err => res.status(500).json({message: "Internal Server Error"}));
});

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
    console.log(databaseUrl);
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
