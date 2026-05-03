# 🕉️ Geeta AI — Divine Life Guidance System

> A Next.js AI-powered platform that delivers Bhagavad Gita wisdom, verse-based guidance, meditation tools, a growth tracker, Gita quiz, and an admin dashboard — all wrapped in a stunning dark "Solo Leveling" aesthetic.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🙏 **Ask Krishna** | Type any life situation and receive a matching Gita verse + personalized guidance |
| 😊 **Emotion Tags** | 16 mood/emotion shortcuts (Happy, Sad, Anxious, Jealous, etc.) auto-fill your query |
| 👋 **Greeting Detection** | Say "hi" or "Namaste" — Krishna greets you and shows the verse of the day |
| 📖 **Gita Reader** | Browse all 18 chapters and their verses |
| 🧘 **Meditation Modal** | OM chanting + flute ambience with volume controls |
| 🌱 **Growth Dashboard** | Track mood, reflection, and meditation minutes week by week |
| 🧪 **Gita Quiz** | Category-based quiz (Karma Yoga, Bhakti Yoga) with a beautiful modal UI |
| 🔊 **TTS Voice** | Text-to-speech via ElevenLabs / OpenAI, falling back to browser SpeechSynthesis |
| ⚙️ **Admin Panel** | `/admin` page: view missing queries, growth data, feedback, quiz results |
| ⚠️ **Admin Notifications** | Low-confidence queries are auto-logged and visible in the admin panel |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **AI / APIs**: OpenAI GPT-4o (guidance), ElevenLabs / OpenAI TTS (voice)
- **Storage**: Browser `localStorage` (client data), file-based (admin missing queries)
- **Testing**: Vitest + React Testing Library

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/Rishikesh-nitkkr/Geeta.git
cd geeta-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your keys:

```env
OPENAI_API_KEY=sk-...            # For AI guidance + TTS fallback
ELEVENLABS_API_KEY=...           # Optional: premium voice
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
```

> **The app works without any API keys** — it uses built-in Gita verse matching and browser SpeechSynthesis as fallbacks.

### 4. Run locally
```bash
npm run dev
```

Visit **http://127.0.0.1:3000**

### 5. Admin Panel
Visit **http://127.0.0.1:3000/admin**

---

## 📁 Project Structure

```
geeta-ai/
├── app/
│   ├── admin/page.tsx          # Admin dashboard
│   ├── api/
│   │   ├── guidance/route.ts   # Guidance AI API
│   │   ├── tts/route.ts        # Text-to-speech API
│   │   └── admin/missing/      # Missing query log API
│   ├── globals.css             # Design system + animations
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── KrishnaAiApp.tsx        # Main app component (all UI)
├── lib/
│   ├── gita-data.ts            # 40+ Bhagavad Gita verses (all 18 chapters)
│   ├── guidance.ts             # Verse matching + emotion synonym engine
│   └── types.ts                # Shared TypeScript types
├── public/
│   └── assets/user-media/      # Images + video (audio files excluded — see below)
├── .env.example                # Template for environment variables
└── next.config.mjs
```

---

## 🎵 Large Media Files (Audio)

The two audio files are excluded from this repo due to GitHub's 100MB file limit:

| File | Size | Notes |
|---|---|---|
| `public/assets/user-media/om-108.mp3` | ~74 MB | OM chanting ambience |
| `public/assets/user-media/krishna-flute.mp3` | ~144 MB | Flute meditation music |

**To add them back locally:**
- Place these files in `public/assets/user-media/`
- Or update `KrishnaAiApp.tsx` to point to a CDN/cloud storage URL

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Optional | GPT-4o for guidance + TTS |
| `ELEVENLABS_API_KEY` | Optional | Premium voice synthesis |
| `ELEVENLABS_VOICE_ID` | Optional | ElevenLabs voice ID |
| `DID_API_KEY` | Optional | D-ID talking avatar |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth Client Secret |
| `NEXTAUTH_SECRET` | Recommended | Random secret for NextAuth sessions |
| `NEXTAUTH_URL` | Optional | Full base URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Optional | Public base URL (default: `http://127.0.0.1:3000`) |

---

## 📜 License

MIT — feel free to use, fork, and build upon this.

---

> *"You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions."* — Bhagavad Gita 2.47
