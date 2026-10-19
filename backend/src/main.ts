
import { NestFactory } from "@nestjs/core";
import { AppModule, ObserveInstrument } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  app.enableCors({
    origin: "http://localhost:3000",
  });

  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
