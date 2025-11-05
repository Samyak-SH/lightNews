// controllers/userController.js
const { User, CATEGORY_LIST } = require('../models/User');

// -------- /api/user/:id/preferences --------
exports.getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'user not found' });

    res.json({
      userId: user._id,
      filters: user.filters || [],
      stats: Object.fromEntries(user.stats),
      seenCount: user.seen?.length || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'preferences failed' });
  }
};

// -------- /api/user/:id/filters (PATCH) --------
exports.updateFilters = async (req, res) => {
  try {
    const { filters } = req.body || {};
    const userId = req.params.id;

    let user = await User.findById(userId);
    if (!user) user = await User.create({ _id: userId });

    const normalized = Array.isArray(filters)
      ? filters
      : typeof filters === 'string'
      ? [filters]
      : [];

    user.filters = normalized.filter((c) => CATEGORY_LIST.includes(c));
    await user.save();

    res.json({
      userId: user._id,
      filters: user.filters
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'update filters failed' });
  }
};
