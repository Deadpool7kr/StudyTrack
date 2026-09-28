import { useRef, useState } from 'react'
import { Camera, Check, ImagePlus, LogOut } from 'lucide-react'

const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function ProfileSetup({
  user,
  onComplete,
  onLogout
}) {
  // Start with the currently selected StudyTrack photo.
  // If none exists, use the Google photo.
  const [name, setName] = useState(user?.name || '')

  const [photo, setPhoto] = useState(
    user?.profilePhoto ||
    user?.googlePhoto ||
    ''
  )

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fileRef = useRef(null)

  // ===============================
  // SELECT DESKTOP PHOTO
  // ===============================
  const handlePhoto = (file) => {
    if (!file) return

    setError('')

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Please choose an image smaller than 5 MB.')
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      const img = new Image()

      img.onload = () => {
        const max = 500

        const scale = Math.min(
          1,
          max / Math.max(img.width, img.height)
        )

        const canvas = document.createElement('canvas')

        canvas.width = Math.max(
          1,
          Math.round(img.width * scale)
        )

        canvas.height = Math.max(
          1,
          Math.round(img.height * scale)
        )

        const ctx = canvas.getContext('2d')

        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        )

        const convertedPhoto =
          canvas.toDataURL(
            'image/jpeg',
            0.82
          )

        // Immediately show desktop photo
        setPhoto(convertedPhoto)
      }

      img.onerror = () => {
        setError(
          'The selected image could not be read.'
        )
      }

      img.src = reader.result
    }

    reader.onerror = () => {
      setError(
        'The selected image could not be read.'
      )
    }

    reader.readAsDataURL(file)
  }

  // ===============================
  // USE GOOGLE PHOTO
  // ===============================
  const useGooglePhoto = () => {
    if (!user?.googlePhoto) {
      setError(
        'Google profile photo is not available.'
      )
      return
    }

    // Immediately change the displayed photo
    setPhoto(user.googlePhoto)

    setError('')
  }

  // ===============================
  // SAVE PROFILE
  // ===============================
  const submit = async (e) => {
    e.preventDefault()

    const cleanName = name.trim()

    if (cleanName.length < 2) {
      setError(
        'Please enter a name with at least 2 characters.'
      )
      return
    }

    if (cleanName.length > 60) {
      setError(
        'Name must be 60 characters or fewer.'
      )
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch(
        `${API_BASE}/auth/profile`,
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json'
          },

          credentials: 'include',

          body: JSON.stringify({
            name: cleanName,
            profilePhoto: photo
          })
        }
      )

      const contentType =
        res.headers.get('content-type') || ''

      let data

      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        const text = await res.text()

        throw new Error(
          text || 'Unable to save profile'
        )
      }

      if (!res.ok) {
        throw new Error(
          data.message ||
          'Unable to save profile'
        )
      }

      onComplete(data.user)

    } catch (err) {
      setError(err.message)

    } finally {
      setSaving(false)
    }
  }

  const initials =
    (name ||
      user?.email ||
      'S')
      .charAt(0)
      .toUpperCase()

  // Is the currently displayed photo different
  // from the Google account photo?
  const showingCustomPhoto =
    Boolean(
      photo &&
      user?.googlePhoto &&
      photo !== user.googlePhoto
    )

  return (
    <div className="profile-page">

      <div className="profile-card">

        <div className="profile-mark">
          <Check size={22} />
        </div>

        <div className="login-eyebrow">
          WELCOME TO STUDYTRACK
        </div>

        <h1>
          Complete your profile
        </h1>

        <p className="profile-intro">
          Choose the name and profile photo
          you want to use in your StudyTrack
          workspace.
        </p>

        <form onSubmit={submit}>

          {/* =========================
              PROFILE PHOTO
          ========================== */}

          <div className="profile-photo-wrap">

            <div className="profile-photo-large">

              {photo ? (
                <img
                  src={photo}
                  alt="Profile preview"
                />
              ) : (
                <span>
                  {initials}
                </span>
              )}

            </div>

            <div className="photo-actions">

              {/* Change from desktop */}
              <button
                type="button"
                className="photo-button"
                onClick={() =>
                  fileRef.current?.click()
                }
              >
                <Camera size={15} />
                Change photo
              </button>

              {/* Back to Google photo */}
              {showingCustomPhoto &&
                user?.googlePhoto && (
                  <button
                    type="button"
                    className="photo-button"
                    onClick={useGooglePhoto}
                  >
                    <ImagePlus size={15} />
                    Use Google photo
                  </button>
                )}

            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => {
                handlePhoto(
                  e.target.files?.[0]
                )

                // Allows selecting the same
                // file again
                e.target.value = ''
              }}
            />

          </div>


          {/* =========================
              DISPLAY NAME
          ========================== */}

          <label className="profile-label">

            Display name

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Enter your name"
              maxLength={60}
              autoFocus
            />

          </label>


          {/* =========================
              GOOGLE ACCOUNT
          ========================== */}

          <div className="profile-account">

            <ImagePlus size={16} />

            <div>

              <strong>
                Google account
              </strong>

              <span>
                {user?.email}
              </span>

            </div>

          </div>


          {/* =========================
              ERROR
          ========================== */}

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}


          {/* =========================
              CONTINUE
          ========================== */}

          <button
            className="primary-btn profile-submit"
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Saving profile…'
              : 'Continue to StudyTrack'}
          </button>

        </form>


        {/* =========================
            LOGOUT
        ========================== */}

        <button
          className="profile-logout"
          type="button"
          onClick={onLogout}
        >
          <LogOut size={15} />
          Use another Google account
        </button>

      </div>

    </div>
  )
}