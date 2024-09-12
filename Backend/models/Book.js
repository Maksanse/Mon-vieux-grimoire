const mongoose = require('mongoose')

const BookSchema = mongoose.Schema({
    userId: String,
    title: String,
    imageUrl: String,
    author: String,
    year: Number,
    genre: String,
    ratings: [
        {
            userId: String,
            grade: Number 
        } 
    ],
    averageRating: Number
      
})

const Book = mongoose.model("Book", BookSchema)

module.exports = { Book}