import React, { useState } from 'react';
import { signUp, signIn } from '../lib/database';

export default function Auth({ onAuth }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) { await signUp(email, password); }
      else { await signIn(email, password); }
      onAuth();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-logo">yithra</div>
      <div className="auth-tagline">Your money. One move at a time.</div>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Email</label>
          <input className="input-field" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <input className="input-field" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={isSignUp ? 'new-password' : 'current-password'} />
        </div>
        {error && <div className="error-text">{error}</div>}
        <div style={{ marginTop: 20 }}>
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}</button>
        </div>
      </form>
      <div className="auth-toggle">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button className="btn-secondary" onClick={() => { setIsSignUp(!isSignUp); setError(''); }}>{isSignUp ? 'Sign In' : 'Sign Up'}</button>
      </div>
    </div>
  );
}
