const scoringService = require('./scoring.service');
const { successResponse } = require('../../utils/response.util');

class ScoringController {
  async getScoringQueue(req, res, next) {
    try {
      const result = await scoringService.getScoringQueue(req.query);
      return successResponse(
        res,
        'Daftar antrean penelaahan & scoring riset berhasil diambil.',
        result.proposals,
        200,
        result.pagination
      );
    } catch (err) {
      next(err);
    }
  }

  async getScoringDetail(req, res, next) {
    try {
      const proposal = await scoringService.getScoringDetail(req.params.proposalId);
      return successResponse(res, 'Detail instrumen scoring usulan berhasil diambil.', proposal);
    } catch (err) {
      next(err);
    }
  }

  async submitScoring(req, res, next) {
    try {
      const result = await scoringService.submitScoring(req.params.proposalId, req.user, req.body);
      return successResponse(res, result.message, {
        scoring: result.scoring,
        proposal: result.proposal,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ScoringController();
