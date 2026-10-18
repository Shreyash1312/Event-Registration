-- CreateTable
CREATE TABLE "RegistrationLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ownerSecretHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "maxRegistrations" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailOtp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationLink_token_key" ON "RegistrationLink"("token");

-- CreateIndex
CREATE INDEX "Registration_linkId_idx" ON "Registration"("linkId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_linkId_email_key" ON "Registration"("linkId", "email");

-- CreateIndex
CREATE INDEX "EmailOtp_linkId_email_idx" ON "EmailOtp"("linkId", "email");

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "RegistrationLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailOtp" ADD CONSTRAINT "EmailOtp_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "RegistrationLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
