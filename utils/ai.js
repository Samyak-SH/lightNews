// Lightweight AI logic: Thompson Sampling + stats update
const { CATEGORY_LIST } = require('../models/User');


function drawBeta(a, b) {
  function gammaSample(k) {
    if (k < 1) {
      const u = Math.random();
      return gammaSample(1 + k) * Math.pow(u, 1 / k);
    }
    const d = k - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      let x, v;
      do {
        x = gaussianSample();
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const u = Math.random();
      if (u < 1 - 0.0331 * x ** 4) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }
  function gaussianSample() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  const x = gammaSample(a);
  const y = gammaSample(b);
  return x / (x + y);
}


function chooseCategoryTS(user) {
  const candidates = user.filters?.length ? user.filters : CATEGORY_LIST;
  let best = null;
  let score = -Infinity;
  for (const c of candidates) {
    const s = user.stats.get(c) || { a: 1, b: 1 };
    const sample = drawBeta(Math.max(1, s.a), Math.max(1, s.b));
    if (sample > score) { score = sample; best = c; }
  }
  return best || candidates[0];
}


function updateStatsOnReaction(stats, category, reaction) {
  const s = stats.get(category) || { a: 1, b: 1, likes: 0, dislikes: 0 };
  if (reaction === 'like') { s.likes = (s.likes || 0) + 1; s.a = (s.a || 1) + 1; }
  else { s.dislikes = (s.dislikes || 0) + 1; s.b = (s.b || 1) + 1; }
  stats.set(category, s);
}


module.exports = { chooseCategoryTS, updateStatsOnReaction };