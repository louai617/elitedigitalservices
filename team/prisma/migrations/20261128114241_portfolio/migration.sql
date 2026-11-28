-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "service" TEXT NOT NULL DEFAULT '',
    "year" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "tagline" TEXT,
    "content" TEXT,
    "result" TEXT,
    "link" TEXT,
    "github" TEXT,
    "tech" TEXT[],
    "banner" TEXT,
    "images" TEXT[],
    "videoGroups" JSONB,
    "highlights" JSONB,
    "ctaTitle" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioItem_slug_key" ON "PortfolioItem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioItem_projectId_key" ON "PortfolioItem"("projectId");

-- CreateIndex
CREATE INDEX "PortfolioItem_published_sortOrder_idx" ON "PortfolioItem"("published", "sortOrder");

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
