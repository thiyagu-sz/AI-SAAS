# Supabase OAuth Setup Guide

## Enable Google OAuth in Supabase

### Step 1: Go to Authentication Settings
1. Visit: https://app.supabase.com
2. Select your project
3. Go to **Authentication** in the left sidebar
4. Click on **Providers**

### Step 2: Enable Google Provider
1. Find **Google** in the list of providers
2. Toggle it **ON** (enable it)
3. You'll need to configure it with Google OAuth credentials

### Step 3: Get Google OAuth Credentials

#### Option A: If you already have Google OAuth credentials
- Just paste them into Supabase

#### Option B: Create new Google OAuth credentials
1. Go to: https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Choose **Web application**
6. Add **Authorized redirect URIs**:
   ```
   https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
   ```
   Replace `[YOUR_PROJECT_REF]` with your actual Supabase project reference (found in your Supabase URL)
7. Copy the **Client ID** and **Client Secret**

### Step 4: Configure in Supabase
1. Back in Supabase **Authentication > Providers > Google**
2. Paste your **Client ID** and **Client Secret**
3. Click **Save**

### Step 5: Enable Other Providers (Optional)

#### GitHub OAuth
1. Go to: https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: AI Study Notes
   - **Homepage URL**: http://localhost:3000 (or your domain)
   - **Authorization callback URL**: `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
4. Copy **Client ID** and generate **Client Secret**
5. Enable GitHub in Supabase and paste credentials

## Important Notes:

- The redirect URI must be: `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
- Replace `[YOUR_PROJECT_REF]` with the part before `.supabase.co` in your project URL
- After enabling, restart your dev server
- Make sure the provider is toggled **ON** in Supabase

## Quick Links:

- **Supabase Auth Settings**: https://app.supabase.com/project/_/auth/providers
- **Google Cloud Console**: https://console.cloud.google.com/
- **GitHub OAuth Apps**: https://github.com/settings/developers

