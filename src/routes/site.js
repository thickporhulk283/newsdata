const express = require('express');
const router = express.Router();

const siteController = require('../app/controllers/SiteController');

router.get('/:slug', siteController.getNewsInfor);
router.get('/', siteController.index);

module.exports = router;
