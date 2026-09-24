import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Apanhar o token do URL (ex: /api/verify-email?token=12345)
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido." }, { status: 400 });
    }

    // 1. Procurar o token na base de dados
    const existingToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!existingToken) {
      return NextResponse.json({ error: "Token inválido ou inexistente." }, { status: 400 });
    }

    // 2. Verificar se o token expirou
    const hasExpired = new Date(existingToken.expires) < new Date();
    if (hasExpired) {
      return NextResponse.json({ error: "O token expirou. Pede um novo link." }, { status: 400 });
    }

    // 3. Atualizar o utilizador para "Verificado"
    const user = await prisma.user.findUnique({
      where: { email: existingToken.identifier },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // 4. Apagar o token (já foi usado, não queremos que seja usado duas vezes)
    await prisma.verificationToken.delete({
      where: { token },
    });

    // Redireciona o utilizador de volta para a homepage com uma mensagem de sucesso
    return NextResponse.redirect(new URL("/?verified=true", request.url));

  } catch (error) {
    console.error("Erro na verificação do email:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}