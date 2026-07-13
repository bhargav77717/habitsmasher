'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState('user');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function doLogin(e) {
    e.preventDefault();
    setErr('');
    if (!id.trim() || !password) {
      setErr('Enter both ID and password.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: tab, id: id.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || 'Login failed.');
        setBusy(false);
        return;
      }
      if (data.role === 'admin') router.push('/admin');
      else router.push('/user');
    } catch (e) {
      setErr('Something went wrong. Try again.');
      setBusy(false);
    }
  }

  return (
    <div className="wrap narrow">
      <div className="login-shell">
        <div className="login-card">
          <h1 className="login-title"><span>HABIT</span> SMASHER</h1>
          <p className="login-sub">punch the calendar. build the streak.</p>

          <div className="tabs">
            <div
              className={`tab ${tab === 'user' ? 'active' : ''}`}
              onClick={() => { setTab('user'); setErr(''); }}
            >
              User
            </div>
            <div
              className={`tab ${tab === 'admin' ? 'active' : ''}`}
              onClick={() => { setTab('admin'); setErr(''); }}
            >
              Admin
            </div>
          </div>

          {err && <div className="err-msg">{err}</div>}

          <form onSubmit={doLogin}>
            <div className="field">
              <label>{tab === 'admin' ? 'Admin ID' : 'User ID'}</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder={tab === 'admin' ? 'admin' : 'e.g. rahul-482'}
                autoComplete="username"
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="login-btn" disabled={busy}>
              {busy ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
