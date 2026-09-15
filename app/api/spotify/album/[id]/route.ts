import { NextResponse } from 'next/server';

// Lista de MP3s de demonstração para fallback caso o Spotify bloqueie temporariamente
const MOCK_AUDIO_FALLBACKS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
];

// Função auxiliar para extrair o preview MP3 oficial a partir da página pública de Embed do Spotify
async function getSpotifyEmbedPreview(trackId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://open.spotify.com/embed/track/${trackId}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      next: { revalidate: 86400 }, // Guarda em cache por 24h para ser super rápido
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Tenta extrair a URL do MP3 real do script interno da página
    const match1 = html.match(/"audioPreview":\s*\{\s*"url":\s*"([^"]+)"/);
    if (match1 && match1[1]) return match1[1];

    // Fallback de padrão alternativo no CDN do Spotify
    const match2 = html.match(/https:\/\/p\.scdn\.co\/mp3-preview\/[a-f0-9]+/g);
    if (match2 && match2[0]) return match2[0];
  } catch (err) {
    console.error(`Erro ao obter preview para a faixa ${trackId}:`, err);
  }
  return null;
}

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

    // 1. Obter Token de Acesso da API do Spotify
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

    // 2. Obter Informações e Faixas do Álbum
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
    const rawTracks = albumData.tracks?.items || [];

    // 3. Obter os ficheiros MP3 oficiais através da página Embed em paralelo
    const tracks = await Promise.all(
      rawTracks.map(async (track: any, index: number) => {
        let previewUrl = track.preview_url;

        // Se a API REST não trouxer preview_url (nulo por padrão), busca no Embed
        if (!previewUrl) {
          previewUrl = await getSpotifyEmbedPreview(track.id);
        }

        // Se falhar o scraper, usa o fallback de demonstração para garantir o funcionamento do Player
        if (!previewUrl) {
          previewUrl = MOCK_AUDIO_FALLBACKS[index % MOCK_AUDIO_FALLBACKS.length];
        }

        return {
          id: track.id,
          trackNumber: track.track_number,
          discNumber: track.disc_number || 1,
          name: track.name,
          durationMs: track.duration_ms,
          previewUrl: previewUrl,
        };
      })
    );

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('❌ Erro no Servidor:', error);
    return NextResponse.json({ tracks: [], error: 'Erro interno' }, { status: 500 });
  }
}