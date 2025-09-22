import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 12)

  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      username: 'alice',
      displayName: 'Alice Johnson',
      hashedPassword,
      virtualBalance: 100.00,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob Smith',
      hashedPassword,
      virtualBalance: 100.00,
    },
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      email: 'charlie@example.com',
      username: 'charlie',
      displayName: 'Charlie Brown',
      hashedPassword,
      virtualBalance: 100.00,
    },
  })

  // Create sample events
  const event1 = await prisma.event.create({
    data: {
      title: 'Will Alice get the promotion by end of Q1?',
      description: 'Alice has been working really hard and her manager hinted at a promotion coming up. The quarterly review is in March.',
      category: 'Career',
      endDate: new Date('2024-03-31'),
      isOngoing: false,
      createdById: user2.id,
      yesPrice: 60.0,
      totalVolume: 45.0,
    },
  })

  const event2 = await prisma.event.create({
    data: {
      title: 'Will Bob finally ask Sarah out?',
      description: 'Bob has been talking about asking Sarah out for months. Will he finally work up the courage?',
      category: 'Relationships',
      endDate: null,
      isOngoing: true,
      createdById: user1.id,
      yesPrice: 35.0,
      totalVolume: 30.0,
    },
  })

  const event3 = await prisma.event.create({
    data: {
      title: 'Will Charlie move to New York this year?',
      description: 'Charlie has been considering a job offer in NYC. He needs to decide by the end of the year.',
      category: 'Life Events',
      endDate: new Date('2024-12-31'),
      isOngoing: false,
      createdById: user3.id,
      yesPrice: 75.0,
      totalVolume: 80.0,
    },
  })

  const event4 = await prisma.event.create({
    data: {
      title: 'Will our team win the office fantasy football league?',
      description: 'We are currently in 2nd place with 3 games left in the season.',
      category: 'Sports',
      endDate: new Date('2024-01-15'),
      isOngoing: false,
      createdById: user1.id,
      yesPrice: 45.0,
      totalVolume: 60.0,
    },
  })

  // Create sample bets
  await prisma.bet.create({
    data: {
      userId: user1.id,
      eventId: event1.id,
      side: 'YES',
      amount: 25.0,
      price: 55.0,
      shares: 45.45,
    },
  })

  await prisma.bet.create({
    data: {
      userId: user3.id,
      eventId: event1.id,
      side: 'NO',
      amount: 20.0,
      price: 45.0,
      shares: 44.44,
    },
  })

  await prisma.bet.create({
    data: {
      userId: user2.id,
      eventId: event2.id,
      side: 'YES',
      amount: 15.0,
      price: 30.0,
      shares: 50.0,
    },
  })

  await prisma.bet.create({
    data: {
      userId: user1.id,
      eventId: event2.id,
      side: 'NO',
      amount: 15.0,
      price: 70.0,
      shares: 21.43,
    },
  })

  await prisma.bet.create({
    data: {
      userId: user2.id,
      eventId: event3.id,
      side: 'YES',
      amount: 40.0,
      price: 70.0,
      shares: 57.14,
    },
  })

  await prisma.bet.create({
    data: {
      userId: user3.id,
      eventId: event3.id,
      side: 'YES',
      amount: 40.0,
      price: 80.0,
      shares: 50.0,
    },
  })

  // Create sample price history
  await prisma.pricePoint.createMany({
    data: [
      {
        eventId: event1.id,
        yesPrice: 50.0,
        noPrice: 50.0,
        volume: 0.0,
        timestamp: new Date('2024-01-01'),
      },
      {
        eventId: event1.id,
        yesPrice: 55.0,
        noPrice: 45.0,
        volume: 25.0,
        timestamp: new Date('2024-01-02'),
      },
      {
        eventId: event1.id,
        yesPrice: 60.0,
        noPrice: 40.0,
        volume: 45.0,
        timestamp: new Date('2024-01-03'),
      },
    ],
  })

  console.log('Database seeded successfully!')
  console.log('Sample users created:')
  console.log('- alice@example.com / password123')
  console.log('- bob@example.com / password123')
  console.log('- charlie@example.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })