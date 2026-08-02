# A.C.E. - Adaptive Cognitive Engine

**A.C.E. (Adaptive Cognitive Engine)** is an AI-first assistant centered on Groq's `llama-3.1-8b-instant` model. It delivers conversational reasoning, command intent execution, and a responsive visual interface for a modern assistant workflow.

---

## What A.C.E. Does

- Uses Groq to generate AI chat responses in the backend.
- Streams model output to the frontend for low-latency conversational feedback.
- Translates natural language into structured actions for opening websites, launching apps, and closing tabs.
- Supports speech capture and live transcription in the UI.
- Surfaces AI state and system status through a reactive 3D HUD.

---

## Core AI Capabilities

### Conversational Intelligence
- **Streaming responses**: The backend streams Groq chat completions as server-sent events.
- **Persistent context**: Chat history is preserved for coherent follow-up replies.
- **Concise default output**: The assistant answers briefly unless additional detail is requested.

### Intent Resolution
- **Open intent**: Identifies website and application requests and returns structured action payloads.
- **Close intent**: Matches user commands with open tab labels and closes the intended targets.
- **Action execution**: Launches apps and emits frontend navigation actions from AI-generated results.

### Controlled Assistant Identity
- **Strict A.C.E. role**: The model is instructed to always identify as A.C.E.
- **No persona roleplay**: Prevents responses from adopting unrelated characters or personalities.

---

## Experience Highlights

- **Natural language control**: Ask A.C.E. to browse, open tools, or close tabs using regular speech or text.
- **Voice-enabled input**: Frontend captures microphone input for hands-free commands.
- **Reactive HUD**: Three.js-driven visuals reflect AI state and activity.
- **Live telemetry**: System status monitors API connectivity, mic activity, and assistant readiness.

---

## Technology Stack

### Frontend
- **Next.js 16**
- **React 19**
- **Three.js** for 3D visuals
- **Tailwind CSS 4**
- **React Context** for AI and UI state management

### Backend
- **Node.js** with **Express.js**
- **Groq SDK** for AI chat and intent resolution
- **TypeScript** for backend logic
- **dotenv** for environment configuration

---

## Setup

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Valid Groq API key

### Install

```bash
git clone https://github.com/RizDas/A.C.E.git
cd A.C.E
```

#### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3001
GROQ_API_KEY=your_groq_api_key_here
```

#### Frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Run

```bash
cd backend
npm run dev
```

```bash
cd ../frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```text
A.C.E/
├── backend/                # Express server and Groq AI integration
│   ├── src/
│   │   ├── controllers/    # AI handlers for chat and intent resolution
│   │   ├── routes/         # API endpoint definitions
│   │   └── server.ts       # Backend entry point
│   └── package.json
├── frontend/               # Next.js frontend and UI features
│   ├── src/
│   │   ├── app/            # App router, layout, and page
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React state contexts
│   │   ├── features/       # Chat, blob, HUD, settings modules
│   │   ├── hooks/          # Custom interaction hooks
│   │   ├── services/       # AI, TTS, and navigation helpers
│   │   └── types/          # Type definitions
│   └── package.json
└── README.md
```

---

## Contributing

Contributions are welcome. Please open issues or pull requests while preserving A.C.E.'s AI-centered command flow.

---

*Developed by RizDas*
