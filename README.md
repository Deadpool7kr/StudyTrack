# StudyTrack – Student Task & Study Management System

Full-stack project for Silver Oak University BCA Honours – Full Stack Development-I (3040233448).

## Stack
- React + Vite
- React Router
- Node.js + Express
- MongoDB + Mongoose
- REST API
- CSS
- Git/GitHub

## Run locally

### 1. Backend
```bash
cd server
npm install
copy .env.example .env
npm run dev
```
On Linux/macOS use `cp .env.example .env` instead of `copy`.

### 2. Frontend
In another terminal:
```bash
cd client
npm install
npm run dev
```
Open the URL printed by Vite.

## MongoDB
Set `MONGODB_URI` in `server/.env` to a MongoDB Atlas/local MongoDB connection. The server also has an in-memory fallback so the UI/API can be demonstrated before MongoDB is connected.

## API
- GET `/api/health`
- GET `/api/tasks`
- POST `/api/tasks`
- PUT `/api/tasks/:id`
- DELETE `/api/tasks/:id`
- GET `/api/notes`
- POST `/api/notes`
- PUT `/api/notes/:id`
- DELETE `/api/notes/:id`

## Workbook mapping
- Week 1: React setup and GitHub initialization
- Week 2: Components and props
- Week 3: useState
- Week 4: useEffect and lifecycle concepts
- Week 5: React Router and navigation
- Week 6: Advanced hooks (useMemo, useCallback, useRef, custom hook)
- Week 7: API integration and Node.js fundamentals
- Week 8: Express.js and routing
- Week 9: MongoDB and Mongoose
- Week 10: REST API development
- Week 11: Frontend-backend integration and deployment
- Week 12: Final project submission

## Screenshot rule
Take screenshots from your own running project. Do not use placeholder/fake screenshots in the submitted workbook.
