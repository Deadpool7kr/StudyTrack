import express from 'express'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
)


// ===============================
// GOOGLE LOGIN
// ===============================

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({
        message: 'Google credential is required'
      })
    }

    const ticket =
      await googleClient.verifyIdToken({
        idToken: credential,
        audience:
          process.env.GOOGLE_CLIENT_ID
      })

    const payload =
      ticket.getPayload()

    if (
      !payload?.sub ||
      !payload.email ||
      !payload.email_verified
    ) {
      return res.status(401).json({
        message:
          'Google account could not be verified'
      })
    }

    let user = await User.findOne({
      googleId: payload.sub
    })

    if (user) {
      user.email = payload.email
      user.lastLogin = new Date()

      user.googlePhoto =
        payload.picture ||
        user.googlePhoto ||
        ''

      if (!user.profileCompleted) {
        user.name =
          payload.name ||
          user.name

        user.profilePhoto =
          payload.picture ||
          user.profilePhoto ||
          ''
      }

      await user.save()

    } else {
      user = await User.create({
        googleId: payload.sub,

        name:
          payload.name ||
          payload.email.split('@')[0],

        email: payload.email,

        googlePhoto:
          payload.picture || '',

        profilePhoto:
          payload.picture || '',

        profileCompleted: false
      })
    }

    const sessionToken =
      jwt.sign(
        {
          userId:
            user._id.toString()
        },
        process.env.JWT_SECRET,
        {
          algorithm: 'HS256',
          expiresIn: '7d'
        }
      )

    res.cookie(
      'studytrack_session',
      sessionToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          'production',
        sameSite: 'lax',
        maxAge:
          7 * 24 * 60 * 60 * 1000,
        path: '/'
      }
    )

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,

        googlePhoto:
          user.googlePhoto,

        profilePhoto:
          user.profilePhoto,

        profileCompleted:
          user.profileCompleted
      }
    })

  } catch (error) {
    console.error(
      'Google login error:',
      error.message
    )

    res.status(401).json({
      message:
        'Google sign-in failed'
    })
  }
})


// ===============================
// UPDATE PROFILE
// ===============================

router.put(
  '/profile',
  requireAuth,
  async (req, res) => {
    try {
      const name =
        String(
          req.body?.name || ''
        ).trim()

      const profilePhoto =
        typeof req.body?.profilePhoto ===
        'string'
          ? req.body.profilePhoto.trim()
          : ''

      if (
        name.length < 2 ||
        name.length > 60
      ) {
        return res.status(400).json({
          message:
            'Name must be between 2 and 60 characters'
        })
      }

      if (profilePhoto) {
        const isBase64Image =
          /^data:image\/(jpeg|png|webp);base64,/i
            .test(profilePhoto)

        const isGoogleImage =
          /^https:\/\/lh[0-9]*\.googleusercontent\.com\//i
            .test(profilePhoto)

        if (
          !isBase64Image &&
          !isGoogleImage
        ) {
          return res.status(400).json({
            message:
              'Profile photo must be a supported image'
          })
        }

        if (
          isBase64Image &&
          profilePhoto.length > 700000
        ) {
          return res.status(400).json({
            message:
              'Uploaded profile photo is too large'
          })
        }
      }

      req.user.name = name

      req.user.profilePhoto =
        profilePhoto

      req.user.profileCompleted =
        true

      await req.user.save()

      res.json({
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,

          googlePhoto:
            req.user.googlePhoto,

          profilePhoto:
            req.user.profilePhoto,

          profileCompleted:
            req.user.profileCompleted
        }
      })

    } catch (error) {
      console.error(
        'Profile update error:',
        error.message
      )

      res.status(500).json({
        message:
          'Unable to save profile'
      })
    }
  }
)


// ===============================
// GET CURRENT USER
// ===============================

router.get('/me', async (req, res) => {
  try {
    const token =
      req.cookies?.studytrack_session

    if (!token) {
      return res.status(401).json({
        message: 'Not signed in'
      })
    }

    const payload =
      jwt.verify(
        token,
        process.env.JWT_SECRET,
        {
          algorithms: ['HS256']
        }
      )

    if (!payload.userId) {
      return res.status(401).json({
        message: 'Invalid session'
      })
    }

    const user =
      await User.findById(
        payload.userId
      ).select(
        '_id name email googlePhoto profilePhoto profileCompleted'
      )

    if (!user) {
      return res.status(401).json({
        message: 'User not found'
      })
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,

        googlePhoto:
          user.googlePhoto,

        profilePhoto:
          user.profilePhoto,

        profileCompleted:
          user.profileCompleted
      }
    })

  } catch (error) {
    res.status(401).json({
      message: 'Not signed in'
    })
  }
})


// ===============================
// LOGOUT
// ===============================

router.post(
  '/logout',
  (req, res) => {
    res.clearCookie(
      'studytrack_session',
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          'production',
        sameSite: 'lax',
        path: '/'
      }
    )

    res.json({
      message: 'Logged out'
    })
  }
)


export default router