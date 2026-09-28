import express from 'express'
import Task from '../models/Task.js'

const router = express.Router()

let memory = []

const isDb = () => globalThis.mongoReady

// ========================================
// VALIDATION HELPERS
// ========================================

function validateTask(body, isUpdate = false) {
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

  // Description
  if (
    body.description !== undefined &&
    typeof body.description !== 'string'
  ) {
    errors.push('Description must be text')
  }

  if (
    typeof body.description === 'string' &&
    body.description.length > 2000
  ) {
    errors.push(
      'Description must be 2000 characters or less'
    )
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

  // Priority
  if (
    body.priority !== undefined &&
    !['High', 'Medium', 'Low'].includes(body.priority)
  ) {
    errors.push(
      'Priority must be High, Medium, or Low'
    )
  }

  // Due date
  if (
    body.dueDate !== undefined &&
    body.dueDate !== null &&
    body.dueDate !== ''
  ) {
    const date = new Date(body.dueDate)

    if (Number.isNaN(date.getTime())) {
      errors.push(
        'Due date must be a valid date'
      )
    }
  }

  // Completed
  if (
    body.completed !== undefined &&
    typeof body.completed !== 'boolean'
  ) {
    errors.push(
      'Completed must be true or false'
    )
  }

  return errors
}


// ========================================
// GET ALL TASKS
// ========================================

router.get('/', async (req, res) => {
  try {
    const data = isDb()
      ? await Task.find({
          userId: req.user._id
        }).sort({ createdAt: -1 })
      : memory
          .filter(
            task =>
              task.userId ===
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
      'Task fetch error:',
      error
    )

    res.status(500).json({
      message: 'Unable to load tasks'
    })
  }
})


// ========================================
// CREATE TASK
// ========================================

router.post('/', async (req, res) => {
  try {
    const errors = validateTask(
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

      description:
        typeof req.body.description === 'string'
          ? req.body.description.trim()
          : '',

      subject:
        typeof req.body.subject === 'string'
          ? req.body.subject.trim()
          : 'General',

      priority:
        req.body.priority || 'Medium',

      dueDate:
        req.body.dueDate || null,

      completed:
        req.body.completed ?? false,

      userId: req.user._id
    }

    const data = isDb()
      ? await Task.create(payload)
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
      'Task creation error:',
      error
    )

    res.status(500).json({
      message: 'Unable to create task'
    })
  }
})


// ========================================
// UPDATE TASK
// ========================================

router.put('/:id', async (req, res) => {
  try {
    /*
      IMPORTANT:
      Update allows partial changes.

      This means the frontend can send only:
      { completed: true }

      when the user clicks "Mark Complete".
    */

    const errors = validateTask(
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

    // Description
    if (req.body.description !== undefined) {
      updates.description =
        req.body.description.trim()
    }

    // Subject
    if (req.body.subject !== undefined) {
      updates.subject =
        req.body.subject.trim()
    }

    // Priority
    if (req.body.priority !== undefined) {
      updates.priority =
        req.body.priority
    }

    // Due date
    if (req.body.dueDate !== undefined) {
      updates.dueDate =
        req.body.dueDate || null
    }

    // Completed
    if (req.body.completed !== undefined) {
      updates.completed =
        req.body.completed
    }

    // Make sure something is actually being updated
    if (
      Object.keys(updates).length === 0
    ) {
      return res.status(400).json({
        message: 'No valid fields provided'
      })
    }

    // ====================================
    // MONGODB
    // ====================================

    if (isDb()) {
      const data =
        await Task.findOneAndUpdate(
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
          message: 'Task not found'
        })
      }

      return res.json(data)
    }

    // ====================================
    // IN-MEMORY DEVELOPMENT STORAGE
    // ====================================

    const data = memory.find(
      task =>
        task._id === req.params.id &&
        task.userId ===
          req.user._id.toString()
    )

    if (!data) {
      return res.status(404).json({
        message: 'Task not found'
      })
    }

    Object.assign(data, updates)

    data.updatedAt =
      new Date().toISOString()

    res.json(data)

  } catch (error) {
    console.error(
      'Task update error:',
      error
    )

    res.status(500).json({
      message: 'Unable to update task'
    })
  }
})


// ========================================
// DELETE TASK
// ========================================

router.delete('/:id', async (req, res) => {
  try {
    // MongoDB
    if (isDb()) {
      const data =
        await Task.findOneAndDelete({
          _id: req.params.id,
          userId: req.user._id
        })

      if (!data) {
        return res.status(404).json({
          message: 'Task not found'
        })
      }
    }

    // In-memory
    else {
      const before =
        memory.length

      memory = memory.filter(
        task =>
          !(
            task._id === req.params.id &&
            task.userId ===
              req.user._id.toString()
          )
      )

      if (
        before === memory.length
      ) {
        return res.status(404).json({
          message: 'Task not found'
        })
      }
    }

    res.json({
      message: 'Task deleted'
    })

  } catch (error) {
    console.error(
      'Task deletion error:',
      error
    )

    res.status(500).json({
      message: 'Unable to delete task'
    })
  }
})


export default router