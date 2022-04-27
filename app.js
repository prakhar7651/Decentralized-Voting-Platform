console.log('server-side code running')

require('dotenv').config()

const fast2sms = require('fast-two-sms')
const mongoose = require('mongoose')
const express = require('express')
const bodyParser = require('body-parser')
const assert = require('assert')

const app = express()
app.use(bodyParser.urlencoded({extended : true}))
app.use(express.static('public'))
app.set('view engine' , 'ejs')

const { blockchain } = require('./src/blockchain')
const { User , createUser, checkUser, getUser} = require('./src/user')
const { getCandidates } = require('./src/candidate')

const URL = 'mongodb://localhost:27017'
const dbName = 'crypto'
const PORT = 3000


let voteCoin = new blockchain()
voteCoin.loadBlocksFromDatabase().then((data) => {
    voteCoin.loadPendingTxFromDatabase().then((data) => {
        // console.log(JSON.stringify(data , null , 2))
        console.log('Database loaded')
    })
})

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
    checkUser(req.body.phoneNumberofUser).then((data) => {
        if(data){
            console.log('Existing user found')
            res.redirect('/dashboard/' + req.body.phoneNumberofUser)
        }
        else{
            console.log('New user found')
            res.redirect('/verifyPhone/' + req.body.phoneNumberofUser)
        }
    })
})

app.route('/verifyPhone/:phone_no')
.get(async (req , res) => {
    const OTP = 12321
    const t = await fast2sms.sendMessage({
        authorization : process.env.SMS_API_KEY , 
        message : `YOUR OTP IS ${OTP}`,
        numbers : [req.params.phone_no]
    })
    console.log(t)
    res.render('auth' , {
        action_path : '/verifyPhone/' + req.params.phone_no
    })
})
.post(async (req , res) => {
    if(req.body.otp == 12321){
        createUser(req.params.phone_no).then((data) => {
            assert(data['newUser'])
            voteCoin.addUser(data['user'])
            console.log('New user added')
            res.render('privatekey' , {
                action_path : '/dashboard/' + req.params.phone_no,
                pr_key : data['pr_key']
            })
        })
    }
    else
        res.send('INVALID OTP')
})

app.route('/dashboard/:phone_no')
.get(async (req , res) => {
    res.render('dashboard' , {
        action_path : '/dashboard/' + req.params.phone_no,
        candidates : await getCandidates()
    })
})
.post(async (req , res) => {
    getUser(req.body.phone_no).then((data) => {
        res.redirect('/confirmKey/' + req.params.phone_no + '/' + data.getPubKey())
    })
})

app.route('/confirmKey/:phone_no/:pub_key')
.get((req , res) => {
    res.render('confirmkey' , {
        action_path : '/confirmKey/' + req.params.phone_no + '/' + req.params.pub_key
    })
})
.post(async (req , res) => {
    if(req.body.butt == 'verify'){
        const user = await getUser(req.params.phone_no)
        const tx = user.sendMoney(req.params.pub_key , 1)
        user.signTransaction(tx , req.body.pr_key)
        if(!tx.isValid())
            res.render('displayMessage' , {
                message : 'INVALID PRIVATE KEY'
            })
        else if(voteCoin.getBalOfAddr(user.getPubKey()) == 0)
                res.render('displayMessage' , {
                    message : 'Already voted'
                })
            else{
                    voteCoin.addTransaction(tx).then(() => {
                        voteCoin.minePendingTransactions('prakhar is great').then(() => {
                            res.render('displayMessage' , {
                                message : 'Thank you for voting'
                            })
                        })
                    })
            }
    }
    else if(req.body.butt == 'return'){
        res.redirect('/dashboard/' + req.params.phone_no)
    }
})

app.route('/results')
.get(async (req , res) => {
    res.render('results' , {
        candidates : await voteCoin.getResults()
    })
})

voteCoin.getTransOfUser('7651886038').then((data) => {
    console.log(JSON.stringify(data , null , 2))
})
