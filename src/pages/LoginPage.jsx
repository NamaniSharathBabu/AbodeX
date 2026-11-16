import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('alex.rivera@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(email, password);
      setIsLoading(false);
      showToast('Welcome back, Alex!', 'success');
      navigate('/profile');
    }, 400);
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-4 sm:p-6 bg-bgLight">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-borderLight shadow-modal space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-airbnb mb-2">
            <svg
              className="w-8 h-8 fill-current text-airbnb"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.315 7.1 14.544 1.767 4.001.378 8.653-3.13 10.518-1.523.809-3.237 1.077-4.939.771-1.821-.328-3.414-1.39-4.315-2.885-1.077 1.789-3.036 2.977-5.187 2.87-1.884-.093-3.665-.968-4.78-2.348-1.865-2.308-2.001-5.612-.34-8.083.743-1.107 1.942-2.318 3.511-3.619.645-.534 1.341-1.09 2.079-1.666l.72-.562c1.905-1.488 3.242-2.656 4.008-3.504.606-.671.989-1.332 1.148-1.981C17.275 8.441 16.745 7 16 7c-.745 0-1.275 1.441-1.06 2.348.159.649.542 1.31 1.148 1.981.766.848 2.103 2.016 4.008 3.504l.72.562c.738.576 1.434 1.132 2.079 1.666 1.569 1.301 2.768 2.512 3.511 3.619 1.661 2.471 1.525 5.775-.34 8.083-1.115 1.38-2.896 2.255-4.78 2.348-2.151.107-4.11-.081-5.187-1.87-.901 1.495-2.494 2.557-4.315 2.885-1.702.306-3.416.038-4.939-.771C4.819 28.491 3.43 23.839 5.197 19.838c.986-2.229 5.146-10.714 7.1-14.544l.533-1.025C14.118 1.963 15.573 1 17.581 1H16z" />
            </svg>
          </Link>
          <h1 className="text-2xl font-extrabold text-dark">Welcome back</h1>
          <p className="text-xs text-secondary">Log in to manage your stays and saved wishlists</p>
        </div>

        {/* Social Auth Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-borderLight rounded-2xl text-xs font-bold text-dark hover:border-dark hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-borderLight rounded-2xl text-xs font-bold text-dark hover:border-dark hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4 fill-dark" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.58.67-1.09 1.74-.95 2.78 1.01.08 2.03-.53 2.65-1.28z" />
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-gray-200 w-full" />
          <span className="bg-white px-3 text-xs text-secondary font-medium">or</span>
          <div className="border-t border-gray-200 w-full" />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-dark uppercase mb-1">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-borderLight text-sm text-dark focus:border-dark focus:outline-none font-medium"
              />
              <Mail className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-dark uppercase">
                Password
              </label>
              <a href="#forgot" className="text-xs font-semibold text-secondary hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-2xl border border-borderLight text-sm text-dark focus:border-dark focus:outline-none font-medium"
              />
              <Lock className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-dark"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-airbnb hover:bg-airbnb-hover text-white font-bold text-sm shadow-md transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>Log in</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch */}
        <p className="text-center text-xs text-secondary">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-dark underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
