-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN_BRIDA', 'KEPALA_BRIDA', 'OPD');

-- CreateEnum
CREATE TYPE "ProposalSource" AS ENUM ('BRIDA_ANALYSIS', 'OPD_PROPOSAL');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'PENDING', 'RETURNED', 'IN_REVIEW', 'SCORED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProposalUrgency" AS ENUM ('TINGGI', 'SEDANG', 'RENDAH');

-- CreateEnum
CREATE TYPE "ExpectedOutput" AS ENUM ('REKOMENDASI_KEBIJAKAN', 'NASKAH_AKADEMIK', 'PROTOTIPE_SISTEM', 'DOKUMEN_MASTERPLAN', 'STUDI_KELAYAKAN');

-- CreateEnum
CREATE TYPE "VerificationDecision" AS ENUM ('PASS', 'RETURN', 'REJECT');

-- CreateEnum
CREATE TYPE "ResearchField" AS ENUM ('EKONOMI_PEMBANGUNAN', 'TATA_KELOLA_PEMERINTAHAN', 'SOSIAL_BUDAYA', 'INOVASI_TEKNOLOGI');

-- CreateEnum
CREATE TYPE "ExecutionScheme" AS ENUM ('SWAKELOLA', 'PENUNJUKAN_LANGSUNG', 'E_KATALOG', 'TENDER');

-- CreateEnum
CREATE TYPE "PriorityCategory" AS ENUM ('PRIORITAS_UTAMA', 'PRIORITAS_KEDUA', 'TIDAK_PRIORITAS');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'REJECTED', 'REVISION_REQUIRED');

-- CreateEnum
CREATE TYPE "StudyStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'FINAL');

-- CreateEnum
CREATE TYPE "RecommendationImpact" AS ENUM ('STRATEGIS_DAERAH', 'SEKTORAL', 'OPERASIONAL');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "PolicyTargetType" AS ENUM ('DRAFT_PERBUP', 'DRAFT_PERDA', 'SE_BUPATI', 'SOP_LAYANAN', 'RENCANA_AKSI_DAERAH', 'PETUNJUK_TEKNIS');

-- CreateEnum
CREATE TYPE "SignedDocumentType" AS ENUM ('POLICY_RECOMMENDATION', 'KAK_DOCUMENT');

-- CreateEnum
CREATE TYPE "TteStatus" AS ENUM ('VALID', 'REVOKED');

-- CreateTable
CREATE TABLE "opds" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Badan / Dinas Daerah',
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nip" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'OPD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "opdId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "source" "ProposalSource" NOT NULL DEFAULT 'OPD_PROPOSAL',
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "problemStatement" TEXT NOT NULL,
    "urgencyReason" TEXT NOT NULL,
    "strategicImpact" TEXT,
    "urgencyLevel" "ProposalUrgency" NOT NULL DEFAULT 'TINGGI',
    "expectedOutput" "ExpectedOutput" NOT NULL DEFAULT 'REKOMENDASI_KEBIJAKAN',
    "estimatedBudget" DECIMAL(18,2),
    "estimatedDuration" INTEGER DEFAULT 3,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "opdId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_documents" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "fileUrl" TEXT,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_verifications" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "isProblemClear" BOOLEAN NOT NULL DEFAULT true,
    "isNotDuplicated" BOOLEAN NOT NULL DEFAULT true,
    "isUrgencyRelevant" BOOLEAN NOT NULL DEFAULT true,
    "isStrategicAligned" BOOLEAN NOT NULL DEFAULT true,
    "isResearchFeasible" BOOLEAN NOT NULL DEFAULT true,
    "isBudgetFeasible" BOOLEAN NOT NULL DEFAULT true,
    "isDataAdequate" BOOLEAN NOT NULL DEFAULT true,
    "decision" "VerificationDecision" NOT NULL DEFAULT 'PASS',
    "verificationNotes" TEXT NOT NULL,
    "verifiedById" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_revisions" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "revisionNotes" TEXT NOT NULL,
    "returnedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_scorings" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "visionAlignmentScore" DOUBLE PRECISION NOT NULL,
    "urgencyScore" DOUBLE PRECISION NOT NULL,
    "budgetFeasibilityScore" DOUBLE PRECISION NOT NULL,
    "dataReadinessScore" DOUBLE PRECISION NOT NULL,
    "totalWeightedScore" DOUBLE PRECISION NOT NULL,
    "researchField" "ResearchField" NOT NULL DEFAULT 'EKONOMI_PEMBANGUNAN',
    "executionScheme" "ExecutionScheme" NOT NULL DEFAULT 'SWAKELOLA',
    "priorityCategory" "PriorityCategory" NOT NULL DEFAULT 'PRIORITAS_UTAMA',
    "evaluationNotes" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_scorings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kepala_approvals" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "decision" "ApprovalDecision" NOT NULL DEFAULT 'APPROVED',
    "approvedBudget" DECIMAL(18,2),
    "fiscalYear" INTEGER,
    "finalExecutionScheme" "ExecutionScheme",
    "notes" TEXT,
    "approvedById" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kepala_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_studies" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "allocatedBudget" DECIMAL(18,2) NOT NULL,
    "executionScheme" "ExecutionScheme" NOT NULL DEFAULT 'SWAKELOLA',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "StudyStatus" NOT NULL DEFAULT 'PLANNING',
    "cooperationDocName" TEXT,
    "cooperationDocUrl" TEXT,
    "finalReportName" TEXT,
    "finalReportUrl" TEXT,
    "finalReportSummary" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_working_documents" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileSize" TEXT,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_working_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kak_documents" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "scopeAndMethodology" TEXT NOT NULL,
    "targetOutput" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "finalizedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kak_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rka_items" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "totalPrice" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rka_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_team_members" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_recommendations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "executiveSummary" TEXT NOT NULL,
    "keyFindings" TEXT NOT NULL,
    "policyActions" TEXT NOT NULL,
    "targetPolicyType" "PolicyTargetType" NOT NULL DEFAULT 'DRAFT_PERBUP',
    "impactLevel" "RecommendationImpact" NOT NULL DEFAULT 'STRATEGIS_DAERAH',
    "targetOpdNames" TEXT,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'DRAFT',
    "documentUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "signedById" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_signature_logs" (
    "id" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "documentType" "SignedDocumentType" NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentTitle" TEXT NOT NULL,
    "documentCode" TEXT,
    "signerId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerNip" TEXT,
    "signerRole" TEXT NOT NULL DEFAULT 'Kepala BRIDA',
    "signatureHash" TEXT NOT NULL,
    "verificationUrl" TEXT NOT NULL,
    "status" "TteStatus" NOT NULL DEFAULT 'VALID',
    "notes" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "digital_signature_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_follow_ups" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "utilizationType" TEXT NOT NULL,
    "utilizationSummary" TEXT NOT NULL,
    "satisfactionRating" INTEGER NOT NULL DEFAULT 5,
    "feedbackNotes" TEXT,
    "submittedById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "opds_code_key" ON "opds"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_nip_key" ON "users"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_code_key" ON "proposals"("code");

-- CreateIndex
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

-- CreateIndex
CREATE INDEX "proposals_source_idx" ON "proposals"("source");

-- CreateIndex
CREATE INDEX "proposals_opdId_idx" ON "proposals"("opdId");

-- CreateIndex
CREATE INDEX "proposals_createdById_idx" ON "proposals"("createdById");

-- CreateIndex
CREATE INDEX "proposals_createdAt_idx" ON "proposals"("createdAt");

-- CreateIndex
CREATE INDEX "proposal_documents_proposalId_idx" ON "proposal_documents"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_verifications_proposalId_key" ON "admin_verifications"("proposalId");

-- CreateIndex
CREATE INDEX "proposal_revisions_proposalId_idx" ON "proposal_revisions"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_scorings_proposalId_key" ON "proposal_scorings"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "kepala_approvals_proposalId_key" ON "kepala_approvals"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "research_studies_proposalId_key" ON "research_studies"("proposalId");

-- CreateIndex
CREATE INDEX "research_studies_status_idx" ON "research_studies"("status");

-- CreateIndex
CREATE INDEX "research_studies_fiscalYear_idx" ON "research_studies"("fiscalYear");

-- CreateIndex
CREATE INDEX "research_working_documents_studyId_idx" ON "research_working_documents"("studyId");

-- CreateIndex
CREATE UNIQUE INDEX "kak_documents_studyId_key" ON "kak_documents"("studyId");

-- CreateIndex
CREATE INDEX "rka_items_studyId_idx" ON "rka_items"("studyId");

-- CreateIndex
CREATE INDEX "research_team_members_studyId_idx" ON "research_team_members"("studyId");

-- CreateIndex
CREATE UNIQUE INDEX "policy_recommendations_code_key" ON "policy_recommendations"("code");

-- CreateIndex
CREATE INDEX "policy_recommendations_status_idx" ON "policy_recommendations"("status");

-- CreateIndex
CREATE INDEX "policy_recommendations_studyId_idx" ON "policy_recommendations"("studyId");

-- CreateIndex
CREATE INDEX "policy_recommendations_impactLevel_idx" ON "policy_recommendations"("impactLevel");

-- CreateIndex
CREATE UNIQUE INDEX "digital_signature_logs_certificateNumber_key" ON "digital_signature_logs"("certificateNumber");

-- CreateIndex
CREATE INDEX "digital_signature_logs_certificateNumber_idx" ON "digital_signature_logs"("certificateNumber");

-- CreateIndex
CREATE INDEX "digital_signature_logs_documentType_documentId_idx" ON "digital_signature_logs"("documentType", "documentId");

-- CreateIndex
CREATE INDEX "digital_signature_logs_signerId_idx" ON "digital_signature_logs"("signerId");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_follow_ups_proposalId_key" ON "proposal_follow_ups"("proposalId");

-- CreateIndex
CREATE INDEX "proposal_follow_ups_proposalId_idx" ON "proposal_follow_ups"("proposalId");

-- CreateIndex
CREATE INDEX "proposal_follow_ups_submittedById_idx" ON "proposal_follow_ups"("submittedById");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "opds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "opds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_documents" ADD CONSTRAINT "proposal_documents_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_verifications" ADD CONSTRAINT "admin_verifications_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_verifications" ADD CONSTRAINT "admin_verifications_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_revisions" ADD CONSTRAINT "proposal_revisions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_revisions" ADD CONSTRAINT "proposal_revisions_returnedById_fkey" FOREIGN KEY ("returnedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_scorings" ADD CONSTRAINT "proposal_scorings_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_scorings" ADD CONSTRAINT "proposal_scorings_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kepala_approvals" ADD CONSTRAINT "kepala_approvals_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kepala_approvals" ADD CONSTRAINT "kepala_approvals_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_studies" ADD CONSTRAINT "research_studies_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_studies" ADD CONSTRAINT "research_studies_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_working_documents" ADD CONSTRAINT "research_working_documents_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "research_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kak_documents" ADD CONSTRAINT "kak_documents_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "research_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rka_items" ADD CONSTRAINT "rka_items_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "research_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_team_members" ADD CONSTRAINT "research_team_members_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "research_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_recommendations" ADD CONSTRAINT "policy_recommendations_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "research_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_recommendations" ADD CONSTRAINT "policy_recommendations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_recommendations" ADD CONSTRAINT "policy_recommendations_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_signature_logs" ADD CONSTRAINT "digital_signature_logs_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_follow_ups" ADD CONSTRAINT "proposal_follow_ups_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_follow_ups" ADD CONSTRAINT "proposal_follow_ups_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
