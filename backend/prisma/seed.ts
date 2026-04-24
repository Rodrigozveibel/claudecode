import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create property
  const property = await prisma.property.upsert({
    where: { id: 'prop-demo-001' },
    update: {},
    create: {
      id: 'prop-demo-001',
      name: 'Hotel Grand Palace',
      slug: 'hotel-grand-palace',
      description: 'Hotel de luxo no coração da cidade',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      zipCode: '01310-100',
      phone: '(11) 3000-0000',
      email: 'contato@grandpalace.com.br',
      website: 'https://grandpalace.com.br',
      currency: 'BRL',
      timezone: 'America/Sao_Paulo',
      checkInTime: '14:00',
      checkOutTime: '12:00',
      taxRate: 15,
      starRating: 5,
    },
  });

  console.log('✅ Property created:', property.name);

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hotel.com' },
    update: {},
    create: {
      email: 'admin@hotel.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
      propertyId: property.id,
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create staff users
  const staffUsers = [
    { email: 'recepcao@hotel.com', name: 'Ana Silva', role: 'FRONT_DESK' as const },
    { email: 'governanca@hotel.com', name: 'Maria Santos', role: 'HOUSEKEEPING' as const },
    { email: 'manutencao@hotel.com', name: 'João Oliveira', role: 'MAINTENANCE' as const },
    { email: 'financeiro@hotel.com', name: 'Carlos Souza', role: 'ACCOUNTANT' as const },
    { email: 'gerente@hotel.com', name: 'Fernanda Lima', role: 'MANAGER' as const },
  ];

  for (const staff of staffUsers) {
    await prisma.user.upsert({
      where: { email: staff.email },
      update: {},
      create: {
        email: staff.email,
        password: hashedPassword,
        name: staff.name,
        role: staff.role,
        propertyId: property.id,
      },
    });
  }

  console.log('✅ Staff users created');

  // Create room types
  const roomTypes = [
    {
      id: 'rt-standard',
      name: 'Standard',
      description: 'Quarto confortável com cama de casal e todas as comodidades básicas',
      maxOccupancy: 2,
      maxAdults: 2,
      maxChildren: 1,
      size: 22,
      basePrice: 199.90,
      amenities: ['Wi-Fi', 'TV 42"', 'Ar-condicionado', 'Frigobar', 'Cofre'],
    },
    {
      id: 'rt-deluxe',
      name: 'Deluxe',
      description: 'Quarto espaçoso com vista para a cidade e amenidades premium',
      maxOccupancy: 2,
      maxAdults: 2,
      maxChildren: 2,
      size: 32,
      basePrice: 349.90,
      amenities: ['Wi-Fi', 'TV 55"', 'Ar-condicionado', 'Frigobar', 'Cofre', 'Banheira', 'Vista cidade'],
    },
    {
      id: 'rt-suite',
      name: 'Suíte Executiva',
      description: 'Suíte luxuosa com sala de estar separada e serviços exclusivos',
      maxOccupancy: 3,
      maxAdults: 2,
      maxChildren: 2,
      size: 52,
      basePrice: 599.90,
      amenities: ['Wi-Fi', 'TV 65"', 'Ar-condicionado', 'Frigobar', 'Cofre', 'Banheira Jacuzzi', 'Sala de estar', 'Serviço de mordomo'],
    },
    {
      id: 'rt-master',
      name: 'Suíte Master',
      description: 'A experiência máxima em luxo e conforto com vista panorâmica',
      maxOccupancy: 4,
      maxAdults: 2,
      maxChildren: 2,
      size: 85,
      basePrice: 999.90,
      amenities: ['Wi-Fi', 'TV 75"', 'Ar-condicionado', 'Frigobar', 'Cofre', 'Banheira Jacuzzi', 'Sala de estar', 'Terraço privativo', 'Cozinha compacta', 'Serviço de mordomo'],
    },
  ];

  for (const rt of roomTypes) {
    await prisma.roomType.upsert({
      where: { id: rt.id },
      update: {},
      create: {
        id: rt.id,
        propertyId: property.id,
        name: rt.name,
        description: rt.description,
        maxOccupancy: rt.maxOccupancy,
        maxAdults: rt.maxAdults,
        maxChildren: rt.maxChildren,
        size: rt.size,
        basePrice: rt.basePrice,
        amenities: rt.amenities,
      },
    });
  }

  console.log('✅ Room types created');

  // Create rooms
  const floors = [
    { floor: 1, types: [{ typeId: 'rt-standard', count: 8 }, { typeId: 'rt-deluxe', count: 4 }] },
    { floor: 2, types: [{ typeId: 'rt-standard', count: 8 }, { typeId: 'rt-deluxe', count: 4 }] },
    { floor: 3, types: [{ typeId: 'rt-deluxe', count: 6 }, { typeId: 'rt-suite', count: 4 }] },
    { floor: 4, types: [{ typeId: 'rt-suite', count: 6 }, { typeId: 'rt-master', count: 2 }] },
  ];

  let roomCounter = 100;
  for (const floorData of floors) {
    for (const typeData of floorData.types) {
      for (let i = 0; i < typeData.count; i++) {
        roomCounter++;
        const roomNumber = String(roomCounter);
        await prisma.room.upsert({
          where: { id: `room-${roomNumber}` },
          update: {},
          create: {
            id: `room-${roomNumber}`,
            propertyId: property.id,
            roomTypeId: typeData.typeId,
            number: roomNumber,
            floor: floorData.floor,
            status: 'AVAILABLE',
          },
        });
      }
    }
  }

  console.log('✅ Rooms created');

  // Create sample guests
  const guests = [
    { firstName: 'Carlos', lastName: 'Oliveira', email: 'carlos.oliveira@email.com', phone: '(11) 99999-1111', nationality: 'Brasileiro' },
    { firstName: 'Maria', lastName: 'Santos', email: 'maria.santos@email.com', phone: '(11) 99999-2222', nationality: 'Brasileira' },
    { firstName: 'João', lastName: 'Ferreira', email: 'joao.ferreira@email.com', phone: '(11) 99999-3333', nationality: 'Brasileiro' },
    { firstName: 'Ana', lastName: 'Pereira', email: 'ana.pereira@email.com', phone: '(11) 99999-4444', nationality: 'Brasileira' },
    { firstName: 'Pedro', lastName: 'Lima', email: 'pedro.lima@email.com', phone: '(11) 99999-5555', nationality: 'Brasileiro' },
    { firstName: 'Lucia', lastName: 'Rodrigues', email: 'lucia.rodrigues@email.com', phone: '(11) 99999-6666', nationality: 'Brasileira' },
  ];

  const createdGuests = [];
  for (const guest of guests) {
    const created = await prisma.guest.upsert({
      where: { email: guest.email },
      update: {},
      create: {
        propertyId: property.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        phone: guest.phone,
        nationality: guest.nationality,
      },
    });
    createdGuests.push(created);
  }

  console.log('✅ Guests created');

  // Create sample channel mappings
  const channels = [
    { channelName: 'BOOKING_COM' as const, externalPropertyId: 'HOTEL12345', markup: 15 },
    { channelName: 'EXPEDIA' as const, externalPropertyId: 'EXP98765', markup: 18 },
    { channelName: 'AIRBNB' as const, externalPropertyId: 'ABN54321', markup: 12 },
  ];

  for (const channel of channels) {
    await prisma.channelMapping.create({
      data: {
        propertyId: property.id,
        channelName: channel.channelName,
        externalPropertyId: channel.externalPropertyId,
        markup: channel.markup,
      },
    });
  }

  console.log('✅ Channel mappings created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin:      admin@hotel.com     / Admin@123');
  console.log('   Recepção:   recepcao@hotel.com  / Admin@123');
  console.log('   Governança: governanca@hotel.com / Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
