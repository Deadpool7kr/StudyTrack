import express from 'express'
import Note from '../models/Note.js'

const router = express.Router()

let memory = []

const isDb = () => globalThis.mongoReady

// ========================================
// VALIDATION
// ========================================

function validateNote(body, isUpdate = false) {
  const errors = []

  // Title
  if (!isUpdate || body.title !== undefined) {
    if (
      typeof body.title !== 'string' ||
      !body.title.trim()
    ) {
      errors.push('Title is required')
    } else if (body.title.trim().length > 160) {
      errors.push(
        'Title must be 160 characters or less'
      )
    }
  }

  // Subject
  if (
    body.subject !== undefined &&
    typeof body.subject !== 'string'
  ) {
    errors.push('Subject must be text')
  }

  if (
    typeof body.subject === 'string' &&
    body.subject.length > 80
  ) {
    errors.push(
      'Subject must be 80 characters or less'
    )
  }

  // Content
  if (!isUpdate || body.content !== undefined) {
    if (
      typeof body.content !== 'string'
    ) {
      errors.push('Content must be text')
    } else if (body.content.length > 10000) {
      errors.push(
        'Content must be 10000 characters or less'
      )
    }
  }

  return errors
}


// ========================================
// GET ALL NOTES
// ========================================

router.get('/', async (req, res) => {
  try {
    const data = isDb()
      ? await Note.find({
          userId: req.user._id
        }).sort({ createdAt: -1 })
      : memory
          .filter(
            note =>
              note.userId ===
              req.user._id.toString()
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt) -
              new Date(a.createdAt)
          )

    res.json(data)

  } catch (error) {
    console.error(
      'Note fetch error:',
      error
    )

    res.status(500).json({
      message: 'Unable to load notes'
    })
  }
})


// ========================================
// CREATE NOTE
// ========================================

router.post('/', async (req, res) => {
  try {
    const errors = validateNote(
      req.body,
      false
    )

    if (errors.length > 0) {
      return res.status(400).json({
        message: errors[0],
        errors
      })
    }

    const payload = {
      title: req.body.title.trim(),

      subject:
        typeof req.body.subject === 'string'
          ? req.body.subject.trim()
          : 'General',

      content: req.body.content,

      userId: req.user._id
    }

    const data = isDb()
      ? await Note.create(payload)
      : {
          _id: crypto.randomUUID(),
          ...payload,
          userId:
            req.user._id.toString(),
          createdAt:
            new Date().toISOString(),
          updatedAt:
            new Date().toISOString()
        }

    if (!isDb()) {
      memory.unshift(data)
    }

    res.status(201).json(data)

  } catch (error) {
    console.error(
      'Note creation error:',
      error
    )

    res.status(500).json({
      message: 'Unable to create note'
    })
  }
})


// ========================================
// UPDATE NOTE
// ========================================

router.put('/:id', async (req, res) => {
  try {
    const errors = validateNote(
      req.body,
      true
    )

    if (errors.length > 0) {
      return res.status(400).json({
        message: errors[0],
        errors
      })
    }

    const updates = {}

    // Title
    if (req.body.title !== undefined) {
      updates.title =
        req.body.title.trim()
    }

    // Subject
    if (req.body.subject !== undefined) {
      updates.subject =
        req.body.subject.trim()
    }

    // Content
    if (req.body.content !== undefined) {
      updates.content =
        req.body.content
    }

    if (
      Object.keys(updates).length === 0
    ) {
      return res.status(400).json({
        message: 'No valid fields provided'
      })
    }

    // MongoDB
    if (isDb()) {
      const data =
        await Note.findOneAndUpdate(
          {
            _id: req.params.id,
            userId: req.user._id
          },
          {
            $set: updates
          },
          {
            new: true,
            runValidators: true
          }
        )

      if (!data) {
        return res.status(404).json({
          message: 'Note not found'
        })
      }

      return res.json(data)
    }

    // In-memory
    const data = memory.find(
      note =>
        note._id === req.params.id &&
        note.userId ===
          req.user._id.toString()
    )

    if (!data) {
      return res.status(404).json({
        message: 'Note not found'
      })
    }

    Object.assign(data, updates)

    data.updatedAt =
      new Date().toISOString()

    res.json(data)

  } catch (error) {
    console.error(
      'Note update error:',
      error
    )

    res.status(500).json({
      message: 'Unable to update note'
    })
  }
})


// ========================================
// DELETE NOTE
// ========================================

router.delete('/:id', async (req, res) => {
  try {
    // MongoDB
    if (isDb()) {
      const data =
        await Note.findOneAndDelete({
          _id: req.params.id,
          userId: req.user._id
        })

      if (!data) {
        return res.status(404).json({
          message: 'Note not found'
        })
      }
    }

    // In-memory
    else {
      const before =
        memory.length

      memory = memory.filter(
        note =>
          !(
            note._id === req.params.id &&
            note.userId ===
              req.user._id.toString()
          )
      )

      if (
        before === memory.length
      ) {
        return res.status(404).json({
          message: 'Note not found'
        })
      }
    }

    res.json({
      message: 'Note deleted'
    })

  } catch (error) {
    console.error(
      'Note deletion error:',
      error
    )

    res.status(500).json({
      message: 'Unable to delete note'
    })
  }
})


export default router