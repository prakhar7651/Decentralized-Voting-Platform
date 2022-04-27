const { createUser } = require("./user")
const mongoose = require('mongoose')

const URL = 'mongodb://localhost:27017'
const dbName = 'crypto'

const _candidateSchema = new mongoose.Schema({
    name: String,
    phone_no : Number,
    img_loc : String
})
const candidateModel = mongoose.model('candidate' , _candidateSchema)

class Candidate{
    constructor(_name , _phone , _img_loc){
        this.name = _name
        this.phone_no = _phone
        this.img_loc = _img_loc
    }
    async initialize(){
        this.user = await createUser(this.phone_no)['user']
        const present = await checkCandidate(this.phone_no)
        if(!present){
            const candidate = new candidateModel({
                name : this.name,
                phone_no : this.phone_no,
                img_loc : this.img_loc
            })
            candidate.save((err , saved_candidate) => {
                if(err)
                    console.log(err)
                else
                    console.log('Candidate Saved')
            })
        }
    }
    getPubKey(){
        return this.user.getPubKey()
    }
}

async function checkCandidate(_phone){
    return new Promise( (resolve , reject) => {
        mongoose.connect(URL + '/' + dbName)
        candidateModel.find({phone_no : _phone} , {} , (err , candidates) => {
            if(err)
                reject
            else{
                resolve(candidates.length != 0)
            }
        })
    })
}

async function getCandidates(){
    return new Promise( (resolve , reject) => {
        mongoose.connect(URL + '/' + dbName)
        candidateModel.find({} , {} , (err , candidates) => {
            if(err)
                reject
            else
                resolve(candidates)
        })
    })
}

module.exports.Candidate = Candidate
module.exports.checkCandidate = checkCandidate
module.exports.getCandidates = getCandidates