import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ albums: [] });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Credenciais do Spotify não encontradas no .env.local' },
      { status: 500 }
    );
  }

  try {
    // 1. Obter Token do Spotify
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenResponse.json();

    // 2. Pesquisar Álbuns
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const searchData = await searchResponse.json();

    const albums = searchData.albums?.items.map((album: any) => ({
      id: album.id,
      title: album.name,
      artist: album.artists.map((a: any) => a.name).join(', '),
      coverUrl: album.images[0]?.url || '',
      releaseYear: album.release_date ? album.release_date.split('-')[0] : 'N/A',
    })) || [];

    return NextResponse.json({ albums });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao comunicar com o Spotify' }, { status: 500 });
  }
}