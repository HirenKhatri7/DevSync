# DevSync

A real-time collaborative workspace where multiple users can simultaneously edit code, rich text, and drawings inside shared "windows" — all synced live via [Yjs](https://yjs.dev/) CRDTs.

## Features

- **Room-based collaboration** — Create or join password-protected rooms. Each participant gets a randomly generated username and color.
- **Multiple window types** — Spawn draggable, resizable windows inside a shared canvas:
  - **Code Editor** — Monaco Editor with syntax highlighting, multi-cursor support (via `y-monaco`), and in-browser code execution (Python, Java, C, C++, C#) powered by the [Piston API](https://github.com/engineer-man/piston).
  - **Text Editor** — Collaborative rich-text editing backed by a shared `Y.Text`.
  - **Drawing** — Collaborative whiteboard built on [Excalidraw](https://excalidraw.com/) with real-time sync via `y-excalidraw`.
- **Presence & cursors** — See who's online and watch live cursor positions, broadcast through Redis pub/sub and Socket.IO.
- **Persistent documents** — Yjs document state is periodically snapshotted to MongoDB, so room content survives server restarts.
- **Lock / unlock** — Window creators can lock editing to prevent others from modifying content.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Material UI, Monaco Editor, Excalidraw, Yjs (`y-monaco`, `y-excalidraw`, `y-websocket`) |
| Backend | Node.js, Express 5, native `ws` WebSocket server, Socket.IO |
| Real-time sync | Yjs CRDT over WebSocket (`/yjs/<roomId>`) |
| Presence | Socket.IO + Redis pub/sub |
| Database | MongoDB (room credentials & Yjs snapshots) |
| Cache | Redis (cursor broadcasting) |

## Project Structure

```
├── public/                  # CRA static assets
├── src/                     # React frontend
│   ├── components/
│   │   ├── App.js           # Main app: room gating, header, window creation
│   │   ├── RoomManager.js   # Join / Create room landing page
│   │   ├── JoinCreateCard.js# Form logic for room join & create
│   │   ├── CodeEditor.js    # Monaco-based collaborative code editor
│   │   ├── DrawingComponent.js  # Excalidraw-based collaborative whiteboard
│   │   ├── TextComponent.js # Simple collaborative text area
│   │   ├── ChildrenComponent.js # Renders the correct window type
│   │   ├── ParentComponent.js   # Canvas container for windows
│   │   ├── DraggableComponent.js # Wrapper for drag behavior
│   │   ├── withWindowLogic.js    # HOC: shared lock/delete/copy/title logic
│   │   ├── Sidebar.js       # Side panel listing windows & participants
│   │   └── Window.js        # Legacy window component
│   └── utils/
│       ├── Socket.js        # Socket.IO client singleton
│       ├── useYjs.js        # React hooks for Yjs provider & window state
│       └── api.js           # Axios client for REST API
├── server/                  # Express backend
│   ├── index.js             # HTTP server, WS upgrade, Socket.IO init
│   ├── Socket.js            # Socket.IO setup + Redis cursor listener
│   ├── config/env.js        # Environment variable defaults
│   ├── handlers/
│   │   ├── roomHandler.js   # Room join, presence tracking, disconnect
│   │   ├── cursorHandler.js # Cursor move → Redis publish
│   │   └── windowHandler.js # (Legacy) Firebase-based window CRUD
│   ├── models/
│   │   ├── Room.js          # Mongoose schema: roomId + passwordHash
│   │   └── YjsDocument.js   # Mongoose schema: binary Yjs snapshots
│   ├── routes/api.js        # REST endpoints: username, room create/join
│   ├── services/
│   │   ├── mongodb.js       # Mongoose connection
│   │   ├── Redis.js         # ioredis publisher & subscriber clients
│   │   ├── firebase.js      # Firebase Admin SDK (legacy)
│   │   └── yjsPersistence.js# Load/save Yjs state to MongoDB
│   ├── utils/
│   │   └── usernameGenerator.js  # Random adjective+animal name generator
│   └── websocket/
│       └── yjsServer.js     # Custom Yjs WebSocket protocol handler
├── docker-compose.yml       # Local MongoDB + Redis
├── render.yaml              # Render.com deploy blueprint
├── Procfile                 # Heroku-style start command
└── package.json             # Frontend dependencies & CRA scripts
```

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** (local or Atlas)
- **Redis** (local or hosted)

### 1. Start infrastructure (Docker)

```bash
docker compose up -d
```

This launches MongoDB on port 27017 and Redis on port 6379.

### 2. Install dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 3. Configure environment

Create `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/devsync
REDIS_URL=redis://127.0.0.1:6379
PORT=4000
CLIENT_ORIGIN=http://localhost:3000
```

### 4. Run

```bash
# Terminal 1 — backend
cd server
npm start          # Express + WS on http://localhost:4000

# Terminal 2 — frontend
npm start          # CRA dev server on http://localhost:3000
```

Open http://localhost:3000, create a room with a password, and share the room ID with collaborators.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/devsync` | MongoDB connection string |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Redis connection string |
| `PORT` | `4000` | Backend server port |
| `CLIENT_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `REACT_APP_SERVER_URL` | `""` (same origin) | Backend URL for the React client |
| `REACT_APP_YJS_WS_URL` | auto-detected | Yjs WebSocket URL (`ws(s)://host/yjs`) |

