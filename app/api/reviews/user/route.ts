import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/authOptions';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const reviews = await prisma.review.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      include: {
        _count: {
          select: { likes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mapeia o resultado para disponibilizar diretamente a propriedade likesCount
    const formattedReviews = reviews.map((rev) => ({
      ...rev,
      likesCount: rev._count.likes,
    }));

    return NextResponse.json({ reviews: formattedReviews });
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