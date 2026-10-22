-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "cancellationSecretHash" TEXT;

-- AlterTable
ALTER TABLE "RegistrationLink" ALTER COLUMN "maxRegistrations" SET DEFAULT 100;
