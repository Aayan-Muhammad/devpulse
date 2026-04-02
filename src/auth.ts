import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID ?? process.env.AUTH_GITHUB_ID,
      clientSecret:
        process.env.GITHUB_CLIENT_SECRET ?? process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: { scope: "read:user repo" },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;

        if (profile && typeof profile === "object" && "login" in profile) {
          token.username = String((profile as { login?: unknown }).login ?? "");
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) {
        session.accessToken = String(token.accessToken);
      }

      if (!session.user) {
        session.user = {} as NonNullable<typeof session.user>;
      }

      if (token.username) {
        session.user.username = String(token.username);
      }

      return session;
    },
  },
});
