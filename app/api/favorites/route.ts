import { NextResponse } from 'next/server';
import { auth } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

// GET: Procurar todos os favoritos do utilizador autenticado
export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ favorites }, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao procurar favoritos:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST: Adicionar um álbum aos favoritos
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const { albumId, albumTitle, artistName, coverUrl, releaseYear } = body;

    if (!albumId || !albumTitle || !artistName) {
      return NextResponse.json({ error: 'Dados do álbum incompletos' }, { status: 400 });
    }

    // Criar o favorito
    const favorite = await prisma.favorite.create({
      data: {
        albumId,
        albumTitle,
        artistName,
        coverUrl: coverUrl || '',
        releaseYear: releaseYear || '...',
        userId: user.id,
      },
    });

    // --- LÓGICA DE AFINIDADE DE CONFIDANTS (Gostos em Comum) ---
    try {
      const confidantConnections = await prisma.userConnection.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [{ senderId: user.id }, { receiverId: user.id }],
        },
      });

      for (const conn of confidantConnections) {
        const otherUserId = conn.senderId === user.id ? conn.receiverId : conn.senderId;

        const hasSameAlbum = await prisma.favorite.findFirst({
          where: { userId: otherUserId, albumId: albumId },
        });

        if (hasSameAlbum) {
          const { addAffinityPoints } = await import('@/lib/confidantRanks');
          const { newRank, newAffinity, rankedUp } = addAffinityPoints(
            conn.rank,
            conn.affinity,
            1 // +1 ponto por álbum em comum
          );

          await prisma.userConnection.update({
            where: { id: conn.id },
            data: { rank: newRank, affinity: newAffinity },
          });

          if (rankedUp) {
            await prisma.notification.create({
              data: {
                userId: otherUserId,
                title: `RANK UP! (RANK ${newRank})`,
                message: `A tua ligação com ${user.name || 'o teu Confidant'} subiu para RANK ${newRank}!`,
                type: 'CONFIDANT_RANK_UP',
              },
            });
          }
        }
      }
    } catch (err) {
      console.error('Erro ao calcular afinidade por álbum em comum:', err);
    }

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Já está nos favoritos' }, { status: 200 });
    }
    console.error('Erro ao adicionar favorito:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE: Remover um álbum dos favoritos pelo albumId
export async function DELETE(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const albumId = searchParams.get('albumId');

    if (!albumId) {
      return NextResponse.json({ error: 'ID do álbum em falta' }, { status: 400 });
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: user.id,
        albumId: albumId,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao remover favorito:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}