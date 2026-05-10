import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

/**
 * Función para refrescar el token de acceso de Google usando el refresh_token
 */
async function refreshAccessToken(token: any) {
  try {
    const url = "https://oauth2.googleapis.com/token"
    const response = await fetch(url, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
      method: "POST",
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
      // Si Google envía un nuevo refresh_token, lo usamos; si no, mantenemos el actual
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    }
  } catch (error) {
    console.error("Error al refrescar el access token:", error)
    return {
      ...token,
      accessToken: undefined,
      error: "RefreshAccessTokenError",
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.readonly",
          prompt: "select_account", // Evita pedir consentimiento cada vez
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  trustHost: true,
  callbacks: {
    async jwt({ token, account, user }) {
      // Inicio de sesión inicial
      if (account && user) {
        return {
          accessToken: account.access_token,
          expiresAt: (account.expires_at ?? 0) * 1000,
          refreshToken: account.refresh_token,
          user,
        }
      }

      // Si el token aún es válido, devolverlo
      if (Date.now() < (token.expiresAt as number)) {
        return token
      }

      // El token ha expirado, intentar refrescarlo
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      // Pasar datos del token a la sesión
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      session.error = token.error as any
      
      if (token.user) {
        session.user = {
          ...session.user,
          ...token.user as any
        }
      }
      
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días de persistencia de sesión
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
})
