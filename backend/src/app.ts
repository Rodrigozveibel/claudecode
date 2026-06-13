import express from "express";
import cors from "cors";
import { createServer } from "http";
import { env } from "./config/env";
import { initSocket } from "./config/socket";
import routes from "./routes";
import { notFound, errorHandler } from "./middleware/error.middleware";
import { followupService } from "./services/scheduler/followup.service";
import { promotionService } from "./services/scheduler/promotion.service";

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "hotel-whatsapp-ai", time: new Date().toISOString() });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

// HTTP server + Socket.io
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(env.port, () => {
  console.log(`\n🏨 ${env.hotel.name} — WhatsApp AI backend`);
  console.log(`   API:    http://localhost:${env.port}/api`);
  console.log(`   Socket: ws://localhost:${env.port}`);
  console.log(`   Model:  ${env.anthropicModel}`);
  console.log(`   Mode:   ${env.nodeEnv}\n`);

  // Start schedulers
  followupService.start();
  promotionService.start();
});

export default app;
