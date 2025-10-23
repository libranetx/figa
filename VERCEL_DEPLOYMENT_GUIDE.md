# Environment Variables for Vercel Deployment

## Step 1: Database Setup

### Option A: Vercel Postgres (Easiest)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to "Storage" tab
4. Click "Create Database"
5. Choose "Postgres"
6. Copy the connection string

### Option B: Neon (Free tier)
1. Go to [Neon](https://neon.tech)
2. Sign up and create a project
3. Copy the connection string from dashboard

### Option C: Supabase (Free tier)
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string

## Step 2: Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database?schema=public

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-app-name.vercel.app

# Cloudinary (optional - for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Step 3: Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

## Step 4: Deploy

1. Push your code to GitHub
2. Connect the repository to Vercel
3. Vercel will automatically deploy with the configured environment variables
4. The database migrations will run automatically during build

## Step 5: Verify Deployment

1. Check that your app loads correctly
2. Test user registration/login
3. Verify database operations work
4. Check file uploads (if using Cloudinary)
