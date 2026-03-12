/*
  Warnings:

  - You are about to drop the column `crewaiSettings` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `lastTrained` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `maxTokens` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `responseMode` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `systemPrompt` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `temperature` on the `Agent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "crewaiSettings",
DROP COLUMN "lastTrained",
DROP COLUMN "maxTokens",
DROP COLUMN "model",
DROP COLUMN "responseMode",
DROP COLUMN "systemPrompt",
DROP COLUMN "temperature",
ADD COLUMN     "image" TEXT,
ADD COLUMN     "initialMessage" TEXT;
