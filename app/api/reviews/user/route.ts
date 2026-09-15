import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/authOptions';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Busca as reviews associadas ao utilizador pelo email da sessão
    const reviews = await prisma.review.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('❌ Erro ao buscar reviews do utilizador:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID da crítica ausente' }, { status: 400 });
    }

    // Apaga garantindo que a review pertence ao utilizador autenticado
    await prisma.review.deleteMany({
      where: {
        id,
        user: {
          email: session.user.email,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao apagar review:', error);
    return NextResponse.json({ error: 'Erro ao apagar' }, { status: 500 });
  }
}