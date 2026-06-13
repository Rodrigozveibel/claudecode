import {
  PrismaClient,
  RoomStatus,
  GuestSegment,
  ReservationStatus,
  ConversationStatus,
  MessageDirection,
  MessageType,
  QuoteStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(days: number, hour = 14): Date {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clean (order matters for FKs)
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hotel.deleteMany();

  // --- Hotel ---------------------------------------------------------------
  await prisma.hotel.create({
    data: {
      name: "Hotel Paradise",
      phone: "+55 11 99999-9999",
      email: "contato@hotelparadise.com.br",
      address: "Rua das Flores, 123 - São Paulo/SP",
      checkInTime: "14:00",
      checkOutTime: "12:00",
      policies:
        "Cancelamento gratuito até 48h antes do check-in. Crianças até 5 anos não pagam.",
      amenities: ["Wi-Fi gratuito", "Estacionamento", "Piscina", "Academia", "Café da manhã"],
    },
  });

  // --- Rooms ---------------------------------------------------------------
  const roomData: Array<{
    number: string;
    type: string;
    floor: number;
    capacity: number;
    rate: number;
    status: RoomStatus;
    amenities: string[];
    description: string;
  }> = [];

  const types = [
    { type: "Standard", rate: 220, capacity: 2, amenities: ["Ar-condicionado", "TV", "Wi-Fi"] },
    { type: "Luxo", rate: 380, capacity: 3, amenities: ["Ar-condicionado", "TV", "Wi-Fi", "Varanda", "Frigobar"] },
    { type: "Suíte", rate: 620, capacity: 4, amenities: ["Ar-condicionado", "TV", "Wi-Fi", "Hidromassagem", "Sala de estar", "Vista panorâmica"] },
  ];

  let num = 101;
  for (let floor = 1; floor <= 3; floor++) {
    for (let i = 0; i < 5; i++) {
      const t = types[Math.min(floor - 1, types.length - 1)];
      const statuses: RoomStatus[] = [
        RoomStatus.LIVRE,
        RoomStatus.LIVRE,
        RoomStatus.OCUPADO,
        RoomStatus.LIMPEZA,
        RoomStatus.MANUTENCAO,
      ];
      roomData.push({
        number: String(num + i),
        type: t.type,
        floor,
        capacity: t.capacity,
        rate: t.rate,
        status: statuses[i],
        amenities: t.amenities,
        description: `Quarto ${t.type} confortável no ${floor}º andar.`,
      });
    }
    num += 100;
  }

  const rooms = [];
  for (const r of roomData) {
    rooms.push(await prisma.room.create({ data: r }));
  }
  console.log(`   ✓ ${rooms.length} rooms`);

  // --- Guests --------------------------------------------------------------
  const guestSeed = [
    { name: "Maria Silva", phone: "5511988887777", email: "maria@email.com", cpf: "123.456.789-00", segment: GuestSegment.LOYAL, notes: "Hóspede frequente, prefere andares altos." },
    { name: "João Pereira", phone: "5511977776666", email: "joao@email.com", segment: GuestSegment.PAST_GUEST },
    { name: "Ana Costa", phone: "5511966665555", email: "ana@email.com", segment: GuestSegment.LEAD, notes: "Pediu orçamento para lua de mel." },
    { name: "Carlos Souza", phone: "5511955554444", segment: GuestSegment.LEAD },
    { name: "Fernanda Lima", phone: "5511944443333", email: "fe@email.com", segment: GuestSegment.PAST_GUEST },
    { name: "Roberto Alves", phone: "5511933332222", segment: GuestSegment.LOYAL, notes: "Sempre viaja a trabalho." },
    { name: "Juliana Rocha", phone: "5511922221111", email: "ju@email.com", segment: GuestSegment.LEAD },
    { name: "Pedro Martins", phone: "5511911110000", segment: GuestSegment.PAST_GUEST },
  ];
  const guests = [];
  for (const g of guestSeed) {
    guests.push(await prisma.guest.create({ data: g }));
  }
  console.log(`   ✓ ${guests.length} guests`);

  // --- Reservations --------------------------------------------------------
  const reservationSeed = [
    { guest: guests[0], room: rooms[2], checkIn: daysFromNow(-2), checkOut: daysFromNow(1), status: ReservationStatus.CONFIRMADA, guests: 2 },
    { guest: guests[1], room: rooms[7], checkIn: daysFromNow(1), checkOut: daysFromNow(4), status: ReservationStatus.CONFIRMADA, guests: 2 },
    { guest: guests[4], room: rooms[12], checkIn: daysFromNow(3), checkOut: daysFromNow(6), status: ReservationStatus.PENDENTE, guests: 3 },
    { guest: guests[5], room: rooms[1], checkIn: daysFromNow(-10), checkOut: daysFromNow(-7), status: ReservationStatus.FINALIZADA, guests: 1 },
    { guest: guests[7], room: rooms[6], checkIn: daysFromNow(-20), checkOut: daysFromNow(-18), status: ReservationStatus.FINALIZADA, guests: 2 },
    { guest: guests[0], room: rooms[11], checkIn: daysFromNow(-30), checkOut: daysFromNow(-27), status: ReservationStatus.FINALIZADA, guests: 2 },
    { guest: guests[3], room: rooms[3], checkIn: daysFromNow(5), checkOut: daysFromNow(7), status: ReservationStatus.CANCELADA, guests: 2 },
  ];
  const reservations = [];
  for (const r of reservationSeed) {
    const nights = Math.max(
      1,
      Math.round((r.checkOut.getTime() - r.checkIn.getTime()) / 86400000),
    );
    reservations.push(
      await prisma.reservation.create({
        data: {
          guestId: r.guest.id,
          roomId: r.room.id,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          status: r.status,
          guests: r.guests,
          totalAmount: r.room.rate * nights,
        },
      }),
    );
  }
  console.log(`   ✓ ${reservations.length} reservations`);

  // --- Quotes (active leads) ----------------------------------------------
  await prisma.quote.create({
    data: {
      guestId: guests[2].id,
      roomType: "Suíte",
      checkIn: daysFromNow(10),
      checkOut: daysFromNow(13),
      nights: 3,
      price: 620 * 3,
      status: QuoteStatus.ATIVA,
      expiresAt: daysFromNow(2),
    },
  });
  await prisma.quote.create({
    data: {
      guestId: guests[6].id,
      roomType: "Luxo",
      checkIn: daysFromNow(8),
      checkOut: daysFromNow(10),
      nights: 2,
      price: 380 * 2,
      status: QuoteStatus.ATIVA,
      expiresAt: daysFromNow(2),
    },
  });
  console.log("   ✓ 2 active quotes");

  // --- Conversations + Messages -------------------------------------------
  // 1) Lead asking for availability (bot handled, with a quote)
  const conv1 = await prisma.conversation.create({
    data: {
      guestPhone: guests[2].phone,
      guestName: guests[2].name,
      guestId: guests[2].id,
      status: ConversationStatus.BOT,
      unread: 1,
    },
  });
  const conv1Messages: Array<[MessageDirection, string, boolean]> = [
    [MessageDirection.INBOUND, "Oi, boa tarde! Vocês têm suíte disponível para o feriado?", false],
    [MessageDirection.OUTBOUND, "Boa tarde, Ana! 😊 Que bom seu interesse no Hotel Paradise! Para quais datas você gostaria?", true],
    [MessageDirection.INBOUND, "Seria do dia 10 ao dia 13, para 2 pessoas. É nossa lua de mel ❤️", false],
    [MessageDirection.OUTBOUND, "Que especial! 🥰 Temos uma Suíte perfeita: vista panorâmica e hidromassagem.\n\n• Suíte — 3 noites\n• Diária: R$ 620\n• Total: R$ 1.860 (café da manhã incluído!)\n\nO orçamento vale por 48h. Posso reservar para vocês?", true],
    [MessageDirection.INBOUND, "Vou conversar com meu noivo e te aviso!", false],
  ];
  let createdAt = new Date(Date.now() - 3 * 60 * 60 * 1000);
  for (const [direction, content, fromBot] of conv1Messages) {
    await prisma.message.create({
      data: {
        conversationId: conv1.id,
        content,
        direction,
        type: MessageType.TEXT,
        fromBot,
        createdAt,
      },
    });
    createdAt = new Date(createdAt.getTime() + 4 * 60 * 1000);
  }

  // 2) Existing guest, human takeover
  const conv2 = await prisma.conversation.create({
    data: {
      guestPhone: guests[0].phone,
      guestName: guests[0].name,
      guestId: guests[0].id,
      status: ConversationStatus.HUMAN,
      unread: 0,
    },
  });
  const conv2Messages: Array<[MessageDirection, string, boolean]> = [
    [MessageDirection.INBOUND, "Preciso de um late check-out amanhã, é possível?", false],
    [MessageDirection.OUTBOUND, "Oi Maria! Vou verificar com a recepção e já te confirmo. 🙏", true],
    [MessageDirection.OUTBOUND, "Maria, conseguimos liberar o check-out até as 15h sem custo. Tudo certo! 😊", false],
  ];
  createdAt = new Date(Date.now() - 60 * 60 * 1000);
  for (const [direction, content, fromBot] of conv2Messages) {
    await prisma.message.create({
      data: {
        conversationId: conv2.id,
        content,
        direction,
        type: MessageType.TEXT,
        fromBot,
        createdAt,
      },
    });
    createdAt = new Date(createdAt.getTime() + 5 * 60 * 1000);
  }

  // 3) Lead just greeting
  const conv3 = await prisma.conversation.create({
    data: {
      guestPhone: guests[6].phone,
      guestName: guests[6].name,
      guestId: guests[6].id,
      status: ConversationStatus.BOT,
      unread: 2,
    },
  });
  await prisma.message.create({
    data: {
      conversationId: conv3.id,
      content: "Olá! Gostaria de saber os valores dos quartos de luxo.",
      direction: MessageDirection.INBOUND,
      type: MessageType.TEXT,
      fromBot: false,
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
    },
  });
  await prisma.message.create({
    data: {
      conversationId: conv3.id,
      content: "Olá, Juliana! 😊 Para qual período você gostaria do quarto Luxo? Assim te passo o valor exato com café da manhã incluído.",
      direction: MessageDirection.OUTBOUND,
      type: MessageType.TEXT,
      fromBot: true,
      createdAt: new Date(Date.now() - 19 * 60 * 1000),
    },
  });
  console.log("   ✓ 3 conversations with messages");

  // --- Feedback ------------------------------------------------------------
  await prisma.feedback.create({
    data: {
      guestId: guests[5].id,
      reservationId: reservations[3].id,
      rating: 5,
      comment: "Atendimento impecável e quarto muito confortável!",
      source: "whatsapp",
    },
  });
  await prisma.feedback.create({
    data: {
      guestId: guests[7].id,
      reservationId: reservations[4].id,
      rating: 4,
      comment: "Ótima estadia, só o Wi-Fi oscilou um pouco.",
      source: "whatsapp",
    },
  });
  await prisma.feedback.create({
    data: {
      guestId: guests[0].id,
      reservationId: reservations[5].id,
      rating: 5,
      comment: "Sempre volto! Equipe maravilhosa.",
      source: "whatsapp",
    },
  });
  console.log("   ✓ 3 feedbacks");

  // --- Promotions ----------------------------------------------------------
  await prisma.promotion.create({
    data: {
      name: "Volte ao Paradise - 15% OFF",
      message: "Olá {nome}! 🌟 Sentimos sua falta no Hotel Paradise. Reserve até domingo e ganhe 15% de desconto na sua próxima estadia. Responda esta mensagem para garantir!",
      targetSegment: "PAST_GUESTS",
      status: "DRAFT",
      totalTargets: 0,
    },
  });
  await prisma.promotion.create({
    data: {
      name: "Pacote Feriado Prolongado",
      message: "Oi {nome}! ☀️ Aproveite o feriado no Hotel Paradise com diárias especiais e café da manhã incluso. Vagas limitadas!",
      targetSegment: "ALL",
      status: "SENT",
      sentCount: 8,
      totalTargets: 8,
    },
  });
  console.log("   ✓ 2 promotions");

  console.log("✅ Seed complete!\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
