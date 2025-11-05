// controllers/newsController.js
const axios = require('axios');
const { User, CATEGORY_LIST } = require('../models/User');
const { chooseCategoryTS, updateStatsOnReaction } = require('../utils/ai');

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_COUNTRY_DEFAULT = process.env.NEWS_COUNTRY_DEFAULT || 'us';

const newsClient = axios.create({
  baseURL: 'https://newsapi.org/v2',
  timeout: 10000
});

// -------- Sanitizer --------
function sanitizeArticle(a) {
  if (!a) return null;
  return {
    source: a.source?.name,
    author: a.author || null,
    title: a.title,
    description: a.description,
    url: a.url,
    urlToImage: a.urlToImage || null,
    publishedAt: a.publishedAt,
    content: a.content || null
  };
}

// -------- Fetch helpers --------
async function fetchNewsByCategory(category, pageSize = 10, country = NEWS_COUNTRY_DEFAULT) {
  const params = { category, apiKey: NEWS_API_KEY, pageSize, country };
  const { data } = await newsClient.get('/top-headlines', { params });

  if (data.status === 'error') {
    console.error('NewsAPI error:', data);
    return [];
  }

  return (data.articles || []).map(sanitizeArticle).filter(Boolean);
}

async function fetchMixed(categories, pageSizePerCat = 3, country = NEWS_COUNTRY_DEFAULT) {
  const chunks = await Promise.all(categories.map((c) =>
    fetchNewsByCategory(c, pageSizePerCat, country)
  ));

  const merged = [];
  const seen = new Set();
  let idx = 0;

  while (true) {
    let appended = false;
    for (let i = 0; i < chunks.length; i++) {
      const item = chunks[i][idx];
      if (item && !seen.has(item.url)) {
        merged.push(item);
        seen.add(item.url);
        appended = true;
      }
    }
    idx++;
    if (!appended) break;
  }
  return merged;
}

// -------- Seen list filter --------
function filterNewArticlesForUser(user, articles, keep = 20) {
  const seenSet = new Set(user.seen || []);
  const fresh = [];

  for (const a of articles) {
    if (!a?.url) continue;
    if (!seenSet.has(a.url)) {
      fresh.push(a);
      seenSet.add(a.url);
    }
  }

  user.seen = Array.from(seenSet).slice(-keep);
  return fresh;
}

// -------- /api/init --------
exports.initFeed = async (req, res) => {
  try {
    let { userId, filters, diversify = true, country } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });

    // normalize country
    country = typeof country === 'string' ? country : NEWS_COUNTRY_DEFAULT;

    // normalize filters
    const normalizedFilters = Array.isArray(filters)
      ? filters
      : typeof filters === 'string'
      ? [filters]
      : [];
    const validFilters = normalizedFilters.filter((c) => CATEGORY_LIST.includes(c));

    let user = await User.findById(userId);
    if (!user) {
      user = await User.create({ _id: userId, filters: validFilters });
    } else if (validFilters.length) {
      user.filters = validFilters;
      await user.save();
    }

    // detect cold start (no stats)
    const hasNoStats = [...user.stats.values()].every(
      (s) => ((s.likes || 0) + (s.dislikes || 0)) === 0
    );

    let forcedDiversify = false;
    if (!diversify && hasNoStats) {
      diversify = true;
      forcedDiversify = true;
    }

    let articles = [];

    if (diversify) {
      const cats = (user.filters?.length ? user.filters : CATEGORY_LIST).slice(0);
      const mix = cats.length > 3 ? cats.sort(() => 0.5 - Math.random()).slice(0, 3) : cats;
      const mixed = await fetchMixed(mix, 5, country);
      articles = mixed.slice(0, 10);
    } else {
      const cat = chooseCategoryTS(user);
      const list = await fetchNewsByCategory(cat, 12, country);
      articles = list.slice(0, 10);
    }

    const fresh = filterNewArticlesForUser(user, articles);
    await user.save();

    res.json({
      userId: user._id,
      articles: fresh,
      meta: {
        diversified: diversify,
        forcedDiversify,
        possibleCategories: user.filters?.length ? user.filters : CATEGORY_LIST
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'init failed' });
  }
};

// -------- /api/swipe --------
exports.handleSwipe = async (req, res) => {
  try {
    const { userId } = req.body || {};
    let { events, country } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });

    country = typeof country === 'string' ? country : NEWS_COUNTRY_DEFAULT;

    if (!events) {
      const { category, articleUrl, reaction } = req.body || {};
      events = [{ category, articleUrl, reaction }];
    }
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'events array required' });
    }

    for (const e of events) {
      if (!e?.category || !e?.reaction) {
        return res.status(400).json({ error: 'each event needs category and reaction' });
      }
      if (!CATEGORY_LIST.includes(e.category)) {
        return res.status(400).json({ error: `invalid category: ${e.category}` });
      }
      if (!['like', 'dislike'].includes(e.reaction)) {
        return res.status(400).json({ error: 'reaction must be like|dislike' });
      }
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'user not found' });

    const batchTally = new Map();

    for (const { category, articleUrl, reaction } of events) {
      updateStatsOnReaction(user.stats, category, reaction);
      const t = batchTally.get(category) || { likes: 0, dislikes: 0 };
      reaction === 'like' ? t.likes++ : t.dislikes++;
      batchTally.set(category, t);

      if (articleUrl) {
        const set = new Set(user.seen);
        set.add(articleUrl);
        user.seen = Array.from(set).slice(-20);
      }
    }

    // next category decision
    let nextCategory = null;
    let bestLiked = null;
    for (const [cat, t] of batchTally.entries()) {
      if (t.likes > t.dislikes && (!bestLiked || t.likes - t.dislikes > bestLiked.margin)) {
        bestLiked = { cat, margin: t.likes - t.dislikes };
      }
    }
    nextCategory = bestLiked ? bestLiked.cat : chooseCategoryTS(user);

    let more = await fetchNewsByCategory(nextCategory, 10, country);
    more = filterNewArticlesForUser(user, more).slice(0, 5);

    await user.save();

    res.json({
      userId: user._id,
      nextCategory,
      articles: more,
      appliedEvents: events.length,
      stats: Object.fromEntries(
        CATEGORY_LIST.map((c) => [c, user.stats.get(c) || { a: 1, b: 1, likes: 0, dislikes: 0 }])
      )
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'swipe failed' });
  }
};

// -------- /api/feed --------
exports.categoryFeed = async (req, res) => {
  try {
    const { userId, category, pageSize = 10, country } = req.query;
    if (!category || !CATEGORY_LIST.includes(category)) {
      return res.status(400).json({ error: 'valid category is required' });
    }
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'user not found' });

    const countrySafe = typeof country === 'string' ? country : NEWS_COUNTRY_DEFAULT;

    let list = await fetchNewsByCategory(category, Number(pageSize), countrySafe);
    list = filterNewArticlesForUser(user, list);

    await user.save();

    res.json({ userId: user._id, category, articles: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'feed failed' });
  }
};

// -------- /api/categories --------
exports.listCategories = (req, res) => {
  res.json({ categories: CATEGORY_LIST });
};