/*
  Warnings:

  - A unique constraint covering the columns `[messageId,deviceId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[messageId,deviceId]` on the table `MessageFeedback` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[deviceId]` on the table `UserSetting` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Conversation_userId_deviceId_isDeleted_deletedAt_idx";

-- DropIndex
DROP INDEX "Conversation_userId_deviceId_isDeleted_isPinned_pinnedAt_or_idx";

-- DropIndex
DROP INDEX "Conversation_userId_deviceId_isDeleted_updatedAt_idx";

-- DropIndex
DROP INDEX "Conversation_userId_deviceId_isPinned_pinnedAt_orderIndex_u_idx";

-- DropIndex
DROP INDEX "Conversation_userId_updatedAt_idx";

-- DropIndex
DROP INDEX "Favorite_messageId_userId_deviceId_key";

-- DropIndex
DROP INDEX "Favorite_userId_deviceId_createdAt_idx";

-- DropIndex
DROP INDEX "Message_userId_conversationId_createdAt_idx";

-- DropIndex
DROP INDEX "Message_userId_replyToId_idx";

-- DropIndex
DROP INDEX "MessageFeedback_userId_conversationId_idx";

-- DropIndex
DROP INDEX "MessageFeedback_userId_deviceId_createdAt_idx";

-- DropIndex
DROP INDEX "MessageFeedback_userId_messageId_deviceId_key";

-- DropIndex
DROP INDEX "MessageFeedback_userId_messageId_idx";

-- DropIndex
DROP INDEX "Share_userId_conversationId_idx";

-- DropIndex
DROP INDEX "Share_userId_deviceId_createdAt_idx";

-- DropIndex
DROP INDEX "Share_userId_deviceId_isDeleted_createdAt_idx";

-- DropIndex
DROP INDEX "Share_userId_deviceId_isDeleted_deletedAt_idx";

-- DropIndex
DROP INDEX "Template_userId_deviceId_category_orderIndex_createdAt_idx";

-- DropIndex
DROP INDEX "Template_userId_deviceId_orderIndex_createdAt_idx";

-- DropIndex
DROP INDEX "UserSetting_userId_deviceId_idx";

-- DropIndex
DROP INDEX "UserSetting_userId_deviceId_key";

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Favorite" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MessageFeedback" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Share" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Template" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserSetting" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Conversation_deviceId_updatedAt_idx" ON "Conversation"("deviceId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_deviceId_isPinned_pinnedAt_orderIndex_updatedA_idx" ON "Conversation"("deviceId", "isPinned" DESC, "pinnedAt" DESC, "orderIndex" ASC, "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_deviceId_isDeleted_updatedAt_idx" ON "Conversation"("deviceId", "isDeleted" ASC, "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_deviceId_isDeleted_isPinned_pinnedAt_orderInde_idx" ON "Conversation"("deviceId", "isDeleted" ASC, "isPinned" DESC, "pinnedAt" DESC, "orderIndex" ASC, "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_deviceId_isDeleted_deletedAt_idx" ON "Conversation"("deviceId", "isDeleted" DESC, "deletedAt" DESC);

-- CreateIndex
CREATE INDEX "Favorite_deviceId_createdAt_idx" ON "Favorite"("deviceId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_messageId_deviceId_key" ON "Favorite"("messageId", "deviceId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_replyToId_idx" ON "Message"("replyToId");

-- CreateIndex
CREATE INDEX "MessageFeedback_deviceId_createdAt_idx" ON "MessageFeedback"("deviceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MessageFeedback_messageId_idx" ON "MessageFeedback"("messageId");

-- CreateIndex
CREATE INDEX "MessageFeedback_conversationId_idx" ON "MessageFeedback"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageFeedback_messageId_deviceId_key" ON "MessageFeedback"("messageId", "deviceId");

-- CreateIndex
CREATE INDEX "Share_deviceId_createdAt_idx" ON "Share"("deviceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Share_conversationId_idx" ON "Share"("conversationId");

-- CreateIndex
CREATE INDEX "Share_deviceId_isDeleted_createdAt_idx" ON "Share"("deviceId", "isDeleted" ASC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Share_deviceId_isDeleted_deletedAt_idx" ON "Share"("deviceId", "isDeleted" DESC, "deletedAt" DESC);

-- CreateIndex
CREATE INDEX "Template_deviceId_category_orderIndex_createdAt_idx" ON "Template"("deviceId", "category", "orderIndex" ASC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Template_deviceId_orderIndex_createdAt_idx" ON "Template"("deviceId", "orderIndex" ASC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "UserSetting_deviceId_idx" ON "UserSetting"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSetting_deviceId_key" ON "UserSetting"("deviceId");
