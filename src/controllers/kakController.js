const kakService = require('../services/kakService');

const createKak = async (req, res, next) => {
  try {
    const { researchId } = req.params;
    const kakData = req.body;

    const result = await kakService.createKak(researchId, kakData);

    res.status(201).json({
      success: true,
      message: 'Draft KAK dan RAB berhasil disimpan',
      data: result,
    });
  } catch (error) {
    if (error.message === 'Usulan penelitian tidak ditemukan' || error.message === 'KAK untuk penelitian ini sudah dibuat sebelumnya') {
      res.status(400);
    }
    next(error);
  }
};

const getKak = async (req, res, next) => {
  try {
    const { researchId } = req.params;
    const result = await kakService.getKakByResearchId(researchId);

    if (!result) {
      res.status(404);
      throw new Error('Draft KAK belum dibuat untuk usulan ini');
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createKak,
  getKak,
};
