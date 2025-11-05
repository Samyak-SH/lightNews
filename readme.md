# Lighte-News Backend (Express + MongoDB + AI Personalization)

A backend service that powers a swipe-based personalized news feed using:

* Express.js REST API
* MongoDB (Mongoose)
* NewsAPI (real-time news fetch)
* Lightweight AI (Thompson Sampling for category recommendation)

---

## ✅ Features

| Feature                                   | Endpoint                        |
| ----------------------------------------- | ------------------------------- |
| Initial feed (10 articles)                | `POST /api/init`                |
| Send swipe reactions & get 5 new articles | `POST /api/swipe`               |
| Fetch fixed category news (no AI)         | `GET /api/feed`                 |
| List supported categories                 | `GET /api/categories`           |
| View user stats & likes/dislikes          | `GET /api/user/:id/preferences` |
| Update category filters                   | `PATCH /api/user/:id/filters`   |

---

## 📌 Project Structure

```
backend/
├── server.js
├── config/
│   └── db.js
├── models/
│   └── User.js
├── controllers/
│   ├── newsController.js
│   └── userController.js
├── routes/
│   ├── newsRoutes.js
│   └── userRoutes.js
├── utils/
│   └── ai.js
└── .env
```

---

## 🔑 Environment Variables (`.env`)

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/lighte_news
NEWS_API_KEY=YOUR_NEWSAPI_KEY
NEWS_COUNTRY_DEFAULT=us
```

---

## 🚀 Run the Server

```bash
npm install
node server.js
```

---

## 📬 API Examples (Postman ready)

### 1️⃣ `/api/init` — Initial 10 articles

```json
POST http://localhost:3000/api/init
{
  "userId": "user123",
  "filters": ["technology", "science"],
  "diversify": true
}
```

### 2️⃣ `/api/swipe` — Send reactions, get next 5

```json
POST http://localhost:3000/api/swipe
{
  "userId": "user123",
  "events": [
    { "category": "technology", "articleUrl": "https://x1", "reaction": "like" },
    { "category": "science", "articleUrl": "https://x2", "reaction": "dislike" }
  ]
}
```

### 3️⃣ `/api/feed` — Manual category browsing

```
GET http://localhost:3000/api/feed?userId=user123&category=sports&pageSize=12
```

### 4️⃣ `/api/user/:id/preferences`

```
GET http://localhost:3000/api/user/user123/preferences
```

### 5️⃣ `/api/user/:id/filters`

```json
PATCH http://localhost:3000/api/user/user123/filters
{
  "filters": ["sports", "business"]
}
```

---

## 🧠 AI Behavior

| State                  | Behavior                                    |
| ---------------------- | ------------------------------------------- |
| User has **0 swipes**  | AI disabled; always diversified feed        |
| User has ≥ 1 swipe     | Thompson Sampling chooses category          |
| `forcedDiversify=true` | Returned in init response when AI not ready |

---

## 📌 Notes

* Duplicate prevention: system tracks last 20 seen URLs per user
* Swipe endpoint accepts **single or batch events**
* Categories hardcoded: business, entertainment, general, health, science, sports, technology
* Default country = `us` (can be overridden per request)

---

## 🛠 Next Features (optional)

✅ Redis caching for NewsAPI
✅ JWT auth
✅ NewsAPI `/everything` fallback
✅ Trending tab using custom scoring
✅ Websocket real-time feed

---

### Author

AI backend auto-split and refactored by ChatGPT 🧠⚡
