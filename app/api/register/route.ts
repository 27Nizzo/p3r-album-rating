import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Preenche todos os campos." }, { status: 400 });
    }

    // 1. Validação de Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Formato de email inválido." }, { status: 400 });
    }

    // 2. Validação da Password Forte (8+ caracteres, 1 maiúscula, 1 número)
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json({ 
        error: "A palavra-passe deve ter no mínimo 8 caracteres, uma letra maiúscula e um número." 
      }, { status: 400 });
    }

    // 3. Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Este email já está registado." }, { status: 400 });
    }

    // 4. Criar utilizador já verificado e pronto a usar
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashedPassword,
        emailVerified: new Date(), // Conta ativada imediatamente
      },
    });

    return NextResponse.json({ 
      message: "Conta criada com sucesso!", 
      userId: user.id 
    }, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar conta:", error);
    return NextResponse.json({ error: "Erro ao criar conta." }, { status: 500 });
  }
}