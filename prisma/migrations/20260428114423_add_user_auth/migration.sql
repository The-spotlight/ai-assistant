-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "title" TEXT,
    "modelId" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "toolInvocations" JSONB,
    "clientMessageId" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "replyToId" TEXT,
    "replyToSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '其他',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Share" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "title" TEXT,
    "expiresAt" TIMESTAMP(3),
    "hasPassword" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareView" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "ShareView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "appearance" JSONB,
    "behavior" JSONB,
    "model" JSONB,
    "keyboardShortcuts" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL DEFAULT false,
    "disliked" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_userId_updatedAt_idx" ON "Conversation"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_updatedAt_idx" ON "Conversation"("updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_userId_deviceId_isPinned_pinnedAt_orderIndex_u_idx" ON "Conversation"("userId", "deviceId", "isPinned" DESC, "pinnedAt" DESC, "orderIndex" ASC, "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_userId_deviceId_isDeleted_updatedAt_idx" ON "Conversation"("userId", "deviceId", "isDeleted" ASC, "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_userId_deviceId_isDeleted_isPinned_pinnedAt_or_idx" ON "Conversation"("userId", "deviceId", "isDeleted" ASC, "isPinned" DESC, "pinnedAt" DESC, "orderIndex" ASC, "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_userId_deviceId_isDeleted_deletedAt_idx" ON "Conversation"("userId", "deviceId", "isDeleted" DESC, "deletedAt" DESC);

-- CreateIndex
CREATE INDEX "Message_userId_conversationId_createdAt_idx" ON "Message"("userId", "conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_userId_replyToId_idx" ON "Message"("userId", "replyToId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_conversationId_clientMessageId_key" ON "Message"("conversationId", "clientMessageId");

-- CreateIndex
CREATE INDEX "Favorite_userId_deviceId_createdAt_idx" ON "Favorite"("userId", "deviceId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_messageId_userId_deviceId_key" ON "Favorite"("messageId", "userId", "deviceId");

-- CreateIndex
CREATE INDEX "Template_userId_deviceId_category_orderIndex_createdAt_idx" ON "Template"("userId", "deviceId", "category", "orderIndex" ASC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Template_userId_deviceId_orderIndex_createdAt_idx" ON "Template"("userId", "deviceId", "orderIndex" ASC, "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Share_shareId_key" ON "Share"("shareId");

-- CreateIndex
CREATE INDEX "Share_shareId_idx" ON "Share"("shareId");

-- CreateIndex
CREATE INDEX "Share_userId_deviceId_createdAt_idx" ON "Share"("userId", "deviceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Share_userId_conversationId_idx" ON "Share"("userId", "conversationId");

-- CreateIndex
CREATE INDEX "Share_userId_deviceId_isDeleted_createdAt_idx" ON "Share"("userId", "deviceId", "isDeleted" ASC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Share_userId_deviceId_isDeleted_deletedAt_idx" ON "Share"("userId", "deviceId", "isDeleted" DESC, "deletedAt" DESC);

-- CreateIndex
CREATE INDEX "ShareView_shareId_idx" ON "ShareView"("shareId");

-- CreateIndex
CREATE INDEX "ShareView_shareId_viewedAt_idx" ON "ShareView"("shareId", "viewedAt" DESC);

-- CreateIndex
CREATE INDEX "UserSetting_userId_deviceId_idx" ON "UserSetting"("userId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSetting_userId_deviceId_key" ON "UserSetting"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "MessageFeedback_userId_deviceId_createdAt_idx" ON "MessageFeedback"("userId", "deviceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MessageFeedback_userId_messageId_idx" ON "MessageFeedback"("userId", "messageId");

-- CreateIndex
CREATE INDEX "MessageFeedback_userId_conversationId_idx" ON "MessageFeedback"("userId", "conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageFeedback_userId_messageId_deviceId_key" ON "MessageFeedback"("userId", "messageId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareView" ADD CONSTRAINT "ShareView_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("shareId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSetting" ADD CONSTRAINT "UserSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageFeedback" ADD CONSTRAINT "MessageFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageFeedback" ADD CONSTRAINT "MessageFeedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageFeedback" ADD CONSTRAINT "MessageFeedback_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
