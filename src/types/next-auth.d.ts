import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string | null
      isAdmin: boolean
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string | null
    isAdmin: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    name: string
    isAdmin: boolean
  }
}