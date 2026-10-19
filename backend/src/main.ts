
import { NestFactory } from "@nestjs/core";
import { AppModule, ObserveInstrument } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  const frontendUrl = (
    process.env.FRONTEND_URL ?? "http://localhost:3000"
  ).replace(/\/+$/, "");

  app.enableCors({
    origin: frontendUrl,
  });

  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
