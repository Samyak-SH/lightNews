# Lighte-News Backend (Express + MongoDB + JWT + AI Personalization)

A production-ready backend that serves a swipe-based, AI-personalized news feed. It combines:

* **Express.js REST API**
* **MongoDB + Mongoose**
* **JWT authentication**
* **NewsAPI live news fetching**
* **Thompson Sampling AI** for per-user category recommendations
* **Duplicate + pagination-safe article delivery**

---

## ✅ Features

| Feature                        | Endpoint                        | Auth? |
| ------------------------------ | ------------------------------- | ----- |
| Register user                  | `POST /api/auth/register`       | ❌     |
| Login + get JWT                | `POST /api/auth/login`          | ❌     |
| Initial feed (10 articles)     | `POST /api/init`                | ✅     |
| Swipe like/dislike → get 5 new | `POST /api/swipe`               | ✅     |
| Manual feed by category        | `GET /api/feed`                 | ✅     |
| List available categories      | `GET /api/categories`           | ✅     |
| View user stats + history      | `GET /api/user/:id/preferences` | ✅     |
| Update category filters        | `PATCH /api/user/:id/filters`   | ✅     |
| Health check                   | `GET /api/health`               | ❌     |

---

## 🧠 AI Logic (Thompson Sampling)

| State                  | System Behavior                                              |
| ---------------------- | ------------------------------------------------------------ |
| User has **0 swipes**  | Diversified feed (no AI yet)                                 |
| User has **≥ 1 swipe** | AI selects best category via Beta distribution               |
| `forcedDiversify=true` | Returned when user has no stats but passed `diversify=false` |

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
│   ├── authController.js
│   ├── newsController.js
│   └── userController.js
├── routes/
│   ├── authRoutes.js
│   ├── newsRoutes.js
│   └── userRoutes.js
├── middleware/
│   └── authMiddleware.js
├── utils/
│   ├── ai.js
│   └── jwt.js
└── .env
```

---

## 🔑 Example `.env`

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/lighte_news
NEWS_API_KEY=YOUR_NEWSAPI_KEY
NEWS_COUNTRY_DEFAULT=us
JWT_SECRET=supersecretkey123
JWT_EXPIRES_IN=7d
```

---

## 🚀 Run the Server

```bash
npm install
node server.js
```

---

## 📬 Example Requests (Postman-ready)

### 1️⃣ Register

```http
POST /api/auth/register
Content-Type: application/json
{
  "userId": "sam",
  "password": "1234"
}
```

### 2️⃣ Login (get token)

```http
POST /api/auth/login
{
  "userId": "sam",
  "password": "1234"
}
```

✅ Response contains `{ token }`

Use it in all protected routes:

```
Authorization: Bearer <token>
```

### 3️⃣ Initial Personalized Feed

```http
POST /api/init
{
  "userId": "sam",
  "filters": ["technology", "science"],
  "diversify": true
}
```

### 4️⃣ Swipe Like/Dislike

```http
POST /api/swipe
{
  "userId": "sam",
  "events": [
    { "category": "technology", "articleUrl": "https://x1", "reaction": "like" },
    { "category": "science", "articleUrl": "https://x2", "reaction": "dislike" }
  ]
}
```

### 5️⃣ Category-Specific Feed

```
GET /api/feed?userId=sam&category=sports&pageSize=12
```

### 6️⃣ View User Preferences

```
GET /api/user/sam/preferences
```

### 7️⃣ Update Filters

```http
PATCH /api/user/sam/filters
{
  "filters": ["sports", "business"]
}
```

---

## 🛠 Internal Optimizations

✅ Per-category **pagination cursor** (no repeated page 1 fetches)
✅ 200-item `seen[]` buffer prevents duplicate articles
✅ Fallback always guarantees articles even if NewsAPI returns empty
✅ Mixed-category fallback when diversify is true

---

## 🧩 Next Optional Features

| Status | Feature                                       |
| ------ | --------------------------------------------- |
| ⏳      | Redis caching for NewsAPI                     |
| ⏳      | Trending tab (scored by recency + popularity) |
| ✅      | JWT auth implemented                          |
| ⏳      | WebSocket live feed updates                   |

---

### Author

AI-assisted architecture + implementation by ChatGPT ⚡
