import { NextResponse } from "next/server";

async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Credenciais do Spotify não configuradas.");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const data = await response.json();
  return data.access_token;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ albums: [] });
    }

    const token = await getSpotifyAccessToken();

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=8`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ albums: [] });
    }

    const data = await response.json();

    const albums = (data.albums?.items || []).map((album: any) => ({
      id: album.id,
      title: album.name,
      artist: album.artists[0]?.name || "Artista Desconhecido",
      artistId: album.artists[0]?.id || null, // 👈 Devolve o ID real do artista
      coverUrl: album.images[0]?.url || "",
      releaseYear: album.release_date ? album.release_date.split("-")[0] : "N/A",
    }));

    return NextResponse.json({ albums });
  } catch (error) {
    console.error("Erro na pesquisa do Spotify:", error);
    return NextResponse.json({ error: "Erro na pesquisa" }, { status: 500 });
  }
}