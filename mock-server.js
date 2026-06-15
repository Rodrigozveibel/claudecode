// Mock API server for demo purposes — simulates the backend
const http = require("http");

const rooms = [
  { id: "r1", number: "101", type: "Standard", floor: 1, capacity: 2, rate: 220, status: "LIVRE", amenities: ["Ar-condicionado", "TV", "Wi-Fi"], description: "Quarto Standard no 1º andar." },
  { id: "r2", number: "102", type: "Standard", floor: 1, capacity: 2, rate: 220, status: "OCUPADO", amenities: ["Ar-condicionado", "TV", "Wi-Fi"], description: "Quarto Standard no 1º andar." },
  { id: "r3", number: "103", type: "Standard", floor: 1, capacity: 2, rate: 220, status: "LIMPEZA", amenities: ["Ar-condicionado", "TV", "Wi-Fi"], description: "Quarto Standard no 1º andar." },
  { id: "r4", number: "104", type: "Standard", floor: 1, capacity: 2, rate: 220, status: "LIVRE", amenities: ["Ar-condicionado", "TV", "Wi-Fi"], description: "Quarto Standard no 1º andar." },
  { id: "r5", number: "105", type: "Standard", floor: 1, capacity: 2, rate: 220, status: "MANUTENCAO", amenities: ["Ar-condicionado", "TV", "Wi-Fi"], description: "Quarto Standard no 1º andar." },
  { id: "r6", number: "201", type: "Luxo", floor: 2, capacity: 3, rate: 380, status: "LIVRE", amenities: ["Ar-condicionado", "TV", "Wi-Fi", "Varanda", "Frigobar"], description: "Quarto Luxo no 2º andar." },
  { id: "r7", number: "202", type: "Luxo", floor: 2, capacity: 3, rate: 380, status: "OCUPADO", amenities: ["Ar-condicionado", "TV", "Wi-Fi", "Varanda", "Frigobar"], description: "Quarto Luxo no 2º andar." },
  { id: "r8", number: "203", type: "Luxo", floor: 2, capacity: 3, rate: 380, status: "LIVRE", amenities: ["Ar-condicionado", "TV", "Wi-Fi", "Varanda", "Frigobar"], description: "Quarto Luxo no 2º andar." },
  { id: "r9", number: "301", type: "Suíte", floor: 3, capacity: 4, rate: 620, status: "LIVRE", amenities: ["Ar-condicionado", "TV", "Wi-Fi", "Hidromassagem", "Sala de estar", "Vista panorâmica"], description: "Suíte no 3º andar." },
  { id: "r10", number: "302", type: "Suíte", floor: 3, capacity: 4, rate: 620, status: "OCUPADO", amenities: ["Ar-condicionado", "TV", "Wi-Fi", "Hidromassagem", "Sala de estar", "Vista panorâmica"], description: "Suíte no 3º andar." },
];

const guests = [
  { id: "g1", name: "Ana Paula Rodrigues", phone: "5511991234567", email: "ana@email.com", segment: "LOYAL" },
  { id: "g2", name: "Carlos Eduardo Lima", phone: "5511987654321", email: "carlos@email.com", segment: "PAST_GUEST" },
  { id: "g3", name: "Mariana Costa Silva", phone: "5521955443322", email: "mariana@email.com", segment: "LEAD" },
  { id: "g4", name: "Roberto Santos Alves", phone: "5531944332211", email: "roberto@email.com", segment: "PAST_GUEST" },
  { id: "g5", name: "Fernanda Oliveira", phone: "5541933221100", email: "fernanda@email.com", segment: "LOYAL" },
  { id: "g6", name: "Paulo Henrique Melo", phone: "5511922113300", email: "paulo@email.com", segment: "LEAD" },
  { id: "g7", name: "Juliana Ferreira", phone: "5521911002299", email: "juliana@email.com", segment: "PAST_GUEST" },
];

const reservations = [
  { id: "res1", guestId: "g1", roomId: "r2", checkIn: "2026-06-13T14:00:00Z", checkOut: "2026-06-16T12:00:00Z", status: "CONFIRMADA", totalAmount: 660, guests: 2, notes: "", guest: guests[0], room: rooms[1] },
  { id: "res2", guestId: "g2", roomId: "r7", checkIn: "2026-06-13T14:00:00Z", checkOut: "2026-06-15T12:00:00Z", status: "CONFIRMADA", totalAmount: 760, guests: 2, notes: "", guest: guests[1], room: rooms[6] },
  { id: "res3", guestId: "g5", roomId: "r10", checkIn: "2026-06-12T14:00:00Z", checkOut: "2026-06-14T12:00:00Z", status: "CONFIRMADA", totalAmount: 1240, guests: 3, notes: "Aniversário de casamento", guest: guests[4], room: rooms[9] },
  { id: "res4", guestId: "g3", roomId: "r1", checkIn: "2026-06-15T14:00:00Z", checkOut: "2026-06-18T12:00:00Z", status: "PENDENTE", totalAmount: 660, guests: 1, notes: "", guest: guests[2], room: rooms[0] },
  { id: "res5", guestId: "g4", roomId: "r6", checkIn: "2026-06-17T14:00:00Z", checkOut: "2026-06-20T12:00:00Z", status: "CONFIRMADA", totalAmount: 1140, guests: 2, notes: "", guest: guests[3], room: rooms[5] },
  { id: "res6", guestId: "g7", roomId: "r9", checkIn: "2026-05-20T14:00:00Z", checkOut: "2026-05-23T12:00:00Z", status: "FINALIZADA", totalAmount: 1860, guests: 4, notes: "", guest: guests[6], room: rooms[8] },
  { id: "res7", guestId: "g6", roomId: "r4", checkIn: "2026-06-20T14:00:00Z", checkOut: "2026-06-22T12:00:00Z", status: "CANCELADA", totalAmount: 440, guests: 2, notes: "", guest: guests[5], room: rooms[3] },
];

// Match Conversation type exactly: unread (not unreadCount), updatedAt (not lastMessageAt)
const conversations = [
  { id: "c1", guestId: "g3", guestPhone: "5521955443322", guestName: "Mariana Costa Silva", status: "BOT", unread: 0, lastMessage: "Perfeito! Sua reserva foi confirmada. ✅ Aguardamos você!", updatedAt: "2026-06-13T18:30:00Z", isHumanControlled: false },
  { id: "c2", guestId: "g6", guestPhone: "5511922113300", guestName: "Paulo Henrique Melo", status: "ACTIVE", unread: 2, lastMessage: "Vocês aceitam pets de médio porte?", updatedAt: "2026-06-13T19:10:00Z", isHumanControlled: false },
  { id: "c3", guestId: "g2", guestPhone: "5511987654321", guestName: "Carlos Eduardo Lima", status: "HUMAN", unread: 0, lastMessage: "Ok, obrigado pelo atendimento!", updatedAt: "2026-06-13T17:45:00Z", isHumanControlled: true },
  { id: "c4", guestId: "g5", guestPhone: "5541933221100", guestName: "Fernanda Oliveira", status: "BOT", unread: 1, lastMessage: "Quero saber sobre pacotes de lua de mel", updatedAt: "2026-06-13T19:40:00Z", isHumanControlled: false },
  { id: "c5", guestId: "g1", guestPhone: "5511991234567", guestName: "Ana Paula Rodrigues", status: "RESOLVED", unread: 0, lastMessage: "Até amanhã! 😊", updatedAt: "2026-06-12T20:00:00Z", isHumanControlled: false },
];

const messages = {
  c1: [
    { id: "m1", conversationId: "c1", content: "Oi! Gostaria de reservar um quarto para o final de semana de 15 a 18/06, para 1 pessoa.", direction: "INBOUND", type: "TEXT", fromBot: false, createdAt: "2026-06-13T18:00:00Z" },
    { id: "m2", conversationId: "c1", content: "Olá, Mariana! Que ótimo que vai nos visitar 😊 Para os dias 15 a 18/06 (3 noites), temos o Quarto Standard disponível por R$ 220/noite, totalizando R$ 660. Café da manhã incluso e cancelamento gratuito até 48h antes. Posso confirmar sua reserva?", direction: "OUTBOUND", type: "TEXT", fromBot: true, createdAt: "2026-06-13T18:01:00Z" },
    { id: "m3", conversationId: "c1", content: "Sim! Pode confirmar.", direction: "INBOUND", type: "TEXT", fromBot: false, createdAt: "2026-06-13T18:25:00Z" },
    { id: "m4", conversationId: "c1", content: "Perfeito! Sua reserva foi confirmada. ✅ Aguardamos você!", direction: "OUTBOUND", type: "TEXT", fromBot: true, createdAt: "2026-06-13T18:30:00Z" },
  ],
  c2: [
    { id: "m5", conversationId: "c2", content: "Boa tarde! Quero reservar um quarto do dia 20 ao 22/06.", direction: "INBOUND", type: "TEXT", fromBot: false, createdAt: "2026-06-13T18:50:00Z" },
    { id: "m6", conversationId: "c2", content: "Boa tarde, Paulo! Temos o Quarto Standard disponível nesses dias por R$ 220/noite (R$ 440 no total). Ficou interessado?", direction: "OUTBOUND", type: "TEXT", fromBot: true, createdAt: "2026-06-13T18:51:00Z" },
    { id: "m7", conversationId: "c2", content: "Vocês aceitam pets de médio porte?", direction: "INBOUND", type: "TEXT", fromBot: false, createdAt: "2026-06-13T19:10:00Z" },
  ],
  c3: [
    { id: "m8", conversationId: "c3", content: "Bom dia! Preciso cancelar minha reserva.", direction: "INBOUND", type: "TEXT", fromBot: false, createdAt: "2026-06-13T17:30:00Z" },
    { id: "m9", conversationId: "c3", content: "Olá Carlos! Claro, vou processar o cancelamento. Pode confirmar o número da reserva?", direction: "OUTBOUND", type: "TEXT", fromBot: true, createdAt: "2026-06-13T17:31:00Z" },
    { id: "m10", conversationId: "c3", content: "Ok, obrigado pelo atendimento!", direction: "INBOUND", type: "TEXT", fromBot: false, createdAt: "2026-06-13T17:45:00Z" },
  ],
  c4: [
    { id: "m11", conversationId: "c4", content: "Quero saber sobre pacotes de lua de mel", direction: "INBOUND", type: "TEXT", fromBot: false, createdAt: "2026-06-13T19:40:00Z" },
  ],
  c5: [
    { id: "m12", conversationId: "c5", content: "Quero check-in amanhã às 14h. Tudo certo?", direction: "INBOUND", type: "TEXT", fromBot: false, createdAt: "2026-06-12T19:50:00Z" },
    { id: "m13", conversationId: "c5", content: "Olá Ana! Tudo certo para o seu check-in amanhã às 14h. Estaremos esperando! Até amanhã! 😊", direction: "OUTBOUND", type: "TEXT", fromBot: true, createdAt: "2026-06-12T19:52:00Z" },
    { id: "m14", conversationId: "c5", content: "Até amanhã! 😊", direction: "INBOUND", type: "TEXT", fromBot: false, createdAt: "2026-06-12T20:00:00Z" },
  ],
};

const promotions = [
  { id: "p1", name: "Promoção Inverno 2026", message: "☃️ O inverno chegou! Aproveite 20% OFF nas Suítes do Hotel Paradise. Use o código INVERNO26. Válido até 31/07.", targetSegment: "ALL", status: "SENT", scheduledAt: "2026-06-01T10:00:00Z", sentCount: 156, totalTargets: 156 },
  { id: "p2", name: "Fidelidade — Clientes VIP", message: "Olá! Como cliente especial, você tem acesso a uma tarifa exclusiva: 15% OFF na sua próxima estadia. Válido esse mês!", targetSegment: "LOYAL", status: "SENT", scheduledAt: "2026-06-10T09:00:00Z", sentCount: 42, totalTargets: 42 },
  { id: "p3", name: "Fim de Semana Relax", message: "🏊 Que tal um fim de semana de descanso? Reserve agora e ganhe late check-out gratuito até as 14h. Quartos a partir de R$ 220/noite.", targetSegment: "PAST_GUESTS", status: "SCHEDULED", scheduledAt: "2026-06-14T08:00:00Z", sentCount: 0, totalTargets: 87 },
  { id: "p4", name: "Boas-vindas para Leads", message: "Olá! Vimos que você se interessou pelo Hotel Paradise 🏨 Temos quartos disponíveis este mês com condições especiais. Quer saber mais?", targetSegment: "LEADS", status: "DRAFT", scheduledAt: null, sentCount: 0, totalTargets: 34 },
];

// Match DashboardAnalytics type exactly: reservationsToday, occupancyTrend with {date, occupancy}
const occupancyTrend = Array.from({ length: 30 }, (_, i) => {
  const d = new Date("2026-05-14");
  d.setDate(d.getDate() + i);
  return {
    date: d.toISOString().split("T")[0],
    occupancy: Math.round(55 + Math.sin(i * 0.4) * 20 + Math.random() * 10),
  };
});

const dashboardData = {
  activeConversations: 4,
  reservationsToday: 3,
  occupancyRate: 68,
  monthRevenue: 24840,
  occupancyTrend,
  upcomingCheckIns: [
    { id: "res3", guestName: "Fernanda Oliveira", roomNumber: "302", checkIn: "2026-06-13T14:00:00Z" },
    { id: "res1", guestName: "Ana Paula Rodrigues", roomNumber: "102", checkIn: "2026-06-13T14:00:00Z" },
    { id: "res2", guestName: "Carlos Eduardo Lima", roomNumber: "202", checkIn: "2026-06-13T14:00:00Z" },
    { id: "res4", guestName: "Mariana Costa Silva", roomNumber: "101", checkIn: "2026-06-15T14:00:00Z" },
  ],
  upcomingCheckOuts: [
    { id: "res3", guestName: "Fernanda Oliveira", roomNumber: "302", checkOut: "2026-06-14T12:00:00Z" },
    { id: "res1", guestName: "Ana Paula Rodrigues", roomNumber: "102", checkOut: "2026-06-16T12:00:00Z" },
    { id: "res2", guestName: "Carlos Eduardo Lima", roomNumber: "202", checkOut: "2026-06-15T12:00:00Z" },
  ],
};

// Match PerformanceAnalytics type
const analyticsPerf = {
  totalMessages: 1247,
  responseRate: 94.2,
  avgResponseTimeSec: 3.8,
  conversionRate: 31.5,
  funnel: { inquiries: 312, quotes: 187, reservations: 98 },
  revenueTrend: Array.from({ length: 30 }, (_, i) => {
    const d = new Date("2026-05-14");
    d.setDate(d.getDate() + i);
    return { date: d.toISOString().split("T")[0], revenue: Math.round(800 + Math.sin(i * 0.4) * 200 + Math.random() * 100) };
  }),
  topRoomTypes: [
    { type: "Suíte", count: 16 },
    { type: "Luxo", count: 22 },
    { type: "Standard", count: 30 },
  ],
  satisfaction: { average: 4.6, count: 91 },
};

function jsonResponse(res, data, status = 200) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" });
    return res.end();
  }

  const url = req.url.split("?")[0];
  const method = req.method;

  if (url === "/health") return jsonResponse(res, { status: "ok", service: "hotel-whatsapp-ai-MOCK" });

  // Analytics
  if (url === "/api/analytics/dashboard") return jsonResponse(res, dashboardData);
  if (url === "/api/analytics/performance") return jsonResponse(res, analyticsPerf);
  if (url === "/api/analytics") return jsonResponse(res, analyticsPerf);

  // Rooms — plain array
  if (url === "/api/rooms" && method === "GET") return jsonResponse(res, rooms);

  // Guests — plain array
  if (url === "/api/guests" && method === "GET") return jsonResponse(res, guests);

  // Reservations — plain array
  if (url === "/api/reservations" && method === "GET") return jsonResponse(res, reservations);

  // Conversations — plain array
  if (url === "/api/conversations" && method === "GET") return jsonResponse(res, conversations);

  // Messages for a conversation
  const msgMatch = url.match(/^\/api\/conversations\/(\w+)\/messages$/);
  if (msgMatch) return jsonResponse(res, messages[msgMatch[1]] ?? []);

  // Conversation detail
  const convMatch = url.match(/^\/api\/conversations\/(\w+)$/);
  if (convMatch) {
    const c = conversations.find(x => x.id === convMatch[1]);
    return c
      ? jsonResponse(res, { conversation: c, messages: messages[c.id] ?? [] })
      : jsonResponse(res, { error: "Not found" }, 404);
  }

  // Promotions — plain array
  if (url === "/api/promotions" && method === "GET") return jsonResponse(res, promotions);

  // Mutating endpoints — mock success
  if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
    let body = "";
    req.on("data", d => (body += d));
    req.on("end", () => jsonResponse(res, { success: true, message: "Operação simulada com sucesso (mock)." }));
    return;
  }

  jsonResponse(res, { error: "Not found" }, 404);
});

server.listen(3001, () => {
  console.log("🏨 Mock API server running at http://localhost:3001");
});
