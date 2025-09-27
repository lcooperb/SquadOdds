-- Update existing emails to lowercase first
UPDATE "User" SET "email" = LOWER("email");

-- Add name column with default values
ALTER TABLE "User" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'User';

-- Update name from existing data
UPDATE "User" SET "name" = COALESCE("displayName", "username", 'User');

-- Add appleCashEmail column
ALTER TABLE "User" ADD COLUMN "appleCashEmail" TEXT;

-- Update appleCashEmail from venmoHandle if exists
UPDATE "User" SET "appleCashEmail" = "venmoHandle" WHERE "venmoHandle" IS NOT NULL;

-- Drop old columns
ALTER TABLE "User" DROP COLUMN "username",
DROP COLUMN "displayName",
DROP COLUMN "venmoHandle";

-- Handle Redemption table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'redemptions') THEN
        -- Add appleCashEmail column to redemptions
        ALTER TABLE "redemptions" ADD COLUMN "appleCashEmail" TEXT NOT NULL DEFAULT '';

        -- Update from venmoHandle if exists
        UPDATE "redemptions" SET "appleCashEmail" = COALESCE("venmoHandle", '') WHERE "venmoHandle" IS NOT NULL;

        -- Drop old column
        ALTER TABLE "redemptions" DROP COLUMN "venmoHandle";
    END IF;
END $$;