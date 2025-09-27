import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addBalance() {
  const emailArg = process.argv[2]
  const amountArg = process.argv[3]
  const targetEmail = emailArg || process.env.TARGET_EMAIL || 'lcooperband@gmail.com'
  const targetAmount = amountArg ? Number(amountArg) : Number(process.env.TARGET_AMOUNT ?? 50000)

  if (!targetAmount || Number.isNaN(targetAmount)) {
    console.error('Invalid amount. Usage: npx tsx scripts/add-balance.ts <email> <amount>')
    process.exit(1)
  }

  try {
    const user = await prisma.user.update({
      where: { email: targetEmail },
      data: { virtualBalance: targetAmount }
    })

    console.log('Updated user balance:', user.email, 'now has $' + user.virtualBalance)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addBalance()