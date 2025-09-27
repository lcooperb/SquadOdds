import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Your exported local data
const localData = {
  "users": [
    {
      "id": "cmfyje3910000wbzu7oarc6rt",
      "email": "alice@example.com",
      "emailVerified": null,
      "username": "alice",
      "name": "Alice Johnson",
      "image": null,
      "hashedPassword": "$2b$12$9xZlPqh4KxhzWV7.8eKf6uEW8jQ8l6OlS4qO5pEeXdD6OzP1w6eJ.",
      "venmoHandle": null,
      "virtualBalance": "100",
      "totalWinnings": "0",
      "totalLosses": "0",
      "isAdmin": true,
      "createdAt": "2025-09-24T22:09:25.251Z",
      "updatedAt": "2025-09-24T22:09:25.251Z"
    },
    {
      "id": "cmfyje39c0001wbzu0mnnc180",
      "email": "bob@example.com",
      "emailVerified": null,
      "username": "bob",
      "name": "Bob Smith",
      "image": null,
      "hashedPassword": "$2b$12$9xZlPqh4KxhzWV7.8eKf6uEW8jQ8l6OlS4qO5pEeXdD6OzP1w6eJ.",
      "venmoHandle": null,
      "virtualBalance": "100",
      "totalWinnings": "0",
      "totalLosses": "0",
      "isAdmin": false,
      "createdAt": "2025-09-24T22:09:25.252Z",
      "updatedAt": "2025-09-24T22:09:25.252Z"
    },
    {
      "id": "cmfyje39d0002wbzuylo6so8z",
      "email": "charlie@example.com",
      "emailVerified": null,
      "username": "charlie",
      "name": "Charlie Brown",
      "image": null,
      "hashedPassword": "$2b$12$9xZlPqh4KxhzWV7.8eKf6uEW8jQ8l6OlS4qO5pEeXdD6OzP1w6eJ.",
      "venmoHandle": null,
      "virtualBalance": "100",
      "totalWinnings": "0",
      "totalLosses": "0",
      "isAdmin": false,
      "createdAt": "2025-09-24T22:09:25.253Z",
      "updatedAt": "2025-09-24T22:09:25.253Z"
    }
  ],
  "events": [
    {
      "id": "cmfyje39i0005wbzuz4pxe3z8",
      "title": "Will Alice get the promotion by end of Q1?",
      "description": "Alice has been working really hard and her manager hinted at a promotion coming up. The quarterly review is in March.",
      "category": "Career",
      "createdById": "cmfyje39c0001wbzu0mnnc180",
      "status": "ACTIVE",
      "resolutionDate": null,
      "endDate": "2024-03-31T00:00:00.000Z",
      "isOngoing": false,
      "marketType": "BINARY",
      "yesPrice": "60",
      "totalVolume": "45",
      "resolved": false,
      "outcome": null,
      "winningOptionId": null,
      "createdAt": "2025-09-24T22:09:25.254Z",
      "updatedAt": "2025-09-24T22:09:25.254Z"
    },
    {
      "id": "cmfyje39j0007wbzu1us3ysgr",
      "title": "Will Bob finally ask Sarah out?",
      "description": "Bob has been talking about asking Sarah out for months. Will he finally work up the courage?",
      "category": "Relationships",
      "createdById": "cmfyje3910000wbzu7oarc6rt",
      "status": "ACTIVE",
      "resolutionDate": null,
      "endDate": null,
      "isOngoing": true,
      "marketType": "BINARY",
      "yesPrice": "35",
      "totalVolume": "30",
      "resolved": false,
      "outcome": null,
      "winningOptionId": null,
      "createdAt": "2025-09-24T22:09:25.256Z",
      "updatedAt": "2025-09-24T22:09:25.256Z"
    },
    {
      "id": "cmfyje39k0009wbzuvijmtqyv",
      "title": "Will Charlie move to New York this year?",
      "description": "Charlie has been considering a job offer in NYC. He needs to decide by the end of the year.",
      "category": "Life Events",
      "createdById": "cmfyje39d0002wbzuylo6so8z",
      "status": "ACTIVE",
      "resolutionDate": null,
      "endDate": "2024-12-31T00:00:00.000Z",
      "isOngoing": false,
      "marketType": "BINARY",
      "yesPrice": "75",
      "totalVolume": "80",
      "resolved": false,
      "outcome": null,
      "winningOptionId": null,
      "createdAt": "2025-09-24T22:09:25.256Z",
      "updatedAt": "2025-09-24T22:09:25.256Z"
    },
    {
      "id": "cmfyje39k000bwbzu6dwp95fh",
      "title": "Will our team win the office fantasy football league?",
      "description": "We are currently in 2nd place with 3 games left in the season.",
      "category": "Sports",
      "createdById": "cmfyje3910000wbzu7oarc6rt",
      "status": "ACTIVE",
      "resolutionDate": null,
      "endDate": "2024-01-15T00:00:00.000Z",
      "isOngoing": false,
      "marketType": "BINARY",
      "yesPrice": "45",
      "totalVolume": "60",
      "resolved": false,
      "outcome": null,
      "winningOptionId": null,
      "createdAt": "2025-09-24T22:09:25.257Z",
      "updatedAt": "2025-09-24T22:09:25.257Z"
    },
    {
      "id": "cmfyje39l000dwbzuqlf7qc95",
      "title": "Which team will win the 2024 World Series?",
      "description": "Pick which MLB team you think will win the 2024 World Series championship.",
      "category": "Sports",
      "createdById": "cmfyje3910000wbzu7oarc6rt",
      "status": "ACTIVE",
      "resolutionDate": null,
      "endDate": "2024-11-01T00:00:00.000Z",
      "isOngoing": false,
      "marketType": "MULTIPLE",
      "yesPrice": "0",
      "totalVolume": "150",
      "resolved": false,
      "outcome": null,
      "winningOptionId": null,
      "createdAt": "2025-09-24T22:09:25.258Z",
      "updatedAt": "2025-09-24T22:09:25.258Z"
    }
  ]
}

export async function POST() {
  try {
    console.log('🔄 Starting data migration to Supabase...')

    // Clear existing data
    await prisma.bet.deleteMany()
    await prisma.optionPricePoint.deleteMany()
    await prisma.pricePoint.deleteMany()
    await prisma.marketOption.deleteMany()
    await prisma.event.deleteMany()
    await prisma.user.deleteMany()

    // Import users
    for (const user of localData.users) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          hashedPassword: user.hashedPassword,
          virtualBalance: user.virtualBalance,
          totalWinnings: user.totalWinnings,
          totalLosses: user.totalLosses,
          isAdmin: user.isAdmin,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      })
    }

    // Import events
    for (const event of localData.events) {
      await prisma.event.create({
        data: {
          id: event.id,
          title: event.title,
          description: event.description,
          category: event.category,
          createdById: event.createdById,
          status: event.status,
          endDate: event.endDate ? new Date(event.endDate) : null,
          isOngoing: event.isOngoing,
          marketType: event.marketType,
          yesPrice: event.yesPrice,
          totalVolume: event.totalVolume,
          resolved: event.resolved,
          outcome: event.outcome,
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt)
        }
      })
    }

    // Add market options for the multiple choice event
    if (localData.events.find(e => e.marketType === 'MULTIPLE')) {
      const multipleEvent = localData.events.find(e => e.marketType === 'MULTIPLE')
      if (multipleEvent) {
        const options = [
          { id: "cmfyje39n000fwbzun54usfr5", title: "Los Angeles Dodgers", price: "35", totalVolume: "50" },
          { id: "cmfyje39p000hwbzuwkonlndc", title: "New York Yankees", price: "28", totalVolume: "40" },
          { id: "cmfyje39q000jwbzuxz42h5e9", title: "Houston Astros", price: "22", totalVolume: "35" },
          { id: "cmfyje39q000lwbzu344uq6aq", title: "Other Team", price: "15", totalVolume: "25" }
        ]

        for (const option of options) {
          await prisma.marketOption.create({
            data: {
              id: option.id,
              eventId: multipleEvent.id,
              title: option.title,
              price: option.price,
              totalVolume: option.totalVolume,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      imported: {
        users: localData.users.length,
        events: localData.events.length,
        options: 4
      }
    })

  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}