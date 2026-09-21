import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Obter todas as reviews com a informação do utilizador
    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // 2. Obter todos os favoritos (Velvet Compendium)
    const favorites = await prisma.favorite.findMany();

    // --- AGREGAR ESTATÍSTICAS POR ÁLBUM ---
    const albumMap: Record<
      string,
      {
        albumId: string;
        albumTitle: string;
        artistName: string;
        coverUrl: string;
        releaseYear: string;
        ratings: number[];
        reviewsCount: number;
        compendiumCount: number;
      }
    > = {};

    // Mapear Reviews por Álbum
    for (const rev of reviews) {
      if (!rev.albumId || rev.albumId === 'default') continue;

      if (!albumMap[rev.albumId]) {
        albumMap[rev.albumId] = {
          albumId: rev.albumId,
          albumTitle: rev.albumTitle,
          artistName: rev.artistName,
          coverUrl: rev.coverUrl || '',
          releaseYear: rev.releaseYear || 'N/A',
          ratings: [],
          reviewsCount: 0,
          compendiumCount: 0,
        };
      }

      albumMap[rev.albumId].ratings.push(rev.rating);
      albumMap[rev.albumId].reviewsCount += 1;
    }

    // Mapear Favoritos por Álbum
    for (const fav of favorites) {
      if (!fav.albumId || fav.albumId === 'default') continue;

      if (!albumMap[fav.albumId]) {
        albumMap[fav.albumId] = {
          albumId: fav.albumId,
          albumTitle: fav.albumTitle,
          artistName: fav.artistName,
          coverUrl: fav.coverUrl || '',
          releaseYear: fav.releaseYear || 'N/A',
          ratings: [],
          reviewsCount: 0,
          compendiumCount: 0,
        };
      }

      albumMap[fav.albumId].compendiumCount += 1;
    }

    // Converter Map em Array com Média Calculada
    const albumList = Object.values(albumMap).map((album) => {
      const sum = album.ratings.reduce((acc, curr) => acc + curr, 0);
      const avg = album.ratings.length > 0 ? parseFloat((sum / album.ratings.length).toFixed(1)) : 0;
      return {
        ...album,
        averageRating: avg,
      };
    });

    // Ranking 1: Álbuns Mais Bem Avaliados (Top Rated)
    const topRated = [...albumList]
      .filter((a) => a.reviewsCount > 0)
      .sort((a, b) => b.averageRating - a.averageRating || b.reviewsCount - a.reviewsCount)
      .slice(0, 10);

    // Ranking 2: Álbuns Mais Avaliados (Most Reviewed)
    const mostReviewed = [...albumList]
      .filter((a) => a.reviewsCount > 0)
      .sort((a, b) => b.reviewsCount - a.reviewsCount || b.averageRating - a.averageRating)
      .slice(0, 10);

    // Ranking 3: Álbuns Mais Guardados no Compendium
    const mostSaved = [...albumList]
      .filter((a) => a.compendiumCount > 0)
      .sort((a, b) => b.compendiumCount - a.compendiumCount)
      .slice(0, 10);

    // --- AGREGAR OPERATIVOS MAIS ATIVOS ---
    const userMap: Record<
      string,
      {
        id: string;
        name: string | null;
        image: string | null;
        reviewsCount: number;
      }
    > = {};

    for (const rev of reviews) {
      if (!rev.userId || !rev.user) continue;

      if (!userMap[rev.userId]) {
        userMap[rev.userId] = {
          id: rev.user.id,
          name: rev.user.name,
          image: rev.user.image,
          reviewsCount: 0,
        };
      }

      userMap[rev.userId].reviewsCount += 1;
    }

    const topOperatives = Object.values(userMap)
      .sort((a, b) => b.reviewsCount - a.reviewsCount)
      .slice(0, 10);

    return NextResponse.json(
      {
        topRated,
        mostReviewed,
        mostSaved,
        topOperatives,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao gerar rankings:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}