import { JWT } from "next-auth/jwt";
import { NextAuthOptions } from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "login-with-id",
            name: "id",
            credentials: {
                id: {
                    label: "id",
                    type: "text",
                },
            },
            async authorize(credentials, req) {
                if (!credentials?.id) {
                    return null;
                }
                return {
                    id: credentials?.id,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }): Promise<any> {
            if (user && trigger === "signIn") {
                return { ...token, user };
            }
            return token;
        },
        async session({ token, session }) {
            session.user.id = token.user.id;
            return session;
        },
    },
    secret: process.env.NEXT_PUBLIC_NEXTAUTH_SECRET as string,
}; 
