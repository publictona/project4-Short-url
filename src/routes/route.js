const express = require('express')
const router = express.Router()
const urlController = require('../Controller/urlController')


//# URL route handler
router.post('/url/shorten',urlController.URLshorten)
router.get('/:urlCode',urlController.redirection)

module.exports = router
