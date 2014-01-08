var request = require('request')
var assert = require('assert')
var crypto = require('crypto')
var testHelpers = require('./helpers')
baseUrl = 'http://127.0.0.1:4000/'

describe('creating a gateway withdrawal', function(){
  afterEach(function(){
   console.log(this.currentTest.title)
  })
  before(function(done){ 
    function createDeposit(accountId, currency, amount, fn) {
      request.post(baseUrl+'v1/gateway/accounts/'+account.id+'/deposits', {form:{
        currency: currency, cashAmount: amount
      }}, fn)
    }
    user =  null
    account = null

    console.log("Creating a Gateway Withdrawal")
    console.log("-------------------------------------------------------")
    createUser = function(callback){
      username = crypto.randomBytes(256).toString('hex')
      request.post(baseUrl+'v1/gateway/users', {form:{
        name: username, password: username
      }}, callback)
    }

    createUser(function(e,r,body){
      user = JSON.parse(body)
      request.post(baseUrl+'v1/gateway/users/'+user.id+'/gateway_accounts', function(e,r,body) {
        account = JSON.parse(body)
        done()
      })
    })
  })
  it('should create a deposit for a gatewayAccount', function(done){
    request.post(baseUrl+'v1/gateway/accounts/'+account.id+'/deposits', {form:{
      currency: 'BTC', cashAmount: '0.2' 
    }}, function(e,r,body){
      resp = JSON.parse(body)
      assert(resp.success)
      done()
    })
  }) 
  it('should not create a withdrawal without a currency', function(done){
    request.post(baseUrl+'v1/gateway/accounts/'+account.id+'/deposits', {form:{
      cashAmount: '0.2' 
    }}, function(e,r,body){
      resp = JSON.parse(body)
      assert(!resp.success)
      done()
    })
  })
  it('should not create a withdrawal without a cashAmount', function(done){
    request.post(baseUrl+'v1/gateway/accounts/'+account.id+'/deposits', {form:{
      currency: 'BTC'
    }}, function(e,r,body){
      resp = JSON.parse(body)
      assert(!resp.success)
      done()
    })
  })
  it("should update that account's balance upon a withdrawal", function(done){
    balance = null 

    function getBalances(accountId, fn) {
      request.get(baseUrl+'v1/gateway/accounts/'+account.id+'/balances', fn)
    }

    function createDeposit(accountId, currency, amount, fn) {
      request.post(baseUrl+'v1/gateway/accounts/'+account.id+'/deposits', {form:{
        currency: currency, cashAmount: amount
      }}, fn)
    }
    function createWithdrawal(accountId, currency, amount, fn) {
      request.post(baseUrl+'v1/gateway/accounts/'+account.id+'/withdrawals', {form:{
        currency: currency, cashAmount: amount
      }}, fn)
    }
    getBalances(account.id, function(e,r,body){
      createDeposit(account.id, 'BTC', '0.2', function(e,r,body){
        getBalances(account.id, function(e,r,body){
          resp = JSON.parse(body)
          balance = JSON.parse(body)['balances'][0]
          assert.equal(parseFloat(balance.amount), 0.4)
          assert(resp.success)
          createWithdrawal(account.id, 'BTC', '0.3', function(e,r,body){
            assert(!e)
            assert(JSON.parse(body).success)
            getBalances(account.id, function(e,r,body){
              resp = JSON.parse(body)
              balance = JSON.parse(body)['balances'][0]
              assert.equal(parseFloat(balance.amount), 0.1)
              assert(resp.success)
              done()
            })
          })
        })
      })
    })
  })
})