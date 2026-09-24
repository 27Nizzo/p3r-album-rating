import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !(user as any).password) return null;

        // Bloqueia o login se o emailVerified estiver a null
        if (!user.emailVerified) {
          throw new Error("Por favor, verifica o teu email antes de entrar.");
        }

        const isValid = await bcrypt.compare(password, (user as any).password);
        if (!isValid) return null;

        return user;
      },
    }),
  ],
  callbacks: {
    // 1. O callback JWT é o que cria o cookie. Vamos impedir que a imagem vá para lá.
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Remove a imagem do token (cookie) no momento do login
        token.picture = undefined;
      }
      if (trigger === "update") {
        // Se atualizares o perfil, garante que a nova imagem também não vai para o cookie
        token.picture = undefined;
      }
      return token;
    },
    // 2. O callback Session é o que entrega os dados ao frontend. Vamos buscar a imagem à BD.
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        
        // Vai buscar a imagem diretamente à base de dados em vez de a ler do cookie
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { image: true }
          });
          
          if (dbUser) {
            session.user.image = dbUser.image;
          }
        } catch (error) {
          console.error("Erro ao carregar imagem da sessão", error);
        }
      }
      return session;
    },
  },
});