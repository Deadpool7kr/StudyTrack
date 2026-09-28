import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies?.studytrack_session

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required'
      })
    }

    const payload = jwt.verify(
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

    const user = await User.findById(
      payload.userId
    )

    if (!user) {
      return res.status(401).json({
        message: 'User not found'
      })
    }

    req.user = user

    next()

  } catch (e) {
    return res.status(401).json({
      message: 'Invalid or expired session'
    })
  }
}