import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@friendbets.com' },
    update: {},
    create: {
      email: 'admin@friendbets.com',
      username: 'admin',
      displayName: 'Admin User',
      hashedPassword,
      isAdmin: true,
      virtualBalance: 1000, // Give admin more money for testing
    },
  })

  // Create some test users
  const testUsers = [
    {
      email: 'alice@example.com',
      username: 'alice',
      displayName: 'Alice Johnson',
      hashedPassword: await bcrypt.hash('password123', 12),
    },
    {
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob Smith',
      hashedPassword: await bcrypt.hash('password123', 12),
    },
    {
      email: 'charlie@example.com',
      username: 'charlie',
      displayName: 'Charlie Brown',
      hashedPassword: await bcrypt.hash('password123', 12),
    },
  ]

  const users = []
  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    })
    users.push(user)
  }

  // Create some sample events
  const sampleEvents = [
    {
      title: 'Will Alice get promoted this year?',
      description: 'Alice has been working really hard and her annual review is coming up. Will she get that promotion she\'s been hoping for?',
      category: 'Career',
      createdById: admin.id,
      endDate: new Date('2024-12-31'),
      yesPrice: 65,
    },
    {
      title: 'Will Bob finish his marathon training?',
      description: 'Bob signed up for a marathon and has been training for 3 months. Will he actually complete the training program?',
      category: 'Personal',
      createdById: admin.id,
      endDate: new Date('2024-06-30'),
      yesPrice: 45,
    },
    {
      title: 'Will Charlie ask out his crush?',
      description: 'Charlie has been talking about asking out his coworker for months. Will he finally work up the courage?',
      category: 'Relationships',
      createdById: admin.id,
      endDate: new Date('2024-03-31'),
      yesPrice: 30,
    },
    {
      title: 'Will our group take a vacation together this summer?',
      description: 'We\'ve been talking about planning a group trip. Will we actually book something and all go together?',
      category: 'Life Events',
      createdById: users[0].id,
      endDate: new Date('2024-08-31'),
      yesPrice: 55,
    },
  ]

  for (const eventData of sampleEvents) {
    await prisma.event.create({
      data: eventData,
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })