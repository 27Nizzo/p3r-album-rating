import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/authOptions';

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { name, image } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'O nome não pode estar vazio.' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name.trim(),
        image: image ? image.trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        name: updatedUser.name,
        image: updatedUser.image,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error);
    return NextResponse.json({ error: 'Erro ao atualizar o perfil' }, { status: 500 });
  }
}