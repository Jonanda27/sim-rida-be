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

const getAreas = async (req, res, next) => {
  try {
    const result = await masterService.getAllAreas();
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
  getAreas,
};
