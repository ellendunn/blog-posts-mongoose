"use strict";

exports.DATABASE_URL =
  process.env.DATABASE_URL || "mongodb://localhost/blog-posts-mongoose";

exports.DATABASE_URL_TEST =
  process.env.DATABASE_URL_TEST || "mongodb://localhost/blog-posts-mongoose-test";

exports.PORT = process.env.PORT || 8080;
