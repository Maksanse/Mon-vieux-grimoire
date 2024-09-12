const { get } = require("mongoose");
const { upload } = require("./../middlewares/multer");
const { Book } = require("../models/Book");
const mongoose = require('mongoose');  // Ajouté pour vérifier la validité de l'ObjectId
const express = require("express");

const booksRouter = express.Router();
booksRouter.get("/:id", getBookById);
booksRouter.get("/", getBooks);
booksRouter.post("/", upload.single("image"), postBooks);

async function getBooks(req, res) {
    const books = await Book.find();
    books.forEach(book => {
        book.imageUrl = getImages(book.imageUrl);
    });

    res.send(books);
}

function getImages(fileName) {
    return process.env.PUBLIC_URL + "/" + process.env.IMAGES_FOLDER_PATH + "/" + fileName;
}

async function postBooks(req, res) {
    const body = req.body;
    const file = req.file;
    console.log("file:", file);

    const stringifiedBook = req.body.book;
    const book = JSON.parse(stringifiedBook);
    const filename = req.file.filename;
    book.imageUrl = filename;

    try {
        const result = await Book.create(book);
        res.send({ message: "Book posted", book: result });
    } catch (e) {
        console.error(e);
        res.status(500).send("Something went wrong");
    }
}

async function getBookById(req, res) {
    const id = req.params.id;

    // Vérification si l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send("Invalid ID format");
    }

    try {
        const book = await Book.findById(id);
        if (book == null) {
            res.status(404).send("Book not found");
            return;
        }
        book.imageUrl = getImages(book.imageUrl);
        res.send(book);
    } catch (e) {
        console.error(e);
        res.status(500).send("Something went wrong");
    }
}

module.exports = { booksRouter };
