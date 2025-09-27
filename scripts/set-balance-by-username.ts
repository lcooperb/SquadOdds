import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setBalanceByUsername() {
  const usernameArg = process.argv[2]
  const amountArg = process.argv[3]

  if (!usernameArg || !amountArg) {
    console.error('Usage: npx tsx scripts/set-balance-by-username.ts "username" <amount>')
    process.exit(1)
  }

  const targetUsername = usernameArg.replace(/^@/, '')
  const targetAmount = Number(amountArg)

  if (!targetAmount || Number.isNaN(targetAmount)) {
    console.error('Invalid amount. Provide a numeric amount, e.g., 50000')
    process.exit(1)
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true, email: true, displayName: true, username: true }
    })

    if (!user) {
      console.error(`User with username "${targetUsername}" not found`)
      process.exit(1)
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { virtualBalance: targetAmount }
    })

    console.log(`Updated user balance: ${updated.id} (${user.username}) now has $${updated.virtualBalance}`)
  } catch (error) {
    console.error('Error updating balance:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setBalanceByUsername()
