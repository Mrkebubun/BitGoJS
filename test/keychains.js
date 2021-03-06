//
// Tests for Keychains
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');

var BitGoJS = require('../src/index');
var TestBitGo = require('./lib/test_bitgo');

describe('Keychains', function() {
  var bitgo;
  var keychains;

  before(function(done) {
    bitgo = new TestBitGo();
    bitgo.initializeTestVars();
    keychains = bitgo.keychains();
    bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
      if (err) {
        throw err;
      }
      done();
    });
  });

  describe('Local', function() {
    it('isValid', function() {
      assert.throws(function() { keychains.isValid('') });
      assert.throws(function() { keychains.isValid({}) });
      assert.equal(keychains.isValid({ key: 'hello world' }), false);
      assert.equal(keychains.isValid({ key: 'xpub123123' }), false);
      assert.equal(keychains.isValid({ key: 'xprv123123' }), false);

      assert.equal(keychains.isValid({ key: 'xpub661MyMwAqRbcH5xFjpBfCe74cj5tks4nxE8hSMepNfsMVsBkx8eT1m9mnR1tAMGdbbdsE8yMDcuZ3NgVJbTzCYDiu8rcc3sqLF6vzi9yfTB' }), true);
      assert.equal(keychains.isValid({ key: 'xprv9s21ZrQH143K2hrPzWSx6ZXUbcq6Skc22ZsACrjzx6wae8fV63x9gbixpv89ssBvcYLju8BSbjSVF1q2DM1BnFdhi65fgbYrS5WE9UzZaaw' }), true);
    });

    it('create', function() {
      var seed = BitGoJS.Util.hexToBytes('1234567890');
      assert.equal(keychains.create({ seed: seed }).xprv, 'xprv9s21ZrQH143K2hrPzWSx6ZXUbcq6Skc22ZsACrjzx6wae8fV63x9gbixpv89ssBvcYLju8BSbjSVF1q2DM1BnFdhi65fgbYrS5WE9UzZaaw');
    });
  });

  describe('List', function() {
    it('arguments', function() {
      assert.throws(function() { keychains.list({}, 'invalid'); });
      assert.throws(function() { keychains.list('invalid'); });
      assert.throws(function() { keychains.list('invalid', function() {}); });
    });

    it('all', function(done) {
      keychains.list({}, function(err, keychains) {
        assert.equal(err, null);
        assert.equal(Array.isArray(keychains), true);
        done();
      });
    });
  });

  describe('Get', function() {
    it('arguments', function() {
      assert.throws(function() { keychains.get('invalid'); });
      assert.throws(function() { keychains.get({}, function() {}); });
    });

    it('non existent keychain', function(done) {
      var newKey = keychains.create();
      var options = {
        xpub: newKey.xpub,
      };
      keychains.get(options, function(err, keychain) {
        assert.ok(err);
        done();
      });
    });
  });

  describe('Add', function() {
    it('arguments', function() {
      assert.throws(function() { keychains.create('invalid'); });
      assert.throws(function() { keychains.add(); });
      assert.throws(function() { keychains.add('invalid'); });
      assert.throws(function() { keychains.add({}, 0); });
    });

    describe('public', function() {
      var extendedKey;

      before(function(done) {
        // Generate a new keychain
        extendedKey = keychains.create();

        bitgo.unlock({ otp: bitgo.testUserOTP() }, function(err) {
          assert.equal(err, null);
          done();
        });
      });

      it('add', function(done) {
        var options = {
          xpub: extendedKey.xpub
        };
        keychains.add(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, extendedKey.xpub);
          assert.equal(keychain.path, 'm');
          done();
        });
      });

      it('get', function(done) {
        var options = {
          xpub: extendedKey.xpub,
        };
        keychains.get(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, extendedKey.xpub);
          assert.equal(keychain.path, 'm');
          done();
        });
      });
    });

    describe('private', function() {
      var extendedKey;

      before(function() {
        // Generate a new keychain
        extendedKey = keychains.create();
      });

      it('add', function(done) {
        var options = {
          xpub: extendedKey.xpub,
          encryptedXprv: 'xyzzy'
        };
        keychains.add(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, extendedKey.xpub);
          assert.equal(keychain.path, 'm');
          assert.equal(keychain.encryptedXprv, 'xyzzy');
          done();
        });
      });

      it('get', function(done) {
        var options = {
          xpub: extendedKey.xpub,
        };
        keychains.get(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, extendedKey.xpub);
          assert.equal(keychain.path, 'm');
          assert.equal(keychain.encryptedXprv, 'xyzzy');
          done();
        });
      });
    });
  });

  describe('Update', function() {
    var newKey;

    before(function() {
      newKey = keychains.create();
    });

    it('arguments', function() {
      assert.throws(function() { keychains.get('invalid'); });
      assert.throws(function() { keychains.get({}, function() {}); });
    });

    it('non existent keychain', function(done) {
      var options = {
        xpub: newKey.xpub,
      };
      keychains.get(options, function(err, keychain) {
        assert.ok(err);
        done();
      });
    });

    it('update ', function(done) {
      var options = {
        xpub: newKey.xpub,
      };
      keychains.add(options, function(err, keychain) {
        assert.equal(err, null);
        assert.equal(keychain.xpub, newKey.xpub);
        assert.equal(keychain.path, 'm');

        options.label = 'new label';
        options.encryptedXprv = 'abracadabra';
        keychains.update(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, newKey.xpub);
          assert.equal(keychain.encryptedXprv, 'abracadabra');
          assert.equal(keychain.path, 'm');
          done();
        });
      });
    });

  });


});
