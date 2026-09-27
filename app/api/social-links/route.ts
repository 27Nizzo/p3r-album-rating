import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ARCANAS = [
  "THE FOOL",
  "THE MAGICIAN",
  "THE PRIESTESS",
  "THE EMPRESS",
  "THE EMPEROR",
  "THE HIEROPHANT",
  "THE LOVERS",
  "THE CHARIOT",
  "JUSTICE",
  "THE HERMIT",
  "WHEEL OF FORTUNE",
  "STRENGTH",
  "THE HANGED MAN",
  "DEATH",
  "TEMPERANCE",
  "THE DEVIL",
  "THE TOWER",
  "THE STAR",
  "THE MOON",
  "THE SUN",
  "JUDGEMENT",
  "THE WORLD",
];

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ socialLinks: [] });
    }

    const userId = session.user.id;

    // 1. Procura conexões aceites (ACCEPTED) onde o utilizador é o SENDER ou o RECEIVER
    const connections = await prisma.userConnection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true },
        },
        receiver: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // 2. Mapeia para obter os dados do outro utilizador (Target) e o RANK correto
    const socialLinks = connections.map((conn, index) => {
      // Se eu sou o sender, o outro utilizador é o receiver (e vice-versa)
      const targetUser = conn.senderId === userId ? conn.receiver : conn.sender;

      return {
        id: targetUser.id,
        name: targetUser.name || "Operative",
        image: targetUser.image,
        arcana: ARCANAS[index % ARCANAS.length],
        rank: conn.rank ?? 1, // Obtém o Rank real guardado na tabela (ex: 3)
      };
    });

    return NextResponse.json({ socialLinks });
  } catch (error) {
    console.error("Erro ao carregar social links:", error);
    return NextResponse.json({ socialLinks: [] }, { status: 500 });
  }
}