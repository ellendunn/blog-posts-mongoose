"use strict"

const mongoose = require("mongoose");
mongoose.Promise = global.Promise 

let authorSchema = mongoose.Schema({
  firstName: 'string',
  lastName: 'string',
  userName: {
    type: 'string', unique: true
  }
})

const commentSchema = mongoose.Schema({ content: 'string' });

const blogPostSchema = mongoose.Schema({
  title: { type: 'string',required: true },
  content: { type: 'string',required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Author"},
  created: {type: 'string'},
  comments: [commentSchema]
  })

blogPostSchema.pre("find", function(next) {
  this.populate("author");
  next()
});

blogPostSchema.pre("findOne", function(next) {
  this.populate("author");
  next()
});

// blogPostSchema.pre("findOneAndUpdate", function(next) {
//   this.populate("author");
//   next()
// })

blogPostSchema.virtual("authorName").get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogPostSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.authorName,
    created: this.created,
    comments: this.comments
  }
}

authorSchema.methods.serialize = function() {
  return {
    id: this._id,
    name: this.name,
    userName: this.userName
  }
}

let Author = mongoose.model("Author", authorSchema);
const BlogPost = mongoose.model("blogpost", blogPostSchema);

module.exports = { BlogPost, Author };
