const recommendationService = require('../services/recommendationService');

exports.create = async (req, res, next) => {
  try {
    const { problemId } = req.params;
    const data = req.body;
    
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => '/uploads/' + file.filename);
    }

    const entity = await recommendationService.createOrUpdate(problemId, data, attachments);
    res.status(201).json({ success: true, data: entity });
  } catch (error) {
    next(error);
  }
};

exports.getByProblemId = async (req, res, next) => {
  try {
    const { problemId } = req.params;
    const entity = await recommendationService.getByProblemId(problemId);
    res.status(200).json({ success: true, data: entity });
  } catch (error) {
    next(error);
  }
};
