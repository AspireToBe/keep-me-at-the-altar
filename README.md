<<<<<<< HEAD
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
=======
# Keep Me At The Altar — Setup Guide

Step-by-step instructions. No coding experience required.

---

## What you need

- A free Supabase account → supabase.com
- A free Vercel account → vercel.com (for hosting)
- This code folder

---

## Step 1 — Create your Supabase project

1. Go to supabase.com and sign in
2. Click **New project**
3. Give it a name: `keep-me-at-the-altar`
4. Choose a region close to Ghana (EU West or any)
5. Set a database password and save it somewhere safe
6. Click **Create new project** — wait 1–2 minutes

---

## Step 2 — Run the database schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase/schema.sql` from this folder
4. Copy the entire contents and paste into the SQL Editor
5. Click **Run** (the green button)
6. You should see "Success" — your 6 tables are now created

---

## Step 3 — Find your admin user ID

This makes you the admin who can approve testimonies.

1. In Supabase, click **Authentication** in the left sidebar
2. Click **Users**
3. Sign up using the app first (see Step 6), then come back here
4. Find your email in the list and copy your **UUID** (looks like: `a1b2c3d4-...`)

---

## Step 4 — Connect the app to Supabase

Open `src/lib/supabase.js` in a text editor and replace:

```
const SUPABASE_URL     = 'https://YOUR_PROJECT_REF.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'
```

Find these values in: Supabase Dashboard → Project Settings → API

Then open `src/App.jsx` and replace:

```
const ADMIN_USER_ID = 'YOUR_ADMIN_USER_ID'
```

With your UUID from Step 3.

---

## Step 5 — Configure magic link emails

Supabase sends magic links automatically. Configure where they go:

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL (you'll get this after Step 7)
   - For now, use: `http://localhost:5173`
3. Add `http://localhost:5173` to **Redirect URLs**
4. Click **Save**

To customise the email template:
1. Go to **Authentication** → **Email Templates**
2. Click **Magic Link**
3. Edit the subject and body to match your brand

---

## Step 6 — Run locally first

Open a terminal in this folder and run:

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

Test it:
- Click **Sign in** and enter your email
- Check your inbox for the magic link
- Click the link — you're signed in
- Your altar day entries will now save to Supabase

---

## Step 7 — Deploy to Vercel

1. Go to vercel.com and sign in with GitHub
2. Push this folder to a GitHub repository
3. In Vercel, click **New Project** → import your repository
4. No build settings needed — Vercel detects Vite automatically
5. Click **Deploy** — takes 1–2 minutes
6. Copy your new URL (e.g. `https://keep-me-at-the-altar.vercel.app`)

Then go back to Supabase → Authentication → URL Configuration and update:
- **Site URL** → your Vercel URL
- **Redirect URLs** → add your Vercel URL

---

## Step 8 — Add your PDF journal for download

1. Put `TheAltarYear_Journal_Filled.pdf` in the `public/` folder
2. Open `src/App.jsx` and find `downloadJournal()`
3. Replace the `showToast` line with:
   ```javascript
   window.location.href = '/TheAltarYear_Journal_Filled.pdf'
   ```

---

## How testimonies work

1. Anyone can submit a testimony — it goes into `pending` status
2. You (as admin) see a review queue at the top of the Testimonies page
3. Click **Publish** to make it live, or **Reject** to remove it
4. Published testimonies appear in the public feed immediately

You can also manage testimonies directly in Supabase:
- Go to **Table Editor** → **testimonies**
- Change the `status` column from `pending` to `published`

---

## Questions?

Every part of this was built for you. If anything doesn't work,
the most common fix is checking that your Supabase URL and
anon key are correctly copied into `src/lib/supabase.js`.
>>>>>>> 422194e635779bc9de3ff07d2d8694e47251d7c9
