/*
  Warnings:

  - A unique constraint covering the columns `[userId,messageId,deviceId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,messageId,deviceId]` on the table `MessageFeedback` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,deviceId]` on the table `UserSetting` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userId` on table `Conversation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Favorite` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Message` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `MessageFeedback` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Share` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Template` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `UserSetting` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Conversation_deviceId_isDeleted_deletedAt_idx";

-- DropIndex
DROP INDEX "Conversation_deviceId_isDeleted_isPinned_pinnedAt_orderInde_idx";

-- DropIndex
DROP INDEX "Conversation_deviceId_isDeleted_updatedAt_idx";

-- DropIndex
DROP INDEX "Conversation_deviceId_isPinned_pinnedAt_orderIndex_updatedA_idx";

-- DropIndex
DROP INDEX "Conversation_deviceId_updatedAt_idx";

-- DropIndex
DROP INDEX "Favorite_deviceId_createdAt_idx";

-- DropIndex
DROP INDEX "Favorite_messageId_deviceId_key";

-- DropIndex
DROP INDEX "Message_conversationId_createdAt_idx";

-- DropIndex
DROP INDEX "Message_replyToId_idx";

-- DropIndex
DROP INDEX "MessageFeedback_conversationId_idx";

-- DropIndex
DROP INDEX "MessageFeedback_deviceId_createdAt_idx";

-- DropIndex
DROP INDEX "MessageFeedback_messageId_deviceId_key";

-- DropIndex
DROP INDEX "MessageFeedback_messageId_idx";

-- DropIndex
DROP INDEX "Share_conversationId_idx";

-- DropIndex
DROP INDEX "Share_deviceId_createdAt_idx";

-- DropIndex
DROP INDEX "Share_deviceId_isDeleted_createdAt_idx";

-- DropIndex
DROP INDEX "Share_deviceId_isDeleted_deletedAt_idx";

-- DropIndex
DROP INDEX "Template_deviceId_category_orderIndex_createdAt_idx";

-- DropIndex
DROP INDEX "Template_deviceId_orderIndex_createdAt_idx";

-- DropIndex
DROP INDEX "UserSetting_deviceId_idx";

-- DropIndex
DROP INDEX "UserSetting_deviceId_key";

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Favorite" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "MessageFeedback" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Share" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Template" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserSetting" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Conversation_userId_updatedAt_idx" ON "Conversation"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_userId_deviceId_isPinned_pinnedAt_orderIndex_u_idx" ON "Conversation"("userId", "deviceId", "isPinned" DESC, "pinnedAt" DESC, "orderIndex" ASC, "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_userId_deviceId_isDeleted_updatedAt_idx" ON "Conversation"("userId", "deviceId", "isDeleted" ASC, "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_userId_deviceId_isDeleted_isPinned_pinnedAt_or_idx" ON "Conversation"("userId", "deviceId", "isDeleted" ASC, "isPinned" DESC, "pinnedAt" DESC, "orderIndex" ASC, "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_userId_deviceId_isDeleted_deletedAt_idx" ON "Conversation"("userId", "deviceId", "isDeleted" DESC, "deletedAt" DESC);

-- CreateIndex
CREATE INDEX "Favorite_userId_deviceId_createdAt_idx" ON "Favorite"("userId", "deviceId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_messageId_deviceId_key" ON "Favorite"("userId", "messageId", "deviceId");

-- CreateIndex
CREATE INDEX "Message_userId_conversationId_createdAt_idx" ON "Message"("userId", "conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_userId_replyToId_idx" ON "Message"("userId", "replyToId");

-- CreateIndex
CREATE INDEX "MessageFeedback_userId_deviceId_createdAt_idx" ON "MessageFeedback"("userId", "deviceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MessageFeedback_userId_messageId_idx" ON "MessageFeedback"("userId", "messageId");

-- CreateIndex
CREATE INDEX "MessageFeedback_userId_conversationId_idx" ON "MessageFeedback"("userId", "conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageFeedback_userId_messageId_deviceId_key" ON "MessageFeedback"("userId", "messageId", "deviceId");

-- CreateIndex
CREATE INDEX "Share_userId_deviceId_createdAt_idx" ON "Share"("userId", "deviceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Share_userId_conversationId_idx" ON "Share"("userId", "conversationId");

-- CreateIndex
CREATE INDEX "Share_userId_deviceId_isDeleted_createdAt_idx" ON "Share"("userId", "deviceId", "isDeleted" ASC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Share_userId_deviceId_isDeleted_deletedAt_idx" ON "Share"("userId", "deviceId", "isDeleted" DESC, "deletedAt" DESC);

-- CreateIndex
CREATE INDEX "Template_userId_deviceId_category_orderIndex_createdAt_idx" ON "Template"("userId", "deviceId", "category", "orderIndex" ASC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Template_userId_deviceId_orderIndex_createdAt_idx" ON "Template"("userId", "deviceId", "orderIndex" ASC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "UserSetting_userId_deviceId_idx" ON "UserSetting"("userId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSetting_userId_deviceId_key" ON "UserSetting"("userId", "deviceId");
