const express = require("express");
const app = express ();
const cors = require("cors");
require("./../DB/mongo")

app.use(cors())
app.use(express.json())
app.use("/" + process.env.IMAGES_FOLDER_PATH,express.static("uploads"))


module.exports = { app }