import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'

export default function GoogleLoginButton({ label = 'Continue with Google', disabled = false }) {
  const { loginWithGoogle } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const googleBtnContainerRef = useRef(null)

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const handleCredentialResponse = async (response) => {
    if (!response?.credential) {
      toast.error('Did not receive credentials from Google')
      return
    }

    setLoading(true)
    const toastId = toast.loading('Authenticating with Google...')
    try {
      const user = await loginWithGoogle(response.credential)
      toast.success(`Welcome back, ${user.full_name || 'User'}!`, { id: toastId })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Google sign-in failed'
      toast.error(detail, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!clientId) return

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          })

          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = ''
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              type: 'standard',
              theme: 'filled_black',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              width: 380,
            })
          }
          setGoogleReady(true)
        } catch (e) {
          console.warn('Google Identity initialization error:', e)
        }
      }
    }

    if (window.google?.accounts?.id) {
      initGoogle()
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval)
          initGoogle()
        }
      }, 200)
      return () => clearInterval(interval)
    }
  }, [clientId])

  const handleCustomButtonClick = () => {
    if (!clientId) {
      toast.error('Google Client ID is not configured. Please add VITE_GOOGLE_CLIENT_ID to your environment.')
      return
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If One-tap overlay is suppressed by browser, trigger rendered button click
          const renderedBtn = googleBtnContainerRef.current?.querySelector('div[role="button"]')
          if (renderedBtn) {
            renderedBtn.click()
          }
        }
      })
    } else {
      toast.error('Google Sign-In is still loading. Please wait a moment and retry.')
    }
  }

  return (
    <div className="w-full">
      {/* Hidden rendered container used for fallback/direct triggering */}
      <div ref={googleBtnContainerRef} className="hidden" aria-hidden="true" />

      {/* Styled custom button matching TalentConnect aesthetic */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={handleCustomButtonClick}
        className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-200 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin text-brand-400" />
        ) : (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{loading ? 'Connecting with Google...' : label}</span>
      </button>
    </div>
  )
}
