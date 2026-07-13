'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  COLORS, DOW, MONTHS, dateKey, todayDate, computeStreak, todaysQuote,
} from '@/lib/habitUtils';

function playThunk() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.09);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  } catch (e) {}
  if (navigator.vibrate) navigator.vibrate(18);
}

function buildCalendarCells(habit) {
  const today = todayDate();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push({ empty: true, key: `e${i}` });

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const k = dateKey(d);
    cells.push({
      key: k,
      day,
      isFuture: d > today,
      isToday: k === dateKey(today),
      isDone: !!habit.completions[k],
    });
  }
  return { cells, label: `${MONTHS[month]} ${year}` };
}

function Calendar({ habit, onToggle }) {
  const { cells, label } = buildCalendarCells(habit);
  const [punching, setPunching] = useState(null);

  return (
    <div className="cal-wrap">
      <div className="cal-month">{label}</div>
      <div className="cal-grid">
        {DOW.map((d, i) => <div className="dow-label" key={`dow${i}`}>{d}</div>)}
        {cells.map((c) => {
          if (c.empty) return <div className="day-cell empty" key={c.key} />;
          let cls = 'day-cell';
          if (c.isFuture) cls += ' future';
          if (c.isToday) cls += ' today';
          if (c.isDone) cls += ' done';
          if (punching === c.key) cls += ' punching';
          return (
            <div
              key={c.key}
              className={cls}
              style={c.isDone ? { background: habit.color } : undefined}
              onClick={() => {
                if (c.isFuture) return;
                playThunk();
                setPunching(c.key);
                setTimeout(() => setPunching(null), 280);
                onToggle(c.key);
              }}
            >
              {c.isDone ? '' : c.day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HabitTracker({ who, habits, setHabits, persist }) {
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [nameInput, setNameInput] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [quote] = useState(todaysQuote());
  const [stamp, setStamp] = useState(null);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const t = new Date();
    setStamp({
      dow: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][t.getDay()],
      dnum: t.getDate(),
      mon: `${MONTHS[t.getMonth()].slice(0, 3).toUpperCase()} ${t.getFullYear()}`,
    });
  }, []);

  function greeting() {
    const h = new Date().getHours();
    const name = who.name.split(' ')[0];
    if (h < 5) return `Still up, ${name}? Get some rest, then get after it.`;
    if (h < 12) return `Morning, ${name} — set the tone for today.`;
    if (h < 17) return `Afternoon, ${name} — keep the streak alive.`;
    if (h < 21) return `Evening, ${name} — close today out strong.`;
    return `Night owl, ${name} — one more tick before you rest.`;
  }

  async function updateHabits(next) {
    setHabits(next);
    await persist(next);
  }

  function addHabit() {
    const name = nameInput.trim();
    if (!name) return;
    const next = [
      ...habits,
      { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, color: selectedColor, completions: {} },
    ];
    setNameInput('');
    updateHabits(next);
  }

  function deleteHabit(id) {
    if (!confirm('Delete this habit and all its history?')) return;
    updateHabits(habits.filter((h) => h.id !== id));
  }

  function toggleDay(habitId, key) {
    const next = habits.map((h) => {
      if (h.id !== habitId) return h;
      const completions = { ...h.completions };
      if (completions[key]) delete completions[key];
      else completions[key] = true;
      return { ...h, completions };
    });
    updateHabits(next);
  }

  const today = todayDate();
  const tKey = dateKey(today);
  const doneToday = habits.filter((h) => h.completions[tKey]).length;
  const total = habits.length;
  const bestStreak = habits.reduce((m, h) => Math.max(m, computeStreak(h)), 0);

  return (
    <div className="wrap">
      <header>
        <div className="title-block">
          <h1><span>{who.name.split(' ')[0].toUpperCase()}'S</span><br />HABIT SMASHER</h1>
          <p className="greeting">{greeting()}</p>
          <div className="id-badge">Ticket holder: <b>{who.name}</b> &nbsp;·&nbsp; ID: {who.id}</div>
        </div>
        <div className="header-right">
          <button className="mode-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>
          <button className="logout-btn" onClick={who.onExit}>{who.exitLabel}</button>
          {stamp && (
            <div className="stamp">
              <span className="dow">{stamp.dow}</span>
              <span className="dnum">{stamp.dnum}</span>
              <span className="mon">{stamp.mon}</span>
            </div>
          )}
        </div>
      </header>

      <div className="quote-box">{quote}</div>

      <div className="stats">
        <div className="stat"><b>{total}</b>habits tracked</div>
        <div className="stat"><b>{doneToday}/{total || 0}</b>done today</div>
        <div className="stat"><b>{bestStreak}🔥</b>best streak</div>
      </div>

      <div className="add-box">
        <h2>+ New habit</h2>
        <div className="add-row">
          <input
            type="text"
            placeholder="e.g. Drink 2L water"
            maxLength={40}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addHabit(); }}
          />
          <div className="swatches">
            {COLORS.map((c) => (
              <div
                key={c}
                className={`swatch ${c === selectedColor ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setSelectedColor(c)}
              />
            ))}
          </div>
          <button onClick={addHabit}>Add</button>
        </div>
      </div>

      <div>
        {habits.length === 0 && (
          <div className="empty-state">
            No habits yet, {who.name.split(' ')[0]}. Add your first one above — you can only tick today and past days, so no cheating ahead of time.
          </div>
        )}
        {habits.map((h) => (
          <div className="habit-card" key={h.id}>
            <div className="habit-head">
              <div className="habit-name-row">
                <div className="color-dot" style={{ background: h.color }} />
                <div className="habit-name">{h.name}</div>
              </div>
              <div className="habit-meta">
                <div className="streak-pill">{computeStreak(h)} day streak</div>
                <button className="del-btn" onClick={() => deleteHabit(h.id)}>Delete</button>
              </div>
            </div>
            <div className="ticket-divider"><span className="notch left" /><span className="notch right" /></div>
            <Calendar habit={h} onToggle={(key) => toggleDay(h.id, key)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function UserPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const viewingId = params.get('userId');

  const [who, setWho] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const meRes = await fetch(`/api/me${viewingId ? `?userId=${encodeURIComponent(viewingId)}` : ''}`);
      if (!meRes.ok) { router.push('/login'); return; }
      const me = await meRes.json();

      let targetId, targetName, exitLabel, onExit;
      if (me.role === 'admin') {
        if (!me.viewing) { router.push('/admin'); return; }
        targetId = me.viewing.id;
        targetName = me.viewing.name;
        exitLabel = 'Back to admin';
        onExit = () => router.push('/admin');
      } else {
        targetId = me.id;
        targetName = me.name;
        exitLabel = 'Log out';
        onExit = async () => {
          await fetch('/api/logout', { method: 'POST' });
          router.push('/login');
        };
      }

      const hRes = await fetch(`/api/habits?userId=${encodeURIComponent(targetId)}`);
      const hData = await hRes.json();

      setWho({ id: targetId, name: targetName, exitLabel, onExit });
      setHabits(hData.habits || []);
      setLoading(false);
    })();
  }, [viewingId, router]);

  const persist = useCallback(async (nextHabits) => {
    if (!who) return;
    await fetch(`/api/habits?userId=${encodeURIComponent(who.id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habits: nextHabits }),
    });
  }, [who]);

  if (loading || !who) {
    return <div className="wrap"><p className="loading-note">Loading your tracker…</p></div>;
  }

  return <HabitTracker who={who} habits={habits} setHabits={setHabits} persist={persist} />;
}

export default function UserPage() {
  return (
    <Suspense fallback={<div className="wrap"><p className="loading-note">Loading…</p></div>}>
      <UserPageInner />
    </Suspense>
  );
}
