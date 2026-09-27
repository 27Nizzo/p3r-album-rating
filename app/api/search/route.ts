import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json({ albums: [], users: [] });
  }

  try {
    // 1. Pesquisa de Utilizadores no Prisma (Case-insensitive)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
      take: 4,
    });

    // 2. Pesquisa de Álbuns na tua API do Spotify existente
    // (Ajusta o URL interno para corresponder à tua rota da Spotify Search)
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const spotifyRes = await fetch(
      `${baseUrl}/api/spotify/search?q=${encodeURIComponent(q)}`
    );

    let albums = [];
    if (spotifyRes.ok) {
      const spotifyData = await spotifyRes.json();
      albums = (spotifyData.albums || []).slice(0, 5);
    }

    return NextResponse.json({ albums, users });
  } catch (error) {
    console.error("Erro na pesquisa global:", error);
    return NextResponse.json({ albums: [], users: [] }, { status: 500 });
  }
}