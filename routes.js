const { Router } = require('express')
const router = Router()
const { addProposition, getPropositions, getServerDID, getJsonModel, addCollection, getAllCollections } = require("./service")
const { generateMetadata } = require("./metadata-generator");
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() })

router.get('/api/server-did', getServerDID);
router.get('/api/json-model', getJsonModel);

router.get('/api/collection', getAllCollections);
router.post('/api/collection', addCollection);

router.get('/api/proposition', getPropositions);
router.post('/api/proposition', addProposition);

router.post('/api/mint', upload.single("asset"), generateMetadata);

module.exports = router;
