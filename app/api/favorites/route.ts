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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const { albumId, albumTitle, artistName, coverUrl, releaseYear } = body;

    if (!albumId || !albumTitle || !artistName) {
      return NextResponse.json({ error: 'Dados do álbum incompletos' }, { status: 400 });
    }

    // Criar o favorito (evita duplicados graças ao @@unique([userId, albumId]))
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

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error: any) {
    // Se o favorito já existir (erro de constraint única)
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