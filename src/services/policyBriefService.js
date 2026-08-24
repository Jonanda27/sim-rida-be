const prisma = require('../config/db');

const createOrUpdate = async (problemId, data, attachments) => {
  // Check if problem exists
  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) {
    throw Object.assign(new Error('Problem not found'), { statusCode: 404 });
  }

  // Create or Update the entity
  const entity = await prisma.policyBrief.upsert({
    where: { problemId },
    update: { ...data, attachments: attachments.length > 0 ? attachments : undefined },
    create: { ...data, problemId, attachments },
  });

  // Update Problem Status
  await prisma.problem.update({
    where: { id: problemId },
    data: { status: 'POLICY_BRIEF_DRAFT' }
  });

  return entity;
};

const getByProblemId = async (problemId) => {
  const entity = await prisma.policyBrief.findUnique({ where: { problemId } });
  if (!entity) {
    throw Object.assign(new Error('Not found'), { statusCode: 404 });
  }
  return entity;
};

module.exports = {
  createOrUpdate,
  getByProblemId
};
