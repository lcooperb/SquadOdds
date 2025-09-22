#!/bin/bash
echo "Building FriendBets for production..."

# Generate Prisma client
npx prisma generate

# Push database schema (for SQLite)
npx prisma db push

# Run database seed with sample data
npx ts-node scripts/seed.ts

echo "Build completed successfully!"
