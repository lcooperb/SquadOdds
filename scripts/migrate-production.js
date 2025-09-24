const { PrismaClient } = require('@prisma/client')

async function migrateProduction() {
  const prisma = new PrismaClient()

  try {
    console.log('🔄 Starting production database migration...')

    // This will create/update all tables to match the current schema
    await prisma.$executeRaw`
      -- Drop old tables if they exist with wrong structure
      DROP TABLE IF EXISTS "bets" CASCADE;
      DROP TABLE IF EXISTS "comments" CASCADE;
      DROP TABLE IF EXISTS "comment_likes" CASCADE;
      DROP TABLE IF EXISTS "option_price_history" CASCADE;
      DROP TABLE IF EXISTS "price_history" CASCADE;
      DROP TABLE IF EXISTS "market_options" CASCADE;
      DROP TABLE IF EXISTS "events" CASCADE;
      DROP TABLE IF EXISTS "payments" CASCADE;
      DROP TABLE IF EXISTS "redemptions" CASCADE;
      DROP TABLE IF EXISTS "Account" CASCADE;
      DROP TABLE IF EXISTS "Session" CASCADE;
      DROP TABLE IF EXISTS "User" CASCADE;
      DROP TABLE IF EXISTS "VerificationToken" CASCADE;
    `

    console.log('✅ Old tables dropped')
    console.log('🔄 Please redeploy to Vercel to recreate tables with correct schema')

  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateProduction()