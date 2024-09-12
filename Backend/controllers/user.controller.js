const {User} = require("./../models/User")
const bcrypt = require('bcrypt')
const express = require("express")



async function signUp(req,res){
    const body = req.body
    const email = req.body.email;
    const password = req.body.password
    const userInDb = await User.findOne({
        email: email
    })
    if(userInDb != null){
        res.status(400).send("Email déjà utiliser");
        return;
    }
    
    const user = {
        email : email,
        password : hashPasseword(password)
    }
        try{
            await User.create(user)  
    }   catch(e){
        console.error(e);
        res.status(500).send("ERREUR");
        return;
    }
    
    res.send("Sign up")
}

async function logIn(req,res){
    const body = req.body

    const userInDb = await User.findOne({
        email : body.email
    })
    if(userInDb === null) {
        res.status(401).send("Email");
        return;
    }
    const passwordInDb = userInDb.password
    if (!isPassWordCorrect(req.body.password, passwordInDb)) {
        res.status(401).send("Mdp");
        return;
    }
    
    res.send({
        userId: userInDb._id,
        token:"token"
    })
}

function hashPasseword(password){
    console.log("password:",password)
    const salt = bcrypt.genSaltSync(10)
    const hash = bcrypt.hashSync(password, salt);
    console.log("hash", hash);
    
    return hash
}

function isPassWordCorrect(password, hash) {
   const isOkay = bcrypt.compareSync(password, hash)
   return isOkay
}


const userRouter = express.Router()

userRouter.post("/signup", signUp)
userRouter.post("/login", logIn)

module.exports = {userRouter}
