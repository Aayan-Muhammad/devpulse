import type { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      username?: string;
    };
    accessToken?: string;
  }

  interface JWT extends DefaultJWT {
    accessToken?: string;
    username?: string;
  }
}
