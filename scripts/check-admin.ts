import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAdmin() {
  const emailArg = process.argv[2]
  const emailEnv = process.env.ADMIN_EMAIL
  const targetEmail = emailArg || emailEnv || 'lcooperband@gmail.com'

  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: {
        email: true,
        isAdmin: true,
        displayName: true
      }
    })

    console.log('User status:', user)

    // Check for multiple choice markets
    const multipleChoiceMarkets = await prisma.event.findMany({
      where: {
        marketType: 'MULTIPLE'
      },
      include: {
        options: true,
        bets: true,
        _count: {
          select: {
            bets: true
          }
        }
      }
    })

    console.log('\nMultiple choice markets:')
    multipleChoiceMarkets.forEach(market => {
      console.log(`- ${market.title} (${market.options?.length || 0} options, ${market._count.bets} bets)`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()