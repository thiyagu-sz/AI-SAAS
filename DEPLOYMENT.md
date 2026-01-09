# Deployment Guide for AI Study Notes

This guide will help you deploy your AI Study Notes application to production.

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

Vercel is the recommended platform for Next.js applications as it's made by the creators of Next.js.

#### Steps:

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/ai-study-notes.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with your GitHub account
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**
   In Vercel dashboard, go to your project → Settings → Environment Variables, and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENROUTER_API_KEY=your_openrouter_key
   OPENAI_API_KEY=your_openai_key
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

5. **Update Supabase Redirect URLs**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel URL to "Redirect URLs":
     - `https://your-project.vercel.app`
     - `https://your-project.vercel.app/auth/callback`

---

### Option 2: Netlify

1. **Push to GitHub** (same as above)

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign up/Login with GitHub
   - Click "Add new site" → "Import an existing project"
   - Select your repository

3. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Framework preset: Next.js

4. **Environment Variables**
   - Go to Site settings → Environment variables
   - Add all your environment variables

5. **Deploy**
   - Click "Deploy site"
   - Your app will be live at `https://your-project.netlify.app`

---

### Option 3: Railway

1. **Push to GitHub**

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Configure**
   - Railway auto-detects Next.js
   - Add environment variables in the Variables tab

4. **Deploy**
   - Railway will automatically deploy
   - Get your URL from the project dashboard

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
Make sure you have all required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`
- `OPENAI_API_KEY`

### 2. Database Setup
- ✅ Run all SQL migrations in Supabase (check `CHAT_SCHEMA.sql` if exists)
- ✅ Verify all tables exist:
  - `collections`
  - `documents`
  - `notes`
  - `chat_conversations`
  - `chat_messages`
  - `chat_exports`
- ✅ Verify Row Level Security (RLS) policies are enabled

### 3. Supabase Configuration
- ✅ Update Authentication → URL Configuration:
  - Add production URL to "Site URL"
  - Add production URL to "Redirect URLs"
  - Add `https://your-domain.com/auth/callback` to redirect URLs

### 4. Build Test
Test the build locally:
```bash
npm run build
npm start
```

### 5. Security
- ✅ Never commit `.env.local` to Git
- ✅ Use environment variables in deployment platform
- ✅ Verify API keys are valid and have proper permissions

---

## 🔧 Vercel-Specific Configuration

### Create `vercel.json` (Optional)
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### Custom Domain Setup
1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs with your custom domain

---

## 🌐 Environment-Specific URLs

### Development
- Local: `http://localhost:3000`
- Supabase redirect: `http://localhost:3000/auth/callback`

### Production
- Vercel: `https://your-project.vercel.app`
- Supabase redirect: `https://your-project.vercel.app/auth/callback`

---

## 📝 Post-Deployment Steps

1. **Test Authentication**
   - Try signing up
   - Try logging in
   - Verify redirects work

2. **Test Core Features**
   - Upload a document
   - Generate notes
   - Use chat assistant
   - Export functionality

3. **Monitor**
   - Check Vercel/Netlify logs for errors
   - Monitor Supabase dashboard for API usage
   - Set up error tracking (optional: Sentry)

4. **Performance**
   - Enable Vercel Analytics (optional)
   - Check Core Web Vitals
   - Optimize images if needed

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs in deployment platform
- Verify all dependencies are in `package.json`
- Ensure Node.js version is compatible (check `package.json` engines)

### Environment Variables Not Working
- Verify variable names match exactly (case-sensitive)
- Redeploy after adding new variables
- Check for typos in variable values

### Authentication Issues
- Verify Supabase redirect URLs include your production URL
- Check Supabase API keys are correct
- Verify RLS policies allow authenticated users

### Database Errors
- Ensure all migrations have been run
- Check Supabase logs for query errors
- Verify table names match your code

---

## 🔐 Security Best Practices

1. **Never expose sensitive keys**
   - Keep `OPENROUTER_API_KEY` and `OPENAI_API_KEY` secret
   - Use environment variables only

2. **Supabase RLS**
   - Ensure Row Level Security is enabled on all tables
   - Test that users can only access their own data

3. **API Rate Limiting**
   - Monitor API usage
   - Set up rate limits if needed

4. **HTTPS Only**
   - All production URLs should use HTTPS
   - Vercel/Netlify provide HTTPS by default

---

## 📊 Monitoring & Analytics

### Vercel Analytics
- Enable in Vercel dashboard → Analytics
- Free tier includes basic analytics

### Supabase Monitoring
- Check Supabase dashboard → Logs
- Monitor API usage and errors

### Error Tracking (Optional)
- Consider adding Sentry for error tracking
- Or use Vercel's built-in error tracking

---

## 🚀 Quick Deploy Commands

### Vercel CLI (Alternative Method)
```bash
npm i -g vercel
vercel login
vercel
```

### Netlify CLI (Alternative Method)
```bash
npm i -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

---

## 📞 Support

If you encounter issues:
1. Check deployment platform logs
2. Check Supabase logs
3. Verify environment variables
4. Test locally first with production environment variables

---

## ✅ Deployment Checklist Summary

- [ ] Code pushed to GitHub
- [ ] Environment variables configured in deployment platform
- [ ] Supabase database migrations run
- [ ] Supabase redirect URLs updated
- [ ] Build test successful locally
- [ ] Custom domain configured (if applicable)
- [ ] Authentication tested
- [ ] Core features tested
- [ ] Monitoring set up

---

**Recommended Platform: Vercel** - Best for Next.js, easiest setup, free tier available.
