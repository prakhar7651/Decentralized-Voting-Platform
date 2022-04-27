const {block} = require('./block.js')
const {transaction} = require('./transaction')
const mongoose = require('mongoose')
const { getUser, checkUser } = require('./user.js')
const { getCandidates } = require('./candidate.js')

const URL = 'mongodb://localhost:27017'
const dbName = 'crypto'

const blockSchema = new mongoose.Schema({
    timestamp : Date,
    transactions : [{
        'fromAddr' : String,
        'toAddr' : String,
        'amt' : Number,
        'signature' : String
    }],
    prevHash : String,
    nonce : Number,
    hash : String
})
const blockModel = mongoose.model('block' , blockSchema)

const txSchema = new mongoose.Schema({
    fromAddr : String,
    toAddr : String,
    amt : Number,
    signature : String
})
const txModel = new mongoose.model('pendingTransaction' , txSchema)

class blockchain{
    constructor(difficulty = 4 , miningReward = 10 , default_balance = 1){
        this.chain = [this.createGenesisBlock()]
        this.pendingTransactions = []
        this.difficulty = difficulty
        this.miningReward = miningReward
        this.default_balance = default_balance
    }

    async loadPendingTxFromDatabase(){
        mongoose.connect(URL + '/' + dbName)
        return new Promise((resolve , reject) => {
            txModel.find({} , {} , (err , txS) => {
                if(err)
                    reject
                for(const _tx of txS){
                    const tx = new transaction(
                        _tx['fromAddr'],
                        _tx['toAddr'],
                        _tx['amt']
                    )
                    if(tx.fromAddr != null)
                        tx.signature = _tx['signature']
                    this.pendingTransactions.push(tx)
                }
                resolve(this)
            })
        })
    }

    async loadBlocksFromDatabase(){
        mongoose.connect(URL + '/' + dbName)
        return new Promise((resolve , reject) => {
            this.chain = [this.createGenesisBlock()]
            blockModel.find({} , {} , (err , blocks) => {
                if(err)
                    reject
                for(const _blk of blocks){
                    const tx_list = []
                    for (const _tx of _blk['transactions']){
                        const tx = new transaction(
                            _tx['fromAddr'],
                            _tx['toAddr'],
                            _tx['amt']
                        )
                        if(tx.fromAddr != null)
                            tx.signature = _tx['signature']
                        tx_list.push(tx)
                    }
                    const blk = new block(
                        _blk['timestamp'],
                        tx_list,
                        _blk['prevHash'],
                    )
                    blk.nonce = _blk['nonce']
                    blk.hash = _blk['hash']
                    this.chain.push(blk)
                }
                resolve(this)
            })
        })
    }

    async addUser(_user){
        const _tx = new transaction(null , _user.getPubKey() , this.default_balance)
        this.pendingTransactions.push(_tx)
        return new Promise((resolve , reject) => {
            mongoose.connect(URL + '/' + dbName)
            const tx = new txModel({
                fromAddr : _tx.fromAddr,
                toAddr : _tx.toAddr,
                amt : _tx.amt,
            })
            tx.save((err , saved_tx) => {
                if(err)
                    reject
                else{
                    console.log('transaction added in database')
                }
            })
        })
    }

    async addUsers(_users){
        for (const user of _users)
            this.addUser(user)
    }

    createGenesisBlock(){
        return new block(Date.parse('2022-01-01') , [] , '0')
    }

    getLatestBlock(){
        return this.chain[this.chain.length - 1]
    }

    async minePendingTransactions(miningRewardAddr){
        const rewardTx = new transaction(null , miningRewardAddr , this.miningReward)
        this.pendingTransactions.push(rewardTx)

        const blk = new block(Date.now() , this.pendingTransactions, this.getLatestBlock().hash)
        blk.mineBlock(this.difficulty)

        this.chain.push(blk)
        this.pendingTransactions = []

        mongoose.connect(URL + '/' + dbName)

        return new Promise((resolve , reject) => {
            txModel.deleteMany({} , (err) => {
                if(err)
                    console.log(err)
                else
                    console.log('Deleted pending transactions')
            })
            const _blk = new blockModel({
                timestamp : blk.timestamp,
                transactions : blk.transactions,
                prevHash : blk.prevHash,
                nonce : blk.nonce,
                hash : blk.hash
            })
            _blk.save((err , saved_blk) => {
                if(err)
                    reject
                else{
                    console.log('Block added in database')
                    resolve()
                }
            })
        })

    }

    async addTransaction(transaction){
        if(!transaction.fromAddr || !transaction.toAddr)
            throw new Error("Transactions must have from and to address")
        if(!transaction.isValid())
            throw new Error("Cannot add invalid transactions")
        if(transaction.amt <= 0)
            throw new Error("Transaction amount must be greater than 0")    
        
        const bal = this.getBalOfAddr(transaction.fromAddr)
        if(bal < transaction.amt)
            throw new Error("Not enough balance")
        
        const pendingTxForWallet = this.pendingTransactions.filter(tx => tx.fromAddr == transaction.fromAddr)    

        if(pendingTxForWallet.length > 0){
            const totalPendingAmt = pendingTxForWallet.map(tx => tx.amt).reduce((prev , curr) => prev + curr)
            const totalAmt = totalPendingAmt + transaction.amt
            if(totalAmt > bal)
                throw new Error("Pending transactions for this wallet is higher than its balance")
        }
        this.pendingTransactions.push(transaction)
        return new Promise((resolve , reject) => {
            mongoose.connect(URL + '/' + dbName)
            const tx = new txModel({
                fromAddr : transaction.fromAddr,
                toAddr : transaction.toAddr,
                amt : transaction.amt,
                signature : transaction.signature
            })
            tx.save((err , saved_tx) => {
                if(err)
                    reject
                else{
                    console.log('transaction added in database')
                    resolve()
                }
            })
        })
    }

    getBalOfAddr(addr){
        let balance = 0

        for(const block of this.chain){
            for(const trans of block.transactions){
                if(trans.fromAddr == addr)
                    balance -= trans.amt
                if(trans.toAddr == addr)
                    balance += trans.amt
            }
        }
        for(const trans of this.pendingTransactions){
            if(trans.fromAddr == addr)
                    balance -= trans.amt
                if(trans.toAddr == addr)
                    balance += trans.amt
        }
        return balance
    }

    async getTransOfUser(ph_no){
        return new Promise(async (resolve , reject) => {
            if(await checkUser(ph_no)){
                const user = await getUser(ph_no)
                console.log(`Public key of ${ph_no} is ${user.getPubKey()}`)
                const tx_list = this.getTransOfAddr(user.getPubKey())
                resolve(tx_list)
            }
            else
                resolve(null)

        })
    }

    async getResults(){
        mongoose.connect(URL + '/' + dbName)
        return new Promise(async (resolve , reject) => {
            var candidates = await getCandidates()
            candidates = JSON.parse(JSON.stringify(candidates))
            for(var i in candidates){
                const _usr = await getUser(candidates[i]['phone_no'])
                candidates[i]['votes'] = this.getBalOfAddr(_usr.getPubKey())
            }
            resolve(candidates)
        })
    }

    getTransOfAddr(addr){
        const txs = []
        for(const blk of this.chain){
            for(const tx of blk.transactions){
                if(tx.fromAddr == addr || tx.toAddr == addr)
                    txs.push(tx)
            }
        }
        return txs
    }

    isChainValid(){
        const genesis = JSON.stringify(this.createGenesisBlock())
        if(genesis != JSON.stringify(this.chain[0]))
            return false
        for(let i = 1; i < this.chain.length; i++){

            const curr = this.chain[i]
            const prev = this.chain[i - 1]

            if(curr.prevHash != prev.hash)
                return false
            if(!curr.hasValidTransactions())
                return false

            if(curr.calculateHash() !== curr.hash)
                return false

            if(curr.hash.substring(0 , this.difficulty) !== Array(this.difficulty + 1).join('0'))
                return false
        }
        return true
    }
}

module.exports.blockchain = blockchain