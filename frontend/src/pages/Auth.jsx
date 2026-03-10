import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import BrandMark from '../components/branding/BrandMark'
import { authAPI } from '../utils/api'

function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
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

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-white font-display mb-1">{title}</h1>
          <p className="text-gray-500 text-sm mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)
  const adminEmail = 'admin@talentconnect.com'
  const adminPassword = 'Admin@12345'

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const user = await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your TalentConnect account">
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

      <div className="card mt-6 p-5 border border-brand-500/20 bg-brand-500/5">
        <p className="text-sm font-semibold text-white">Admin Login – Demo Access</p>
        <p className="text-xs text-gray-400 mt-2">
          For demonstration purposes, an administrator account is available to access the System Controller dashboard.
        </p>
        <p className="text-xs text-brand-300 mt-3">
          <a href={`mailto:${adminEmail}`} className="hover:text-white transition-colors">
            {adminEmail}
          </a>
        </p>
        <button
          onClick={async () => {
            setAdminLoading(true)
            try {
              const user = await login(adminEmail, adminPassword)
              toast.success('Admin access granted')
              navigate('/admin', { replace: true })
            } catch (e) {
              toast.error(e.response?.data?.detail || 'Admin login failed')
            } finally {
              setAdminLoading(false)
            }
          }}
          disabled={adminLoading}
          className="btn-primary mt-4 w-full flex items-center justify-center gap-2"
          type="button"
        >
          {adminLoading ? <Loader2 size={16} className="animate-spin" /> : null}
          Login as Admin
        </button>
      </div>

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
