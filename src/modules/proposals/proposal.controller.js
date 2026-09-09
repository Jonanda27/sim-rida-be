const proposalService = require('./proposal.service');
const { successResponse } = require('../../utils/response.util');

class ProposalController {
  async getAllProposals(req, res, next) {
    try {
      const result = await proposalService.getAllProposals(req.user, req.query);
      return successResponse(res, 'Daftar usulan riset berhasil diambil.', result.proposals, 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  async getProposalById(req, res, next) {
    try {
      const proposal = await proposalService.getProposalById(req.params.id, req.user);
      return successResponse(res, 'Detail usulan riset berhasil diambil.', proposal);
    } catch (err) {
      next(err);
    }
  }

  async createProposal(req, res, next) {
    try {
      const proposal = await proposalService.createProposal(req.user, req.body);
      const message = req.body.isDraft
        ? 'Usulan riset berhasil disimpan sebagai DRAFT.'
        : 'Usulan riset berhasil dikirim ke antrean verifikasi BRIDA.';
      return successResponse(res, message, proposal, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateProposal(req, res, next) {
    try {
      const proposal = await proposalService.updateProposal(req.params.id, req.user, req.body);
      return successResponse(res, 'Data usulan riset berhasil diperbarui.', proposal);
    } catch (err) {
      next(err);
    }
  }

  async submitProposal(req, res, next) {
    try {
      const proposal = await proposalService.submitProposal(req.params.id, req.user);
      return successResponse(res, 'Usulan riset berhasil dikirim ke BRIDA.', proposal);
    } catch (err) {
      next(err);
    }
  }

  async deleteProposal(req, res, next) {
    try {
      const result = await proposalService.deleteProposal(req.params.id, req.user);
      return successResponse(res, result.message);
    } catch (err) {
      next(err);
    }
  }

  async getVerificationInbox(req, res, next) {
    try {
      const result = await proposalService.getVerificationInbox(req.query);
      return successResponse(res, 'Inbox usulan menunggu verifikasi berhasil diambil.', result.proposals, 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  async verifyProposal(req, res, next) {
    try {
      const result = await proposalService.verifyProposal(req.params.id, req.user, req.body);
      return successResponse(res, result.message, result.proposal);
    } catch (err) {
      next(err);
    }
  }

  async submitFollowUp(req, res, next) {
    try {
      const result = await proposalService.submitFollowUp(req.params.id, req.user, req.body);
      return successResponse(res, 'Laporan pemanfaatan rekomendasi berhasil dikirim.', result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProposalController();
