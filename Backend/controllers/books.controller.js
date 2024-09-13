const { get } = require("mongoose");
const { upload } = require("./../middlewares/multer");
const { Book } = require("../models/Book");
const mongoose = require('mongoose');  // Ajouté pour vérifier la validité de l'ObjectId
const express = require("express");
const jwt = require("jsonwebtoken")


const booksRouter = express.Router();
booksRouter.get("/bestrating", getBestRating);
booksRouter.get("/:id", getBookById);
booksRouter.get("/", getBooks);
booksRouter.post("/",checkToken, upload.single("image"), postBooks);
booksRouter.delete("/:id",checkToken, deleteBook);
booksRouter.put("/:id",checkToken, upload.single("image"), putBook);
booksRouter.post("/:id/rating",checkToken, postRating);


async function postRating(req, res) {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).send("Book ID is missing");
        }

        const rating = req.body.rating;
        if (rating == null || isNaN(rating) || rating < 1 || rating > 5) { // Assuming ratings are between 1 and 5
            return res.status(400).send("Invalid rating provided");
        }

        const userId = req.tokenPayload.userId;
        const book = await Book.findById(id);
        if (!book) {
            return res.status(404).send("Book not found");
        }

        const ratingInDb = book.ratings;
        
        // Vérification si l'utilisateur a déjà noté ce livre
        const previousRatingFromCurrentUser = ratingInDb.find((rating) => rating.userId.toString() === userId.toString());
        if (previousRatingFromCurrentUser) {
            return res.status(400).send("You have already rated this book");
        }

        // Ajouter la nouvelle note
        const newRating = { userId: userId, grade: rating };
        ratingInDb.push(newRating);

        // Calculer la nouvelle moyenne des notes
        book.averageRating = calculateAverageRating(ratingInDb);

        // Sauvegarder le livre avec la nouvelle note et la moyenne
        await book.save();

        res.send("Rating Posted");
    } catch (error) {
        console.error("Error while posting rating:", error);
        res.status(500).send("Server error");
    }
}

function calculateAverageRating(ratings) {
    const length = ratings.length;
    const sumOfAllGrades = ratings.reduce((sum, rating) => sum + rating.grade, 0);
    const averageRating = sumOfAllGrades / length;
    return averageRating;
}


async function getBestRating(req,res){
    try{
    const booksWithBestRatings = await Book.find().sort({rating: -1}).limit(3)
    booksWithBestRatings.forEach((book) => {
        book.imageUrl = getImages(book.imageUrl)
    })
    res.send(booksWithBestRatings)
    } catch(e){
        console.error(e)
        res.status(500).send("Error")
    }
    
}


async function putBook(req, res) {
    try {
        const id = req.params.id;
        
        // On récupère directement req.body, pas besoin de JSON.parse()
        const book = req.body; 

        // Trouver le livre par ID
        const bookInDb = await Book.findById(id);
        if (!bookInDb) {
            return res.status(404).send("Livre non trouvé");
        }

        // Vérifier que l'utilisateur qui fait la demande est bien celui qui a créé le livre
        const userIdInDb = bookInDb.userId;
        const userInToken = req.tokenPayload.userId;
        if (userIdInDb !== userInToken) {
            return res.status(403).send("Vous ne pouvez pas modifier le livre de quelqu'un d'autre");
        }

        // Préparer l'objet de mise à jour
        const updatedFields = {};

        // Vérification de chaque champ envoyé
        if (book.title) updatedFields.title = book.title;
        if (book.author) updatedFields.author = book.author;
        if (book.year) updatedFields.year = book.year;
        if (book.genre) updatedFields.genre = book.genre;
        if (req.file) updatedFields.imageUrl = req.file.filename;

        // Si aucun champ n'est fourni dans la requête, on ne fait rien
        if (Object.keys(updatedFields).length === 0) {
            return res.status(400).send("Aucune donnée à mettre à jour");
        }

        // Mettre à jour uniquement les champs fournis
        const updatedBook = await Book.findByIdAndUpdate(id, { $set: updatedFields }, { new: true });

        res.status(200).json(updatedBook); // Renvoie le livre mis à jour
    } catch (error) {
        console.error("Erreur lors de la mise à jour du livre :", error);
        return res.status(500).send("Erreur serveur");
    }
}



async function deleteBook(req,res){
    console.log("token :", req.tokenPayload);
    
    const id = req.params.id;
    try{
        const bookInDb =await Book.findById(id)
        if(bookInDb == null) {
            res.status(404).send("Book not found")
            return;
        }
        const userIdInDb = bookInDb.userId;
        const userInToken = req.tokenPayload.userId
        if(userIdInDb != userInToken){
            res.status(403).send("Vous ne pouvez pas supprimer le livre de quelqu'un d'autre");
            return;
        }
        await Book.findByIdAndDelete(id)
        res.send("Book deleted")
    } catch(e) {
        console.error(e)
        res.status(500).send("Something went wrong")
    }
}


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

function checkToken(req,res,next){
const headers = req.headers;
const authorization = headers.authorization;
if (authorization == null) {
    res.status(401).send("Unauthorized");
    return;
}
const token = authorization.split(" ")[1];
console.log("token :",token);
try {
    const jwtSecret = String(process.env.JWT_SECRET)
   const tokenPayload = jwt.verify(token, jwtSecret)
console.log("results :", tokenPayload);
if(tokenPayload == null){
    res.status(401).send("Unauthorized")
    return;
}
req.tokenPayload = tokenPayload
next();
} catch(e) {
console.error(e);
res.status(401).send("Unauthorized")
}


}

async function postBooks(req, res) {
    const body = req.body;
    const file = req.file;

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
