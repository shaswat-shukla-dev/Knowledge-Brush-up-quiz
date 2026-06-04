# 🧠 QuizForge — AI-Powered Knowledge Brush-Up Quiz

> Full-stack quiz app powered by Google Gemini AI — API key secured server-side, never exposed to the browser.

---

## ✨ Features

- **Instant AI Quiz Generation** — Type any topic, Gemini generates fresh MCQs in seconds
- **Secure Backend** — `GEMINI_API_KEY` lives in `.env` on the server. Zero browser exposure.
- **Fully Animated UI** — Smooth card entry, correct/wrong animations, confetti, progress bar
- **Configurable** — Choose 5–15 questions, Beginner / Intermediate / Advanced / Mixed difficulty
- **Rich Feedback** — Correct/wrong highlight + Gemini-generated explanation per question
- **Results Dashboard** — Animated score ring, accuracy %, retry or switch topics

---

## 📁 Project Structure

```
quizforge/
├── backend/
│   ├── server.js          ← Express server + Gemini API proxy
│   ├── package.json
│   ├── .env.example       ← Template — copy to .env and add your key
│   └── .env               ← 🔒 NOT committed (in .gitignore)
├── frontend/
│   └── public/
│       └── index.html     ← Animated quiz UI (no API key)
├── .gitignore
└── README.md
```

---

## 🚀 Local Development

### 1. Get a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in → click **Create API Key**
3. Copy the key (starts with `AIza…`)

### 2. Clone & Install

```bash
git clone https://github.com/your-username/quizforge.git
cd quizforge/backend
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder:

```env
GEMINI_API_KEY=AIzaYourActualKeyHere
PORT=3000
```

> ⚠️ **Never commit `.env`** — it's already in `.gitignore`.

### 4. Start the Server

```bash
# From backend/
npm start
# or for auto-reload during development:
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** — the Express server serves both the API and the frontend.

---

## 🌐 Deployment

### Option A — Render (Backend) + Netlify (Frontend)

This is the recommended split deployment for production.

#### Deploy Backend to Render

1. Push your repo to GitHub.
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Configure:
   | Field | Value |
   |---|---|
   | **Root Directory** | `backend` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node server.js` |
   | **Environment** | `Node` |
5. Under **Environment Variables**, add:
   ```
   GEMINI_API_KEY = AIzaYourActualKeyHere
   PORT           = 3000
   ```
6. Click **Create Web Service** — Render will give you a URL like `https://quizforge-abc.onrender.com`

#### Deploy Frontend to Netlify

> If your backend already serves the frontend via Express static, skip this — you only need Render.

1. Go to [netlify.com](https://netlify.com) → **Add new site → Deploy manually**
2. Drag and drop the `frontend/public/` folder
3. **Important**: Update the API call in `index.html` from `/api/generate-quiz` to your full Render URL:
   ```js
   const res = await fetch('https://quizforge-abc.onrender.com/api/generate-quiz', { ... });
   ```
4. Re-upload / redeploy.

#### CORS Configuration (Render + Netlify split)

If your frontend is on Netlify and backend on Render, update `server.js` to allow your Netlify origin:

```js
app.use(cors({
  origin: ['https://your-app.netlify.app', 'http://localhost:3000']
}));
```

---

### Option B — Render Only (Simplest)

Express serves both the API and the static frontend from a single service.

1. Deploy backend to Render as described above.
2. Visit `https://quizforge-abc.onrender.com` — both UI and API are live.
3. No frontend-only deployment needed.

---

### Option C — Single VPS / Self-Hosted

```bash
# On your server:
git clone https://github.com/your-username/quizforge.git
cd quizforge/backend
npm install
cp .env.example .env
nano .env          # Add your GEMINI_API_KEY
node server.js     # Or use pm2: pm2 start server.js --name quizforge
```

Use **nginx** as a reverse proxy (optional):
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

---

## 🔐 Security Architecture

```
Browser (no key)
    │
    │  POST /api/generate-quiz  { topic, count, difficulty }
    ▼
Express Server  ← reads GEMINI_API_KEY from .env
    │
    │  HTTPS request to Gemini API (key never sent to browser)
    ▼
Google Gemini API
    │
    │  JSON response { questions: [...] }
    ▼
Express Server → Browser
```

The API key **never appears** in the HTML, JS, or any network request visible to the browser.

---

## 🔧 API Reference

### `POST /api/generate-quiz`

**Request body:**
```json
{
  "topic": "Python decorators",
  "count": 10,
  "difficulty": "intermediate"
}
```

**Response:**
```json
{
  "questions": [
    {
      "question": "What does a decorator in Python primarily do?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 2,
      "explanation": "Decorators wrap a function..."
    }
  ],
  "topic": "Python decorators"
}
```

**Difficulty values:** `beginner` | `intermediate` | `advanced` | `mixed`
**Count range:** 3–20

---

## 🛠 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Your Google Gemini API key |
| `PORT` | Optional | Server port (default: `3000`) |

---

## 🐛 Troubleshooting

| Error | Fix |
|---|---|
| `Server is missing GEMINI_API_KEY` | Create `.env` from `.env.example` and add your key |
| `API error 400` | Check the API key has no extra spaces |
| `API error 429` | Rate limit hit — wait a moment and retry |
| `No questions returned` | Use a more specific topic |
| Render: app not starting | Check build command is `npm install` and start is `node server.js` |
| Netlify: 404 on API | API calls must point to Render URL, not Netlify |

---

## 🤝 Built With

| Layer | Technology |
|---|---|
| Backend | Node.js 18+, Express 4, dotenv, node-fetch |
| Frontend | HTML5, CSS3 (keyframe animations), Vanilla JS |
| AI | Google Gemini 2.0 Flash (`gemini-2.0-flash`) |
| Fonts | Google Fonts — Syne + DM Mono |
| Deploy | Render (backend), Netlify (frontend) |

---

## 📄 License

MIT — free to use, modify, and distribute.

---

*Made with ❤️ — secure, fast, and open.*
