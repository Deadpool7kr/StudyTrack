import { useEffect, useRef, useState } from 'react'

const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Login({ onLogin }) {
  const googleButtonRef = useRef(null)
  const [error, setError] = useState('')
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!clientId) {
      setError('Google Client ID is not configured.')
      return
    }

    const handleCredential = async (response) => {
      try {
        setError('')

        const res = await fetch(`${API_BASE}/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            credential: response.credential
          })
        })

        // Read response safely, whether it is JSON or plain text
        const contentType = res.headers.get('content-type') || ''
        let data

        if (contentType.includes('application/json')) {
          data = await res.json()
        } else {
          const text = await res.text()
          data = {
            message: text || 'Google sign-in failed'
          }
        }

        if (!res.ok) {
          throw new Error(
            data.message || 'Google sign-in failed'
          )
        }

        onLogin(data.user)
      } catch (e) {
        setError(e.message || 'Google sign-in failed')
      }
    }

    const init = () => {
      if (!window.google || !googleButtonRef.current) return

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential
      })

      googleButtonRef.current.innerHTML = ''

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: 'outline',
          size: 'large',
          width: 300,
          text: 'continue_with',
          shape: 'rectangular'
        }
      )
    }

    if (window.google) {
      init()
    } else {
      const script = document.createElement('script')

      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = init

      document.head.appendChild(script)

      return () => {
        script.remove()
      }
    }
  }, [clientId, onLogin])

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="brand-mark login-mark">
          ✓
        </div>

        <div className="login-eyebrow">
          STUDENT WORKSPACE
        </div>

        <h1>Welcome to StudyTrack</h1>

        <p>
          Sign in with Google to keep your tasks and study
          notes linked to your profile.
        </p>

        <div
          ref={googleButtonRef}
          className="google-button"
        />

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <small>
          Your Google password is never stored by StudyTrack.
        </small>

      </div>
    </div>
  )
}