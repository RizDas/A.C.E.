# A.C.E. - Adaptive Cognitive Engine

**A.C.E. (Adaptive Cognitive Engine)** is a high-performance, humanoid AI personal assistant designed to integrate human intuition with machine intelligence. It features a high-fidelity 3D visualizer, real-time speech processing, and a reactive "Cyberpunk HUD" interface, providing a seamless and professional AI interaction experience.

---

## Key Features

### Intelligent Core
- **Adaptive Cognitive Engine**: Powered by Groq's Llama 3.1 8B model for low-latency, intelligent responses.
- **Context Management**: Maintains comprehensive chat history for consistent and meaningful interactions.
- **Response Versatility**: Configured to provide concise summaries or detailed explanations based on user requirements.

### High-Fidelity Visualizer
- **3D Neural Core**: A Three.js-powered visual interface that dynamically reacts to system states and user input.
- **Dynamic Physics**: Fluid animations with adjustable parameters for size, color, and responsiveness.
- **Positional Control**: Flexible drag-and-drop functionality for optimized workspace integration.

### Immersive Interaction
- **Real-Time Speech Recognition**: High-accuracy transcription of voice commands using the Web Speech API.
- **High-Quality Speech Synthesis**: Naturalistic text-to-speech output using premium voice models.
- **Asynchronous Feedback**: Dedicated interfaces for real-time transcription and AI system responses.

### Advanced HUD and System Monitor
- **HUD Interface**: A sophisticated, glassmorphic head-up display featuring hex-grids, scanlines, and reactive glow effects.
- **System Telemetry**: Real-time monitoring of Neural Core synchronization, microphone status, and API health.
- **Unified Control Panel**: Centralized management for system activation and operational parameters.

---

## Technical Specifications

### Frontend
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **3D Rendering**: [Three.js](https://threejs.org/) / [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Architecture**: Multi-context architecture (AI, Blob, and UI contexts)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **AI Integration**: [Groq SDK](https://console.groq.com/) (Llama-3.1-8b-instant)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- A valid Groq API Key (obtainable via the [Groq Console](https://console.groq.com/))

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/RizDas/A.C.E.git
   cd A.C.E
   ```

2. **Backend Configuration:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=3001
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Frontend Configuration:**
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env.local` file in the `frontend` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

### Execution

1. **Initialize Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Initialize Frontend Application:**
   ```bash
   cd frontend
   npm run dev
   ```

3. Access the interface at [http://localhost:3000](http://localhost:3000).

---

## Project Architecture

```text
A.C.E/
├── backend/                # Express Server and AI Integration
│   ├── src/
│   │   ├── controllers/    # Request handlers for AI streaming
│   │   ├── routes/         # API endpoint definitions
│   │   └── server.ts       # Main server entry point
│   └── package.json
├── frontend/               # Next.js Application Core
│   ├── src/
│   │   ├── app/            # Application layout and routing
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # State management layer
│   │   ├── features/       # Modular feature implementations
│   │   ├── hooks/          # Custom operational hooks
│   │   ├── services/       # External service integrations (TTS/API)
│   │   └── types/          # Static type definitions
│   └── package.json
└── README.md
```

---

## License

This project is licensed under the [ISC License](LICENSE).

---

## Contributing

Technical contributions and issue reports are welcome. Please adhere to standard pull request protocols for submissions.

---

*Developed by RizDas*
