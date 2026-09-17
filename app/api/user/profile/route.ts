import { NextResponse } from 'next/server';
import { auth } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, image } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome inválido' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name.trim(),
        image: image && image.trim() !== '' ? image.trim() : null,
      },
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error: any) {
    console.error('Erro na rota /api/user/profile:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor ao atualizar perfil' },
      { status: 500 }
    );
  }
}