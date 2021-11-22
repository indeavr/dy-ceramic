const express = require("express")
const cors = require("cors");
const myLogger = require("./logger")
const routes = require("./routes")
const ceramic = require("./service/ceramic.js")
const { randomBytes } = require('@stablelib/random');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() })

require('dotenv').config()

const index = express()

// middlewares
index.use(cors())
index.use(express.json()); // Used to parse JSON bodies
// index.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies

// for parsing multipart/form-data

index.use(myLogger)

// const seed = randomBytes(32)
// const seed = randomBytes(32)

ceramic.init(JSON.parse(process.env.SEED));
// routes
index.use('/', routes);

index.listen(process.env.PORT, () => {
    console.log(`DY Server app listening at :${process.env.PORT}`)
})
