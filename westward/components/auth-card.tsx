'use client';

import { useState } from 'react';
import { ArrowRight, Lock, Mail, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AuthCardProps {
  initialMode?: 'login' | 'register';
  onSuccess?: () => void | Promise<void>;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export default function AuthCard({
  initialMode = 'login',
  onSuccess,
  title,
  subtitle,
  compact = false,
}: AuthCardProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (mode === 'register' && (!name.trim() || name.trim().length < 2)) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          name: mode === 'register' ? name.trim() : undefined,
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string; user?: { displayName: string } };

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your details.');
      }

      toast.success(
        mode === 'register'
          ? `Welcome to WESTWARD, ${data.user?.displayName || 'Friend'}!`
          : `Welcome back, ${data.user?.displayName || 'Friend'}!`
      );

      // Reset form
      setName('');
      setEmail('');
      setPassword('');

      if (onSuccess) {
        await onSuccess();
      }
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`auth-card-container ${compact ? 'compact' : ''}`}>
      {title && <h2 className="auth-card-title">{title}</h2>}
      {subtitle && <p className="auth-card-subtitle">{subtitle}</p>}

      <div className="auth-tabs" role="tablist" aria-label="Account access options">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'login'}
          className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
          onClick={() => {
            setMode('login');
            setError('');
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'register'}
          className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
          onClick={() => {
            setMode('register');
            setError('');
          }}
        >
          Create account
        </button>
      </div>

      {error && (
        <div className="auth-error-banner" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {mode === 'register' && (
          <div className="auth-input-group">
            <label htmlFor="auth-name">Full name</label>
            <div className="auth-input-wrapper">
              <User className="auth-icon" size={17} />
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Samuel Bennett"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
        )}

        <div className="auth-input-group">
          <label htmlFor="auth-email">Email address</label>
          <div className="auth-input-wrapper">
            <Mail className="auth-icon" size={17} />
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="auth-input-group">
          <div className="auth-label-row">
            <label htmlFor="auth-password">Password</label>
            {mode === 'register' && <span className="auth-hint">Min. 6 characters</span>}
          </div>
          <div className="auth-input-wrapper">
            <Lock className="auth-icon" size={17} />
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          className="button auth-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <span className="auth-btn-loading">
              <Loader2 className="animate-spin" size={18} />
              {mode === 'register' ? 'Creating account…' : 'Signing in…'}
            </span>
          ) : (
            <>
              {mode === 'register' ? 'Create WESTWARD account' : 'Sign in to WESTWARD'}
              <ArrowRight size={18} />
            </>
          )}
        </button>

        <div className="auth-switch-note">
          {mode === 'login' ? (
            <p>
              New to WESTWARD?{' '}
              <button
                type="button"
                className="text-link auth-switch-link"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
              >
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="text-link auth-switch-link"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
