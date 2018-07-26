"use strict"

const mongoose = require("mongoose");
mongoose.Promise = global.Promise 

const commentSchema = mongoose.Schema({ content: String });

const authorSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  userName: {
    type: String, unique: true
  }
})

const blogPostSchema = mongoose.Schema({
  title: { type: String,required: true },
  content: { type: String,required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Author"},
  created: {type: String},
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

blogPostSchema.pre("findOneAndUpdate", function(next) {
  this.populate("author");
  next()
})


authorSchema.virtual("authorName").get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
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

const Author = mongoose.model("Author", authorSchema);
const BlogPost = mongoose.model("blogpost", blogPostSchema);

module.exports = { BlogPost, Author };
