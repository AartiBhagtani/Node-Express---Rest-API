const authMiddleware = require('../middleware/is-auth');
const expect = require('chai').expect;
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

describe('Auth Middleware', function(){
  it('should throw error is no authorization is present', function(){
    const req = {
      get: function(headerName){
        return null;
      }
    };
    // this object here is basically this testing file object which mocha/chai creates.
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw('Not Authenticated')
  })
  
  it('should throw error if authorization header is only one string', function(){
    const req = {
      get: function(headerName){
        return 'xyz';
      }
    };
    // this object here refers to basically this testing file object which mocha/chai creates.
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  })  

  it('should throw error if token cannot be verified', function(){
    const req = {
      get: function(headerName){
        return 'Bearer xyz';
      }
    };
    // this object here refers to basically this testing file object which mocha/chai creates.
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  })

  it('should yield a userId after decoding the token', function(){
    const req = {
      get: function(headerName){
        return 'xyz';
      }
    };
    // stub(pkg_name, method_name)
    sinon.stub(jwt, 'verify');
    // it now replaces jwt verify method with empty funciton
    jwt.verify.returns({userId: 'abc'});

    // overriding the verify method
    // jwt.verify = function() {
    //   return { userId: 'abc'}
    // }
    // but disadvantage is it replaces the function globally.
    authMiddleware(req, {}, ()=>{});
    
    expect(req).to.have.property('userId');
    expect(req).to.have.property('userId', 'abc')
    expect(jwt.verify.called).to.be.true;
    jwt.verify.restore();
  })
});
