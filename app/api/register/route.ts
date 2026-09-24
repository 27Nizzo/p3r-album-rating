import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";

// Inicializar o Resend com a chave de API
const resend = new Resend(process.env.RESEND_API_KEY);

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

    // 4. Criar utilizador
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    // 5. Gerar Token de Verificação
    const token = crypto.randomUUID();
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 horas
      },
    });

    // 6. Construir o link de confirmação
    const verificationLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/verify-email?token=${token}`;

    // 7. Enviar o email real através do Resend
    try {
      await resend.emails.send({
        from: 'Velvet System <onboarding@resend.dev>', // Em produção podes usar o teu próprio domínio verificado
        to: email,
        subject: 'Confirmação de Registo - Velvet',
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #00e5ff; text-transform: uppercase; font-style: italic;">Bem-vindo ao Velvet System, ${name}!</h2>
            <p style="color: #cbd5e1; font-size: 14px;">Estás quase pronto para começar a gerir e avaliar os teus álbuns favoritos.</p>
            <p style="color: #cbd5e1; font-size: 14px;">Clica no botão abaixo para verificar o teu email e ativar a tua conta:</p>
            <a href="${verificationLink}" style="display: inline-block; background-color: #00e5ff; color: #0b0f19; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; margin-top: 15px; text-transform: uppercase;">Verificar Conta</a>
            <p style="color: #64748b; font-size: 11px; margin-top: 30px;">Se não pediste este registo, podes ignorar este email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Erro ao enviar email pelo Resend:", emailError);
      // Mesmo se falhar o email, o user foi criado, mas podes tratar o erro se preferires
    }

    return NextResponse.json({ 
      message: "Conta criada com sucesso! Verifica a tua caixa de correio." 
    }, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar conta:", error);
    return NextResponse.json({ error: "Erro ao criar conta." }, { status: 500 });
  }
}