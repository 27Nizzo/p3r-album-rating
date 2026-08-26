import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const albumId = resolvedParams.id;

    if (!albumId || albumId === 'default') {
      return NextResponse.json({ tracks: [] });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('❌ Erro: SPOTIFY_CLIENT_ID ou SPOTIFY_CLIENT_SECRET não definidos no .env.local');
      return NextResponse.json({ tracks: [], error: 'Credenciais ausentes' }, { status: 400 });
    }

    // 1. Obter Token do Spotify
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
      cache: 'no-store',
    });

    if (!tokenResponse.ok) {
      console.error('❌ Erro ao autenticar no Spotify');
      return NextResponse.json({ tracks: [] });
    }

    const tokenData = await tokenResponse.json();

    // 2. Obter Faixas do Álbum
    const albumResponse = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      cache: 'no-store',
    });

    if (!albumResponse.ok) {
      console.error(`❌ Erro Spotify API: ${albumResponse.status}`);
      return NextResponse.json({ tracks: [] });
    }

    const albumData = await albumResponse.json();

    // Mapeamento com discNumber incluído
    const tracks = albumData.tracks?.items.map((track: any) => ({
      id: track.id,
      trackNumber: track.track_number,
      discNumber: track.disc_number || 1,
      name: track.name,
      durationMs: track.duration_ms,
      previewUrl: track.preview_url,
    })) || [];

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('❌ Erro no Servidor:', error);
    return NextResponse.json({ tracks: [], error: 'Erro interno' }, { status: 500 });
  }
}