const fs = require('fs');
const path = require('path');
const { extractDocumentText } = require('../../src/services/documentTextExtractor');

const seedBaselineDocuments = async (prisma) => {
  console.log(`\nSeeding Baseline Documents (Kabupaten Mimika)...`);

  const manifestPath = path.resolve(__dirname, '../../baseline-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.warn(`[WARN] baseline-manifest.json not found at ${manifestPath}`);
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN_BRIDA' },
  }) || await prisma.user.findFirst();

  if (!adminUser) {
    throw new Error('Admin user not found. Please run userSeeder first.');
  }

  for (const doc of manifest.documents) {
    const fullFilePath = path.resolve(__dirname, '../../', doc.relativePath);
    const fileExists = fs.existsSync(fullFilePath);

    if (fileExists && doc.status === 'AVAILABLE') {
      const stats = fs.statSync(fullFilePath);
      console.log(`- Processing AVAILABLE baseline: ${doc.code} - ${doc.title} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);

      // Check if already extracted in DB
      const existingDoc = await prisma.externalSource.findUnique({
        where: { code: doc.code },
        include: { currentVersion: { include: { document: true } } },
      });

      let extraction;
      if (
        existingDoc?.currentVersion?.document?.extractionStatus === 'COMPLETED' &&
        existingDoc.currentVersion.document.fileSize === stats.size &&
        existingDoc.currentVersion.document.extractedText
      ) {
        extraction = {
          text: existingDoc.currentVersion.document.extractedText,
          pageCount: existingDoc.currentVersion.document.pageCount,
          checksum: existingDoc.currentVersion.document.checksum,
          fileSize: existingDoc.currentVersion.document.fileSize,
        };
      } else {
        extraction = await extractDocumentText(fullFilePath, 'application/pdf', doc.filename);
      }

      // 1. Upsert ExternalSource
      const source = await prisma.externalSource.upsert({
        where: { code: doc.code },
        update: {
          title: doc.title,
          description: doc.notes || doc.title,
          sourceType: doc.sourceType || 'PLANNING_DOCUMENT',
          institution: doc.source,
          status: 'ACTIVE',
        },
        create: {
          code: doc.code,
          title: doc.title,
          description: doc.notes || doc.title,
          sourceType: doc.sourceType || 'PLANNING_DOCUMENT',
          institution: doc.source,
          status: 'ACTIVE',
          createdById: adminUser.id,
        },
      });

      // 2. Upsert ExternalSourceVersion (v1)
      const version = await prisma.externalSourceVersion.upsert({
        where: {
          externalSourceId_versionNumber: {
            externalSourceId: source.id,
            versionNumber: 1,
          },
        },
        update: {
          effectiveDate: new Date(`${doc.year}-01-01`),
          description: `Versi resmi baseline: ${doc.title}`,
        },
        create: {
          externalSourceId: source.id,
          versionNumber: 1,
          effectiveDate: new Date(`${doc.year}-01-01`),
          description: `Versi resmi baseline: ${doc.title}`,
          uploadedById: adminUser.id,
        },
      });

      // 3. Upsert ExternalSourceDocument
      await prisma.externalSourceDocument.upsert({
        where: { sourceVersionId: version.id },
        update: {
          fileName: doc.filename,
          originalName: doc.filename,
          filePath: doc.relativePath.replace(/\\/g, '/'),
          mimeType: 'application/pdf',
          fileSize: stats.size,
          checksum: extraction.checksum,
          extractedText: extraction.extractedText,
          extractionStatus: extraction.extractionStatus,
          extractionError: extraction.extractionError,
          pageCount: extraction.pageCount,
        },
        create: {
          sourceVersionId: version.id,
          fileName: doc.filename,
          originalName: doc.filename,
          filePath: doc.relativePath.replace(/\\/g, '/'),
          mimeType: 'application/pdf',
          fileSize: stats.size,
          checksum: extraction.checksum,
          extractedText: extraction.extractedText,
          extractionStatus: extraction.extractionStatus,
          extractionError: extraction.extractionError,
          pageCount: extraction.pageCount,
        },
      });

      // 4. Link currentVersionId
      await prisma.externalSource.update({
        where: { id: source.id },
        data: { currentVersionId: version.id },
      });

      console.log(`  [OK] Saved & linked: ${doc.code} -> Version ${version.versionNumber} (${extraction.pageCount || 1} pages extracted)`);
    } else {
      console.log(`- Recording NOT_FOUND/NOT_AVAILABLE baseline: ${doc.code} - ${doc.title}`);

      // Record metadata only, without fake filePath or fake file record
      await prisma.externalSource.upsert({
        where: { code: doc.code },
        update: {
          title: doc.title,
          description: `[STATUS: NOT_FOUND] ${doc.notes || 'Dokumen fisik belum tersedia secara daring.'}`,
          sourceType: doc.sourceType || 'PLANNING_DOCUMENT',
          institution: doc.source,
          status: 'DRAFT',
        },
        create: {
          code: doc.code,
          title: doc.title,
          description: `[STATUS: NOT_FOUND] ${doc.notes || 'Dokumen fisik belum tersedia secara daring.'}`,
          sourceType: doc.sourceType || 'PLANNING_DOCUMENT',
          institution: doc.source,
          status: 'DRAFT',
          createdById: adminUser.id,
        },
      });
      console.log(`  [OK] Metadata recorded as DRAFT (No fake file created)`);
    }
  }

  console.log(`\nBaseline documents seeding completed.`);
};

module.exports = { seedBaselineDocuments };
