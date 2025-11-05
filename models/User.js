// models/User.js
const mongoose = require('mongoose');

const CATEGORY_LIST = [
  'business',
  'entertainment',
  'general',
  'health',
  'science',
  'sports',
  'technology'
];

const CategoryStatsSchema = new mongoose.Schema(
  {
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    a: { type: Number, default: 1 }, // Beta prior α
    b: { type: Number, default: 1 }  // Beta prior β
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // userId from client
    filters: [{ type: String, enum: CATEGORY_LIST }],
    stats: {
      type: Map,
      of: CategoryStatsSchema,
      default: () => new Map(CATEGORY_LIST.map((c) => [c, {}]))
    },
    seen: { type: [String], default: [] } // URLs of seen articles
  },
  { timestamps: true }
);

module.exports = {
  User: mongoose.model('User', UserSchema),
  CATEGORY_LIST
};
