# Polymath Social Forum

A social forum platform for polymaths to create and participate in academic discussion channels. Built with React, TypeScript, Express, and MongoDB.

## Features

### Current Functionality

- **Channel Management**

  - Create new discussion channels with title and description
  - Browse all available channels
  - Tag channels with academic fields (Biology, Physics, Mathematics, Philosophy, etc.)
  - Color-coded tags for visual organization

- **User Interface**
  - Modern, responsive design using Chakra UI
  - Dark/Light theme support
  - Navigation sidebar
  - Dashboard view with channel cards

### Tech Stack

**Frontend:**

- React 19
- TypeScript
- Vite (build tool)
- Chakra UI (component library)
- React Router (navigation)
- Axios (HTTP client)

**Backend:**

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- CORS enabled

## Installation

### Prerequisites

- Node.js (v20 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/buaiscia/polymath_social_forum.git
   cd "Polymath Social Forum"
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```env
   MONGODB_URI=mongodb://localhost:27017/polymath-forum
   PORT=5000
   ```

   Replace `MONGODB_URI` with your MongoDB connection string if using MongoDB Atlas.

4. **Start the development environment**

   ```bash
   npm run start-dev
   ```

   This command is working only on a Windows Powershell. It will:

   - Start the backend server on `http://localhost:5000` (or your specified PORT)
   - Start the Vite dev server on `http://localhost:5173`
   - Open both in separate terminal windows

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Endpoints

#### Channels

**Get All Channels**

```http
GET /api/channels
```

Response:

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Quantum Physics Discussion",
    "description": "A forum for discussing quantum mechanics and related topics",
    "tags": [
      {
        "_id": "507f191e810c19729de860ea",
        "name": "physics",
        "color": "#fbbf24"
      }
    ],
    "createdAt": "2025-10-03T12:00:00.000Z"
  }
]
```

**Create Channel**

```http
POST /api/channels
Content-Type: application/json

{
  "title": "Philosophy of Mind",
  "description": "Exploring consciousness and mental phenomena",
  "tags": ["philosophy", "psychology"]
}
```

Response:

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "title": "Philosophy of Mind",
  "description": "Exploring consciousness and mental phenomena",
  "tags": [
    {
      "_id": "507f191e810c19729de860eb",
      "name": "philosophy",
      "color": "#a78bfa"
    },
    {
      "_id": "507f191e810c19729de860ec",
      "name": "psychology",
      "color": "#7e22ce"
    }
  ],
  "createdAt": "2025-10-03T12:00:00.000Z"
}
```

**Get All Tags**

```http
GET /api/channels/tags
```

Response:

```json
[
  {
    "_id": "507f191e810c19729de860ea",
    "name": "physics",
    "color": "#fbbf24"
  },
  {
    "_id": "507f191e810c19729de860eb",
    "name": "mathematics",
    "color": "#60a5fa"
  }
]
```

### Predefined Academic Field Colors

The following academic fields have predefined colors:

- Biology: `#10b981` (green)
- Physics: `#fbbf24` (yellow)
- Mathematics: `#60a5fa` (blue)
- Philosophy: `#a78bfa` (purple)
- Psychology: `#7e22ce` (purple)
- Literature: `#ec4899` (pink)
- Chemistry: `#06b6d4` (cyan)
- History: `#ef4444` (red)

New tags automatically get assigned a random color if not in the predefined list.

## Development Scripts

```bash
# Start both frontend and backend (recommended)
npm run start-dev

# Start frontend only
npm run dev

# Start backend only
npm run server

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Project Structure

```
.
├── server/              # Backend Express server
│   ├── index.ts        # Server entry point
│   ├── models/         # Mongoose models
│   └── routes/         # API routes
├── src/                # Frontend React app
│   ├── components/     # React components
│   ├── App.tsx         # Main app component
│   ├── theme.ts        # Chakra UI theme
│   └── main.tsx        # Entry point
├── public/             # Static assets
└── start-dev.ps1       # Development startup script
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and not licensed for public use.
