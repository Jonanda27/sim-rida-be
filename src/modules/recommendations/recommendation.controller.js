const recommendationService = require('./recommendation.service');
const { successResponse } = require('../../utils/response.util');

class RecommendationController {
  async getAllRecommendations(req, res, next) {
    try {
      const result = await recommendationService.getAllRecommendations(req.query);
      return successResponse(
        res,
        'Daftar rekomendasi kebijakan berhasil diambil.',
        result.recommendations,
        200,
        result.pagination
      );
    } catch (err) {
      next(err);
    }
  }

  async getAvailableStudies(req, res, next) {
    try {
      const studies = await recommendationService.getAvailableStudies();
      return successResponse(
        res,
        'Daftar kajian riset yang siap dibuatkan rekomendasi berhasil diambil.',
        studies
      );
    } catch (err) {
      next(err);
    }
  }

  async getRecommendationById(req, res, next) {
    try {
      const recommendation = await recommendationService.getRecommendationById(req.params.id);
      return successResponse(
        res,
        'Detail rekomendasi kebijakan berhasil diambil.',
        recommendation
      );
    } catch (err) {
      next(err);
    }
  }

  async createRecommendation(req, res, next) {
    try {
      const recommendation = await recommendationService.createRecommendation(
        req.user,
        req.body
      );
      return successResponse(
        res,
        'Draf rekomendasi kebijakan berhasil dibuat.',
        recommendation,
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async updateRecommendation(req, res, next) {
    try {
      const updated = await recommendationService.updateRecommendation(
        req.params.id,
        req.body
      );
      return successResponse(
        res,
        'Draf rekomendasi kebijakan berhasil diperbarui.',
        updated
      );
    } catch (err) {
      next(err);
    }
  }

  async submitRecommendation(req, res, next) {
    try {
      const submitted = await recommendationService.submitRecommendation(req.params.id);
      return successResponse(
        res,
        'Naskah rekomendasi kebijakan berhasil diajukan ke Kepala BRIDA untuk ditelaah dan disahkan.',
        submitted
      );
    } catch (err) {
      next(err);
    }
  }

  async finalizeRecommendation(req, res, next) {
    try {
      const finalized = await recommendationService.finalizeRecommendation(
        req.params.id,
        req.user
      );
      return successResponse(
        res,
        'Naskah rekomendasi kebijakan berhasil disahkan secara resmi oleh Kepala BRIDA.',
        finalized
      );
    } catch (err) {
      next(err);
    }
  }

  async deleteRecommendation(req, res, next) {
    try {
      const result = await recommendationService.deleteRecommendation(req.params.id);
      return successResponse(res, result.message, null);
    } catch (err) {
      next(err);
    }
  }

  async generateAiPolicyBrief(req, res, next) {
    try {
      const { customPrompt } = req.body || {};
      const result = await recommendationService.generateAiPolicyBrief(
        req.params.studyId,
        customPrompt
      );
      return successResponse(
        res,
        'Draf formulasi Policy Brief & Rekomendasi Kebijakan berhasil dirumuskan oleh AI.',
        result
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RecommendationController();
