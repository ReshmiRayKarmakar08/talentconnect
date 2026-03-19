import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import BrandMark from '../components/branding/BrandMark'
import api, { authAPI } from '../utils/api'

function AuthLayout({ children, title, subtitle, withCard = true }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="absolute left-5 top-5 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 transition-colors hover:text-white"
        >
          <span className="text-base leading-none">←</span>
          Back
        </Link>
      </div>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-400/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>

        {withCard ? (
          <div className="card p-8">
            <h1 className="text-2xl font-bold text-white font-display mb-1">{title}</h1>
            <p className="text-gray-500 text-sm mb-6">{subtitle}</p>
            {children}
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-white font-display mb-1 text-center">{title}</h1>
            <p className="text-gray-500 text-sm mb-6 text-center">{subtitle}</p>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

export function LoginPage() {
  const { register, handleSubmit, formState: { errors }, setValue, getValues } = useForm()
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)
  const [mode, setMode] = useState('user')
  const [showAdminAccess, setShowAdminAccess] = useState(false)
  const adminEmail = 'admin@talentconnect.com'
  const adminPassword = 'Admin@12345'

  useEffect(() => {
    api.get('/health').catch(() => {})
  }, [])

  const onSubmit = async (data) => {
    setLoading(true)
    let warmupToast
    const warmupTimer = setTimeout(() => {
      warmupToast = toast.loading('Waking the server, this can take a moment...')
    }, 1500)
    try {
      const user = await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Invalid credentials')
    } finally {
      clearTimeout(warmupTimer)
      if (warmupToast) toast.dismiss(warmupToast)
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your TalentConnect account" withCard={false}>
      <div className="card p-6 max-w-md mx-auto">
        <div className="flex items-center gap-2 p-1 rounded-full border border-white/10 bg-white/5">
          <button
            type="button"
            onClick={() => setMode('user')}
            className={`flex-1 text-xs font-semibold py-2 rounded-full transition-colors ${
              mode === 'user' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            User
          </button>
          <button
            type="button"
            onClick={() => setMode('admin')}
            className={`flex-1 text-xs font-semibold py-2 rounded-full transition-colors ${
              mode === 'admin' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Admin
          </button>
        </div>

        {mode === 'user' ? (
          <div className="mt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            {...register('email', { required: 'Email is required' })}
            type="email"
            className="input"
            placeholder="you@university.edu"
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input
              {...register('password', { required: 'Password is required' })}
              type={showPwd ? 'text' : 'password'}
              className="input pr-11"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-5">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                Sign up
              </Link>
            </p>
            <p className="text-center text-gray-500 text-sm mt-2">
              <Link to="/forgot-password" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                Forgot password?
              </Link>
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-sm font-semibold text-white">Admin Access</p>
            <p className="text-xs text-gray-400 mt-2">
              Use the administrator account to access the System Controller dashboard.
            </p>
            <button
              type="button"
              onClick={() => {
                const next = !showAdminAccess
                setShowAdminAccess(next)
                if (next) {
                  setValue('admin_email', adminEmail, { shouldValidate: true })
                  setValue('admin_password', adminPassword, { shouldValidate: true })
                }
              }}
              className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-xs text-gray-300 hover:text-white transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Admin Access</span>
              </div>
              {showAdminAccess && (
                <div className="mt-3 space-y-1 text-gray-300">
                  <div>{adminEmail}</div>
                  <div className="text-gray-400">Password: {adminPassword}</div>
                </div>
              )}
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setAdminLoading(true)
                const email = getValues('admin_email') || adminEmail
                const password = getValues('admin_password') || adminPassword
                login(email, password)
                  .then((user) => {
                    toast.success('Admin access granted')
                    navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
                  })
                  .catch((e) => {
                    toast.error(e.response?.data?.detail || e.message || 'Admin login failed')
                  })
                  .finally(() => setAdminLoading(false))
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="label">Email</label>
                <input
                  {...register('admin_email')}
                  type="email"
                  className="input"
                  placeholder="admin@talentconnect.com"
                />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    {...register('admin_password')}
                    type={showPwd ? 'text' : 'password'}
                    className="input pr-11"
                    placeholder="Admin password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <button
                disabled={adminLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
                type="submit"
              >
                {adminLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                Login as Admin
              </button>
            </form>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}

export function RegisterPage() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const { register: registerUser } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const user = await registerUser(data)
      toast.success('Account created!')
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Join TalentConnect — learn, teach, earn">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Full Name</label>
            <input
              {...register('full_name', { required: 'Required' })}
              className="input"
              placeholder="Alex Johnson"
            />
            {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="label">Username</label>
            <input
              {...register('username', { required: 'Required', minLength: { value: 3, message: 'Min 3 chars' } })}
              className="input"
              placeholder="alexj"
            />
            {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
          </div>
        </div>

        <div>
          <label className="label">Email</label>
          <input
            {...register('email', { required: 'Email is required' })}
            type="email"
            className="input"
            placeholder="you@university.edu"
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">College / University</label>
          <input
            {...register('college')}
            className="input"
            placeholder="IIT Bombay"
          />
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input
              {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })}
              type={showPwd ? 'text' : 'password'}
              className="input pr-11"
              placeholder="Min 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-gray-500 text-sm mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export function ForgotPasswordPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authAPI.forgotPassword({
        email: data.email,
        new_password: data.new_password,
      })
      toast.success('Password reset successfully')
      navigate('/login', { replace: true })
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Reset password" subtitle="Set a new password for your account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            {...register('email', { required: 'Email is required' })}
            type="email"
            className="input"
            placeholder="you@university.edu"
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">New Password</label>
          <div className="relative">
            <input
              {...register('new_password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })}
              type={showPwd ? 'text' : 'password'}
              className="input pr-11"
              placeholder="Min 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.new_password && <p className="text-red-400 text-xs mt-1">{errors.new_password.message}</p>}
        </div>

        <div>
          <label className="label">Confirm Password</label>
          <div className="relative">
            <input
              {...register('confirm_password', {
                required: 'Required',
                validate: (value) => value === watch('new_password') || 'Passwords do not match',
              })}
              type={showConfirmPwd ? 'text' : 'password'}
              className="input pr-11"
              placeholder="Repeat new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPwd(!showConfirmPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showConfirmPwd ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.confirm_password && <p className="text-red-400 text-xs mt-1">{errors.confirm_password.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? 'Resetting password...' : 'Save New Password'}
        </button>
      </form>

      <p className="text-center text-gray-500 text-sm mt-5">
        Remembered it?{' '}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  )
}
