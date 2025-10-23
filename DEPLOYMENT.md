# Vercel Deployment Environment Variables

## Required Environment Variables

### Database Configuration
```bash
# PostgreSQL Database URL
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

# Optional: Direct URL for migrations (if using connection pooling)
DIRECT_URL="postgresql://username:password@host:port/database?schema=public"
```

### Authentication Configuration
```bash
# NextAuth.js Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-generated-secret-key-here"

# NextAuth.js URL (will be your Vercel domain)
NEXTAUTH_URL="https://your-app-name.vercel.app"
```

### Cloudinary Configuration (for file uploads)
```bash
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables"
4. Add each variable with the corresponding value
5. Make sure to set them for "Production" environment

## Database Setup Options

### Option 1: Vercel Postgres (Recommended)
- Go to Vercel dashboard → Storage → Create Database
- Choose PostgreSQL
- Copy the connection string to DATABASE_URL

### Option 2: Neon (Free tier available)
- Sign up at neon.tech
- Create a new project
- Copy the connection string to DATABASE_URL

### Option 3: Supabase (Free tier available)
- Sign up at supabase.com
- Create a new project
- Go to Settings → Database
- Copy the connection string to DATABASE_URL

### Option 4: Railway
- Sign up at railway.app
- Create a new PostgreSQL service
- Copy the connection string to DATABASE_URL
