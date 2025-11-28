# Matchmaker App — Deployment Guide

## Local Development

```bash
# Copy the credentials template and fill in your Supabase details
cp credentials.example.js credentials.js

# Edit credentials.js with your Supabase project URL and anon key
# Then start a local dev server:
npm run dev
# or: python -m http.server 8000
```

Navigate to `http://localhost:8000` and fill out the form. The dev-smoke script will auto-run on localhost if you reload the page (set `window.__DEV_SMOKE_AUTO_SUBMIT = true` in the browser console to auto-submit test data).

## Netlify Deployment

### Step 1: Push your repo to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/matchmaker-app.git
git branch -M main
git push --set-upstream origin main
```

### Step 2: Connect to Netlify
1. Go to [netlify.com](https://netlify.com) and sign up (free).
2. Click **Add new site** → **Import an existing project**.
3. Choose **GitHub** and authorize Netlify to access your repos.
4. Select the `matchmaker-app` repository.
5. Netlify will auto-detect the build settings from `netlify.toml` (build command: `npm run generate:credentials`, publish directory: `.`).
6. Click **Deploy site**.

### Step 3: Add environment variables
1. In Netlify, go to your site's **Site settings** → **Build & deploy** → **Environment**.
2. Click **Add environment variables** and add:
   - Key: `SUPABASE_URL`  
     Value: Your Supabase project URL (e.g., `https://your-project.supabase.co`)
   - Key: `SUPABASE_ANON_KEY`  
     Value: Your Supabase anonymous key (from Project Settings → API Keys)
3. Save and trigger a redeploy.

### Step 4: Redeploy
- Go to **Deploys** and click **Trigger deploy** → **Deploy site** to rebuild with the new env vars.
- Netlify will run `npm run generate:credentials`, which creates `credentials.js` with your Supabase keys injected.
- Your site is now live and connected to Supabase.

## Security Notes
- **Never commit `credentials.js`** — it contains secrets and is ignored by `.gitignore`.
- **Supabase anon keys are safe to expose** client-side if you use **Row Level Security (RLS)** on your database tables. Always enable RLS for production.
- **Service role keys** (if you need admin operations) should only run on your own server or Netlify Functions, never in client code.

## Testing the Deployed Form
1. Visit your Netlify site URL (e.g., `https://your-site.netlify.app`).
2. Fill out the form and submit.
3. Check Supabase to confirm data was inserted (navigate to **Table Editor** → `demographics` table).

## Troubleshooting

**"credentials.js not found" error**
- Check Netlify build logs: Site settings → Build & deploy → Deploy log.
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in environment variables.
- Ensure the build command ran: look for "Generated credentials.js" in the log.

**Form not submitting to Supabase**
- Open browser DevTools (F12) → Console and check for errors.
- Verify the submitted data reaches Supabase (check Database → `demographics` table).
- Check Row Level Security policies allow inserts from anon users.

**Redeploy after code changes**
- Push changes to the `main` branch on GitHub.
- Netlify will auto-deploy within seconds.

## Additional Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Netlify Build Configuration](https://docs.netlify.com/configure-builds/overview/)
- [Row Level Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
