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

    signTransaction(tx , _prKey){
        if(this.getPubKey() !== tx.fromAddr)
            throw new Error('You cannot sign transactions for other wallets')
        const hashTx = tx.calculateHash()
        const prKey = ec.keyFromPrivate(_prKey , 'hex')
        const sig = prKey.sign(hashTx , 'base64')
        // const sig = key.sign(hashTx , 'base64')
        tx.signature = sig.toDER('hex')
    }

    sendMoney(pb_key , amt){
        const tx = new transaction(this.getPubKey() , pb_key , amt)
        // this.signTransaction(tx)
        return tx
    }
}

async function checkUser(_phone){
    
    return new Promise( (resolve , reject) => {
        mongoose.connect(URL + "/" + dbName)
        userModel.find({phone_no : _phone} , {} , (err , users) => {
            if(err)
                reject
            else{
                resolve(users.length != 0)
            }
        })
    })

}

async function getUser(_phone){
    return new Promise ((resolve , resject) => {
        mongoose.connect(URL + '/' + dbName)
        userModel.find({phone_no : _phone} , {} , (err , users) => {
            if(err)
                reject
            else{
                resolve(new User(users[0]['phone_no'] , users[0]['pub_key']))
            }
        })
    })
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
module.exports.checkUser = checkUser
module.exports.getUser = getUser
