import { NextResponse } from 'next/server';
import { auth } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!session || !session.user?.email) {
      return NextResponse.json({ connection: null }, { status: 200 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ connection: null }, { status: 200 });
    }

    // Se houver targetUserId, procura a relação bilateral
    if (targetUserId) {
      const connection = await prisma.userConnection.findFirst({
        where: {
          OR: [
            { senderId: currentUser.id, receiverId: targetUserId },
            { senderId: targetUserId, receiverId: currentUser.id },
          ],
        },
      });

      return NextResponse.json(
        { connection, isSender: connection?.senderId === currentUser.id },
        { status: 200 }
      );
    }

    // Listar todos os Confidants do currentUser (com status ACCEPTED)
    const confidants = await prisma.userConnection.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: currentUser.id }, { receiverId: currentUser.id }],
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ confidants }, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao buscar ligação de Confidant:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const { targetUserId, action } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Utilizador destino em falta' }, { status: 400 });
    }

    if (action === 'REQUEST') {
      const connection = await prisma.userConnection.upsert({
        where: {
          senderId_receiverId: {
            senderId: currentUser.id,
            receiverId: targetUserId,
          },
        },
        update: { status: 'PENDING' },
        create: {
          senderId: currentUser.id,
          receiverId: targetUserId,
          status: 'PENDING',
        },
      });

      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: 'NOVO SOCIAL LINK',
          message: `O operativo ${currentUser.name || 'Desconhecido'} quer criar um Social Link contigo!`,
          type: 'CONFIDANT_REQUEST',
        },
      });

      return NextResponse.json({ connection, message: 'Pedido enviado!' }, { status: 200 });
    }

    if (action === 'ACCEPT') {
      await prisma.userConnection.updateMany({
        where: {
          senderId: targetUserId,
          receiverId: currentUser.id,
          status: 'PENDING',
        },
        data: { status: 'ACCEPTED' },
      });

      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: 'SOCIAL LINK ESTABELECIDO',
          message: `O operativo ${currentUser.name || 'Desconhecido'} aceitou a tua ligação! Rank 1 Confidant alcançado!`,
          type: 'CONFIDANT_ACCEPTED',
        },
      });

      return NextResponse.json({ success: true, message: 'Social Link aceite!' }, { status: 200 });
    }

    if (action === 'REJECT' || action === 'REMOVE') {
      await prisma.userConnection.deleteMany({
        where: {
          OR: [
            { senderId: currentUser.id, receiverId: targetUserId },
            { senderId: targetUserId, receiverId: currentUser.id },
          ],
        },
      });

      return NextResponse.json({ success: true, message: 'Ligação removida.' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro na gestão de Confidants:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}