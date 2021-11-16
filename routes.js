const { Router } = require('express')
const router = Router()
const { addUser, getUser, getServerDID, getJsonModel, addCollection,getAllCollections } = require("./service")

router.get('/api/server-did', getServerDID);
router.get('/api/json-model', getJsonModel);

router.get('/api/collection', getAllCollections);
router.post('/api/collection', addCollection);

module.exports = router;
