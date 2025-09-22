import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      username: string
      displayName: string
      image?: string | null
      isAdmin: boolean
    }
  }

  interface User {
    id: string
    email: string
    username: string
    displayName: string
    image?: string | null
    isAdmin: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username: string
    displayName: string
    isAdmin: boolean
  }
}