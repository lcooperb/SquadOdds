import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setBalanceByDisplayName() {
  const nameArg = process.argv[2]
  const amountArg = process.argv[3]

  if (!nameArg || !amountArg) {
    console.error('Usage: npx tsx scripts/set-balance-by-display-name.ts "Display Name" <amount>')
    process.exit(1)
  }

  const targetName = nameArg
  const targetAmount = Number(amountArg)

  if (!targetAmount || Number.isNaN(targetAmount)) {
    console.error('Invalid amount. Provide a numeric amount, e.g., 50000')
    process.exit(1)
  }

  try {
    const user = await prisma.user.findFirst({
      where: { displayName: targetName },
      select: { id: true, email: true, displayName: true, virtualBalance: true }
    })

    if (!user) {
      console.error(`User with displayName "${targetName}" not found`)
      process.exit(1)
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { virtualBalance: targetAmount }
    })

    console.log(`Updated user balance: ${updated.displayName} (${updated.email}) now has $${updated.virtualBalance}`)
  } catch (error) {
    console.error('Error updating balance:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setBalanceByDisplayName()
