'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MONTHS } from '@/lib/habitUtils';

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState('');
  const [lastCred, setLastCred] = useState(null);
  const [stamp, setStamp] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function loadUsers() {
    const res = await fetch('/api/admin/users');
    if (res.status === 401) { router.push('/login'); return; }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setErr(body.error || `Server error (${res.status}). Check server logs / KV setup.`);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
    const t = new Date();
    setStamp({
      dow: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][t.getDay()],
      dnum: t.getDate(),
      mon: `${MONTHS[t.getMonth()].slice(0, 3).toUpperCase()} ${t.getFullYear()}`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateUser() {
    const name = nameInput.trim();
    if (!name) return;
    setBusy(true);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { alert(data.error || 'Could not create user.'); return; }
    setLastCred(data.user);
    setNameInput('');
    loadUsers();
  }

  async function removeUser(id, name) {
    if (!confirm(`Remove ${name} and all their habit history? This can't be undone.`)) return;
    await fetch(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
    loadUsers();
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  function copyCred() {
    if (!lastCred) return;
    const text = `Habit Smasher login\nID: ${lastCred.id}\nPassword: ${lastCred.password}`;
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  const totalHabits = users.reduce((s, u) => s + u.total, 0);
  const totalDone = users.reduce((s, u) => s + u.doneToday, 0);

  return (
    <div className="wrap">
      <header>
        <div className="title-block">
          <h1><span className="pink-tag">ADMIN</span><br />CONTROL DESK</h1>
          <p className="greeting">Manage every habit tracker from one place.</p>
        </div>
        <div className="header-right">
          <button className="logout-btn" onClick={logout}>Log out</button>
          {stamp && (
            <div className="stamp">
              <span className="dow">{stamp.dow}</span>
              <span className="dnum">{stamp.dnum}</span>
              <span className="mon">{stamp.mon}</span>
            </div>
          )}
        </div>
      </header>

      {err && <div className="err-msg">{err}</div>}

      <div className="stats">
        <div className="stat"><b>{users.length}</b>users</div>
        <div className="stat"><b>{totalHabits}</b>habits total</div>
        <div className="stat"><b>{totalDone}</b>ticks today</div>
      </div>

      <div className="add-box dark-box">
        <h2>+ New user</h2>
        <p className="sub">Type a name, generate a login, hand it to them.</p>
        <div className="add-row">
          <input
            type="text"
            placeholder="e.g. Rahul Mehta"
            maxLength={40}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') generateUser(); }}
          />
          <button onClick={generateUser} disabled={busy}>{busy ? 'Generating…' : 'Generate login'}</button>
        </div>
      </div>

      {lastCred && (
        <div className="cred-card">
          <div className="lbl">New login created for {lastCred.name} — copy and send to them</div>
          <div className="cred-row"><span>User ID</span><span className="cred-val">{lastCred.id}</span></div>
          <div className="cred-row"><span>Password</span><span className="cred-val">{lastCred.password}</span></div>
          <button className="small" onClick={copyCred}>Copy both</button>
          <button className="small" style={{ marginLeft: 8 }} onClick={() => setLastCred(null)}>Dismiss</button>
        </div>
      )}

      <h2 style={{ fontFamily: "'Archivo Black'", fontSize: 18, margin: '0 0 12px' }}>All users</h2>

      {loading ? (
        <p className="loading-note">Loading users…</p>
      ) : users.length === 0 ? (
        <div className="empty-state">No users yet. Generate the first login above.</div>
      ) : (
        <div className="user-grid">
          {users.map((u) => (
            <div className="user-card" key={u.id}>
              <div className="u-left">
                <div className="u-name">{u.name}</div>
                <div className="u-id">ID: {u.id} &nbsp;·&nbsp; joined {new Date(u.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="u-stats">
                <div className="u-pill">{u.total} habits</div>
                <div className="u-pill">{u.doneToday} done today</div>
                <div className="u-pill">{u.bestStreak}🔥 best streak</div>
              </div>
              <div className="u-actions">
                <button className="small teal" onClick={() => router.push(`/user?userId=${encodeURIComponent(u.id)}`)}>View</button>
                <button className="small pink" onClick={() => removeUser(u.id, u.name)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <footer>Admin desk · every user's data lives in your Vercel KV database</footer>
    </div>
  );
}
