const express = require('express');
const router = express.Router();

const vrController = require('../app/controllers/VrController');

// Định nghĩa route cho trang VR
router.get('/:slug', vrController.vrtour);
router.get('/', vrController.index);

module.exports = router;
