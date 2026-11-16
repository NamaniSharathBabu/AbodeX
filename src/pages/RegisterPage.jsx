import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      register({ name: name || 'New Explorer', email });
      setIsLoading(false);
      showToast(`Welcome to AbodeX, ${name || 'Explorer'}!`, 'success');
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
          <h1 className="text-2xl font-extrabold text-dark">Create your account</h1>
          <p className="text-xs text-secondary">Join millions of travelers discovering unique stays</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-dark uppercase mb-1">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-borderLight text-sm text-dark focus:border-dark focus:outline-none font-medium"
              />
              <User className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-dark uppercase mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-borderLight text-sm text-dark focus:border-dark focus:outline-none font-medium"
              />
              <Mail className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-dark uppercase mb-1">
              Create Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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

          <p className="text-[11px] text-secondary leading-relaxed">
            By selecting <strong>Agree and continue</strong>, I agree to AbodeX's Terms of Service, Payments Terms of Service, and Nondiscrimination Policy.
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-airbnb hover:bg-airbnb-hover text-white font-bold text-sm shadow-md transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Creating account...</span>
            ) : (
              <>
                <span>Agree and continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch */}
        <p className="text-center text-xs text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-dark underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};
