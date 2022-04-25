const { transaction } = require('./transaction')

const mongoose = require('mongoose')
const EC = require('elliptic').ec
const ec = new EC('secp256k1')

const URL = 'mongodb://localhost:27017'
const dbName = 'crypto'

const _userSchema = new mongoose.Schema({
    phone_no : Number,
    pub_key : String
})
const userModel = mongoose.model('user' , _userSchema)



class User{

    constructor(_phone , _pub_key){
        
        this.phone_no = _phone
        this.pub_key = _pub_key
    }
    getPubKey(){
        return this.pub_key
    }

    signTransaction(tx){
        if(this.getPubKey() !== tx.fromAddr)
            throw new Error('You cannot sign transactions for other wallets')
        const hashTx = tx.calculateHash()
        const sig = key.sign(hashTx , 'base64')
        tx.signature = sig.toDER('hex')
    }

    sendMoney(user , amt){
        const tx = new transaction(this.getPubKey() , user.getPubKey() , amt)
        this.signTransaction(tx)
        return tx
    }
}

async function createUser(_phone){

    return new Promise ((resolve , reject) => {

        mongoose.connect(URL + '/' + dbName)

        const res = {
            'newUser' : false,
            'pr_key' : null
        }

        userModel.find({phone_no : _phone} , {} , (err , users) => {
            if(err)
                reject
            else{
                if(users.length == 0){
                    const key = ec.genKeyPair()
                    pub_key = key.getPublic('hex')
                    const _user = new userModel({
                        phone_no : _phone,
                        pub_key : key.getPublic('hex')
                    })
                    _user.save((err , saved_user) => {
                        if(err)
                            console.log(err)
                        else
                            console.log('User Saved')
                    })
                    res['newUser'] = true
                    res['pr_key'] = key.getPrivate('hex')
                }
                else{
                    pub_key = users[0]['pub_key']
                    console.log('User already present')
                }
    
                const user = new User(_phone , pub_key)
                res['user'] = user
                resolve(res)
            }
        })

    })
}

module.exports.User = User
module.exports.createUser = createUser
