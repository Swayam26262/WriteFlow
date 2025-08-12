# Environment Setup Guide

To fix the "Failed to create post" error, you need to set up the following environment variables:

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
# Replace with your actual Neon database URL
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# JWT Configuration
# Generate a secure random string for production
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Next.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-change-this-in-production"
```

## Getting a Neon Database URL

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string from the dashboard
4. Replace the DATABASE_URL value with your connection string

## Generating JWT Secret

You can generate a secure JWT secret using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Database Setup

After setting up the environment variables, you need to run the database setup scripts:

1. Run the table creation script: `01-create-tables.sql`
2. Run the seed data script: `02-seed-data.sql`
3. Run the admin user creation script: `create-admin.sql`

## Testing

After setting up the environment variables and database:

1. Start the development server: `npm run dev`
2. Test the database connection: `http://localhost:3000/api/test-db`
3. Test authentication: `http://localhost:3000/api/test-auth`
4. Try creating a post again

## Default Login Credentials

- Admin: admin@blog.com / admin123
- Author: author@blog.com / author123
