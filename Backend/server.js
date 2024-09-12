const {app} = require("./middlewaresConfig/app");
const {userRouter} = require("./controllers/user.controller")
const {booksRouter} = require("./controllers/books.controller")
const PORT = process.env.PORT || 4000

app.get("/", function (req,res) { res.send("Hello World")});

app.use("/api/auth/", userRouter)
app.use("/api/books", booksRouter)

app.listen(PORT, function () {
    console.log(`server is running on ${PORT}`);
    
})
