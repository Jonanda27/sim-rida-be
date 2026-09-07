const approvalService = require('./approval.service');
const { successResponse } = require('../../utils/response.util');

class ApprovalController {
  async getApprovalInbox(req, res, next) {
    try {
      const result = await approvalService.getApprovalInbox(req.query);
      return successResponse(
        res,
        'Daftar antrean persetujuan usulan berhasil diambil.',
        result.proposals,
        200,
        result.pagination
      );
    } catch (err) {
      next(err);
    }
  }

  async getApprovalDetail(req, res, next) {
    try {
      const proposal = await approvalService.getApprovalDetail(req.params.proposalId);
      return successResponse(res, 'Detail usulan persetujuan berhasil diambil.', proposal);
    } catch (err) {
      next(err);
    }
  }

  async submitApproval(req, res, next) {
    try {
      const result = await approvalService.submitApproval(req.params.proposalId, req.user, req.body);
      return successResponse(res, result.message, {
        approval: result.approval,
        proposal: result.proposal,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ApprovalController();
