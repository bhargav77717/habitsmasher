# Habit Smasher — Admin + User Habit Tracker

Same neo-brutalist "ticket" design as the original single-page tracker, now a
real Next.js website with a real database, real login, and an admin panel
that can create/manage users and see everyone's stats.

## How it works

- **Admin** logs in with ID `admin` and the password you set in `ADMIN_PASSWORD`.
  From the admin panel they type a name, click "Generate login", and get a
  User ID + password to hand to that person.
- **Users** log in with the ID/password the admin gave them and see their own
  habit tracker — add habits, tick days, streaks, dark mode, all the same as
  the original.
- All accounts and habit history are stored in a **Vercel KV** database (a
  managed Redis), not in the browser, so it works from any device.
- Passwords are hashed with bcrypt before being stored — never saved in plain
  text. The plaintext password is only ever shown once, right after the admin
  generates it.

## Deploying (GitHub + Vercel)

1. **Push this project to a new GitHub repo.**
   ```bash
   git init
   git add .
   git commit -m "Habit Smasher"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

2. **Import the repo into Vercel.**
   Go to vercel.com → Add New → Project → pick your repo → Deploy.
   The first deploy will fail (or run with no data layer) until you add the
   two things below — that's expected.

3. **Add a Vercel KV database.**
   In your Vercel project → Storage tab → Create Database → **KV**.
   Connect it to this project. Vercel automatically adds the `KV_*` env vars
   for you — you don't need to type those in yourself.

4. **Set your own env vars.**
   In Vercel project → Settings → Environment Variables, add:
   - `ADMIN_PASSWORD` — whatever password you want for the admin login.
   - `SESSION_SECRET` — a long random string. Generate one locally with:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

5. **Redeploy** (Vercel → Deployments → ⋯ → Redeploy) so the new env vars and
   KV connection take effect.

6. Visit your `.vercel.app` URL → `/login` → log in as `admin` with the
   password you set, and start generating user logins.

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in ADMIN_PASSWORD and SESSION_SECRET
npm run dev
```

For local dev to actually save data you'll still need a KV database — either
pull the env vars from your Vercel project with `vercel env pull .env.local`
(after running `vercel link`), or create a free KV database and paste its
`KV_REST_API_URL` / `KV_REST_API_TOKEN` into `.env.local` yourself.

## Changing the admin ID

The admin ID is fixed as `admin` in `app/api/login/route.js` — change the
`id !== 'admin'` check there if you want a different one.

## Project structure

```
app/
  login/page.js        – login screen (user + admin tabs)
  admin/page.js         – admin control desk
  user/page.js           – the habit tracker itself
  api/login, api/logout   – session cookie auth
  api/admin/users/…        – create / list / delete users (admin only)
  api/habits               – get/save the logged-in (or viewed) user's habits
lib/
  store.js     – all database reads/writes (Vercel KV)
  session.js   – signs/verifies the login cookie (JWT)
  habitUtils.js – calendar/streak/quote logic shared by client + server
middleware.js   – blocks /admin and /user for anyone without a valid session
```
