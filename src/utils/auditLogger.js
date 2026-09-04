const prisma = require('../config/db');

/**
 * Log an audit entry safely and asynchronously
 * @param {Object} params
 * @param {string|null} params.userId
 * @param {string} params.action - e.g. 'USER_LOGIN', 'USER_CREATED', 'USER_UPDATED', 'USER_STATUS_CHANGED'
 * @param {string} params.entity - e.g. 'User', 'Auth'
 * @param {string|null} [params.entityId]
 * @param {Object|null} [params.metadata] - Non-sensitive metadata only
 */
const logAudit = async (param1, action, entity, entityId = null, metadata = null) => {
  try {
    let userId, act, ent, entId, meta;

    if (typeof param1 === 'object' && param1 !== null && action === undefined) {
      ({ userId = null, action: act, entity: ent, entityId: entId = null, metadata: meta = null } = param1);
    } else {
      userId = param1;
      act = action;
      ent = entity;
      entId = entityId;
      meta = metadata;
    }

    // Sanitizing metadata to ensure sensitive fields are never saved
    let sanitizedMetadata = null;
    if (meta && typeof meta === 'object') {
      const sanitized = { ...meta };
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.jwt;
      delete sanitized.apiKey;
      delete sanitized.secret;
      sanitizedMetadata = sanitized;
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: act,
        entity: ent,
        entityId: entId,
        metadata: sanitizedMetadata,
      },
    });
  } catch (err) {
    // Audit logging should not crash the main application request
    console.error('AuditLog error:', err.message);
  }
};

module.exports = { logAudit };
