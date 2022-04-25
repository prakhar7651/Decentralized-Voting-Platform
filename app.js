console.log('server-side code running')

const mongoose = require('mongoose')
const express = require('express')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.urlencoded({extended : true}))
app.use(express.static('public'))
app.set('view engine' , 'ejs')

const { blockchain } = require('./src/blockchain')
const { User , createUser} = require('./src/user')

const URL = 'mongodb://localhost:27017'
const dbName = 'crypto'
const PORT = 3000

// mongoose.connect(URL + '/' + dbName)

const candidateSchema = new mongoose.Schema({
    name: String,
    phone_no : Number,
    loc : String
})
const Candidate = mongoose.model('Candidate' , candidateSchema)


let voteCoin = new blockchain()

app.listen(PORT , () => {
    console.log(`App listening at port ${PORT}`)
})

app.route('/')
.get((req , res) => {
    res.sendFile('./public/index.html' , {
        root : __dirname
    });    
})
.post(async (req , res) => {
    createUser(req.body.phoneNumberofUser).then((data) => {
        if(data['newUser']){
            voteCoin.addUser(data['user'])
            console.log('New User Added')
            res.redirect('/verifyPhone/' + req.body.phoneNumberofUser)
        }
        else{
            console.log('Existing user found')
            res.redirect('/dashboard' + req.body.phoneNumberofUser)
        }
    })
})

app.route('/verifyPhone/:phone_no')
.get((req , res) => {
    res.render('auth' , {
        action_path : '/verifyPhone/' + req.params.phone_no
    })
})
.post(async (req , res) => {
    console.log(req.body)
    res.render('privatekey' , {
        action_path : '/dashboard/' + req.params.phone_no
    })
})

app.route('/dashboard/:phone_no')
.get((req , res) => {
    res.render('dashboard' , {
        action_path : '/dashboard/' + req.params.phone_no
    })
})
.post((req , res) => {
    console.log(req.body.dept)
    
    res.redirect('/confirmKey/' + req.params.phone_no + '/pub_key_of_Prakhar')
})

app.route('/confirmKey/:phone_no/:pub_key')
.get((req , res) => {
    res.render('confirmkey' , {
        action_path : '/confirmKey/' + req.params.phone_no + '/' + req.params.pub_key
    })
})
.post((req , res) => {
    if(req.body.butt == 'verify'){
        
        res.sendFile('./public/thankyou.html' , {
            root : __dirname
        })   
    }
    else if(req.body.butt == 'return'){
        res.redirect('/dashboard/' + req.params.phone_no)
    }
})


// tx_list = [
//     Somu.sendMoney(Ananya , 10),
//     Ananya.sendMoney(Somu , 5),
//     Papa.sendMoney(Somu , 30)
// ]

// for(const tx of tx_list){
//     somuCoin.addTransaction(tx)
// }

// somuCoin.minePendingTransactions(Mummy.getPubKey())
// console.log(JSON.stringify(somuCoin , null , 2))
// console.log(somuCoin.isChainValid())

// console.log(somuCoin.getBalOfAddr(Somu.getPubKey()))
// console.log(somuCoin.getBalOfAddr(Ananya.getPubKey()))
// console.log(somuCoin.getBalOfAddr(Mummy.getPubKey()))
// console.log(somuCoin.getBalOfAddr(Papa.getPubKey()))




