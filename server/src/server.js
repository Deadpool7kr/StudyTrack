import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

import authRoutes from './routes/auth.js'
import taskRoutes from './routes/tasks.js'
import noteRoutes from './routes/notes.js'
import { requireAuth } from './middleware/auth.js'

dotenv.config()

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required')
}

if (!process.env.GOOGLE_CLIENT_ID) {
  console.warn(
    'GOOGLE_CLIENT_ID is not configured yet'
  )
}

const app = express()

const frontendOrigin =
  process.env.CLIENT_URL ||
  'http://localhost:5173'

// ========================================
// SECURITY
// ========================================

app.use(helmet())

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true
  })
)

app.use(
  express.json({
    limit: '1mb'
  })
)

app.use(cookieParser())


// ========================================
// ORIGIN / CSRF PROTECTION
// ========================================

app.use((req, res, next) => {
  const stateChangingMethods = [
    'POST',
    'PUT',
    'PATCH',
    'DELETE'
  ]

  if (
    !stateChangingMethods.includes(req.method)
  ) {
    return next()
  }

  const origin = req.headers.origin
  const referer = req.headers.referer

  // If Origin exists, it must match our frontend.
  if (origin) {
    if (origin !== frontendOrigin) {
      return res.status(403).json({
        message: 'Invalid request origin'
      })
    }

    return next()
  }

  // If Origin is not available, check Referer.
  if (referer) {
    try {
      const refererOrigin =
        new URL(referer).origin

      if (
        refererOrigin !== frontendOrigin
      ) {
        return res.status(403).json({
          message: 'Invalid request origin'
        })
      }
    } catch {
      return res.status(403).json({
        message: 'Invalid request origin'
      })
    }
  }

  /*
    Requests without Origin or Referer are
    allowed for API compatibility.

    Authentication still protects the
    protected Tasks and Notes routes.
  */

  next()
})


// ========================================
// RATE LIMITING
// ========================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
})

app.use(
  '/api/auth',
  authLimiter,
  authRoutes
)


// ========================================
// HEALTH CHECK
// ========================================

app.get('/api/health', (req, res) => {
  res.json({
    message: 'StudyTrack API is running'
  })
})


// ========================================
// PROTECTED ROUTES
// ========================================

app.use(
  '/api/tasks',
  requireAuth,
  taskRoutes
)

app.use(
  '/api/notes',
  requireAuth,
  noteRoutes
)


// ========================================
// DATABASE
// ========================================

const port =
  process.env.PORT || 5000

try {
  await mongoose.connect(
    process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/studytrack',
    {
      serverSelectionTimeoutMS: 2500
    }
  )

  globalThis.mongoReady = true

  console.log(
    'MongoDB connected'
  )

} catch (error) {
  console.error(
    'MongoDB connection failed:',
    error.message
  )

  if (
    process.env.NODE_ENV === 'production'
  ) {
    process.exit(1)
  }

  globalThis.mongoReady = false

  console.log(
    'Using in-memory fallback for development'
  )
}


// ========================================
// START SERVER
// ========================================

app.listen(
  port,
  () => {
    console.log(
      `StudyTrack API running on http://localhost:${port}`
    )
  }
)