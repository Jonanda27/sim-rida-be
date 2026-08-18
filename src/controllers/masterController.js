const masterService = require('../services/masterService');

const getSectors = async (req, res, next) => {
  try {
    const result = await masterService.getAllSectors();
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getResearchTypes = async (req, res, next) => {
  try {
    const result = await masterService.getAllResearchTypes();
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSectors,
  getResearchTypes,
};
