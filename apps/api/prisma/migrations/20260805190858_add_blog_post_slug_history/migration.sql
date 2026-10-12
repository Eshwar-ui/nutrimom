-- CreateTable
CREATE TABLE "BlogPostSlug" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogPostSlug_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostSlug_slug_key" ON "BlogPostSlug"("slug");

-- CreateIndex
CREATE INDEX "BlogPostSlug_postId_idx" ON "BlogPostSlug"("postId");

-- AddForeignKey
ALTER TABLE "BlogPostSlug" ADD CONSTRAINT "BlogPostSlug_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
