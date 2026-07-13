export const COLORS = ['#2F5EFF', '#FF4470', '#FFD23F', '#17B890', '#B14EFF', '#FF7A00'];
export const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const QUOTES = [
  "Small reps today, a different person by December.",
  "Discipline is just a promise you keep when no one's watching.",
  "You don't need motivation. You need a next action.",
  "Skipping once is a slip. Skipping twice is a new habit.",
  "The bar isn't perfect. The bar is 'did it happen today.'",
  "Future you is built entirely out of today's small choices.",
  "Consistency beats intensity, every single time.",
  "Show up ugly. Showing up at all is the whole game.",
  "One tick mark won't change your life. Zero tick marks will.",
  "You're not behind. You're just starting from right now.",
  "Progress is quiet. Keep going even when no one's clapping.",
  "The version of you that you want already does this daily.",
  "Momentum is a habit you haven't broken yet.",
  "Rest if you must, but don't let 'rest' become 'quit'.",
  "Every streak was once a single first day.",
  "Do it badly before you do it well. Just do it today.",
  "Your calendar is a mirror. Make today worth reflecting.",
  "Nobody regrets the days they showed up for themselves.",
  "The habit isn't the hard part. Starting today is.",
  "Small and steady outruns big and occasional.",
  "You're allowed to be tired and still tick the box.",
  "A habit is a vote for the person you're becoming.",
  "Don't wait to feel ready. Ready shows up after you start.",
  "Today's box is the only one that counts right now.",
  "Cheap consistency beats expensive perfection.",
  "The streak isn't the goal. The person it builds is.",
  "You've survived every hard day so far. Add one more win.",
  "It's not about time, it's about showing up on repeat.",
  "Effort compounds quietly until one day it's obvious.",
  "Today is a fresh box. Fill it in.",
  "Your future self is watching what you do right now.",
  "Discomfort today, freedom later. Worth the trade.",
  "You don't rise to your goals, you fall to your systems.",
  "Keep the promise you made to yourself yesterday.",
  "One more day of showing up is never wasted.",
  "The habit is built in the moment you don't feel like it.",
  "Do the thing before you talk yourself out of it.",
  "Steady hands build the biggest things.",
  "Every checkmark is proof you kept your word.",
  "Not motivated? Fine. Do it anyway. That's the muscle."
];

export function pad(n) {
  return n.toString().padStart(2, '0');
}

export function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayDate() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

export function computeStreak(habit) {
  const today = todayDate();
  let cursor = new Date(today);
  if (!habit.completions[dateKey(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (habit.completions[dateKey(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function daysSinceEpoch(d) {
  const epoch = Date.UTC(2020, 0, 1);
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - epoch) / 86400000);
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledIndices(n, seed) {
  const arr = [...Array(n).keys()];
  const rand = mulberry32(seed);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function todaysQuote() {
  const n = QUOTES.length;
  const dayAbs = daysSinceEpoch(todayDate());
  const epoch = Math.floor(dayAbs / n);
  const pos = dayAbs % n;
  const perm = shuffledIndices(n, epoch + 91177);
  return QUOTES[perm[pos]];
}

export function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 8) || 'user';
}

export function genPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
