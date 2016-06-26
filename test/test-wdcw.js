'use strict';

var mockery = require('mockery'),
    assert = require('assert'),
    sinon = require('sinon'),
    jQuery = require('../bower_components/jquery/dist/jquery.js')(require('jsdom').jsdom().parentWindow),
    wdcwFactory = require('../src/main.js'),
    tableau = require('./util/tableau.js'),
    connector = require('./util/connector.js'),
    wdcwConfig;

describe('instagram-connector:setup', function describesConnectorSetup() {

  beforeEach(function connectorSetupBeforeEach() {
    wdcwConfig = require('../src/main.js');
  });

  it('resolves during interactive phase', function connectorSetupInteractive(done) {
    // If available, ensure the setup phase resolves during interaction.
    if (wdcwConfig.hasOwnProperty('setup')) {
      wdcwConfig.setup.call(connector, tableau.phaseEnum.interactivePhase)
        .then(function () {
          done();
        });
    }
    else {
      done();
    }
  });

  it('resolves during auth phase', function connectorSetupAuth(done) {
    // If available, ensure setup phase resolves during authentication
    if (wdcwConfig.hasOwnProperty('setup')) {
      wdcwConfig.setup.call(connector, tableau.phaseEnum.authPhase)
        .then(function (){
          done();
        });
    }
    else {
      done();
    }
  });

  it('resolves during data gathering phase', function connectorSetupData(done) {
    // If available, ensure the setup phase resolves during data gathering.
    if (wdcwConfig.hasOwnProperty('setup')) {
      wdcwConfig.setup.call(connector, tableau.phaseEnum.gatherDataPhase)
        .then(function () {
          done();
        });
    }
    else {
      done();
    }
  });

});

describe('instagram-connector:schema', function describesConnectorColumnHeaders() {
  beforeEach(function connectorColumnHeadersBeforeEach() {
    // Here's how you might stub or mock various jQuery methods.
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });
    sinon.stub(jQuery, 'ajax', function (url, cb) {cb();});
    sinon.stub(jQuery, 'getJSON', function (url, cb) {console.error('omg');cb();});
    mockery.registerMock('jquery', jQuery);

    wdcwConfig = require('../src/main.js');
  });

  afterEach(function connectorColumnHeadersAfterEach() {
    // Don't forget to restore their original implementations after each test.
    jQuery.ajax.restore();
    jQuery.getJSON.restore();
    mockery.deregisterMock('jquery');
    mockery.deregisterAll();
    mockery.resetCache();
    mockery.disable();
  });

  // This test is not very meaningful. You should write actual test logic here
  // and/or in new cases below.
  it('should be tested here', function connectorColumnHeadersTestHere() {
    wdcwConfig.schema.call(connector)
      .then(function (schemaData) {
        // @todo ...
        assert(jQuery.ajax.called || jQuery.getJSON.called);
        assert(Array.isArray(schemaData));
        done();
      });

    //assert(jQuery.ajax.called || jQuery.getJSON.called);
    /*if (registerHeaders.called) {
      assert(Array.isArray(registerHeaders.getCall(0).args[0]));
    }*/
  });

});

describe('instagram-connector:tableData', function describesConnectorTableData() {
  var registerData;

  beforeEach(function connectorTableDataBeforeEach() {
    registerData = sinon.spy();
    sinon.spy(jQuery, 'ajax');
    sinon.spy(jQuery, 'getJSON');
    wdcwConfig = require('../src/main.js');
  });

  afterEach(function connectorTableDataAfterEach() {
    jQuery.ajax.restore();
    jQuery.getJSON.restore();
  });

  // This test is not very meaningful. You should write actual test logic here
  // and/or in new cases below.
  it('should be tested here', function connectorTableDataTestHere() {
    // @todo ...
    /*wdcw.tableData.call(connector, registerData);

    assert(registerData.called || jQuery.ajax.called || jQuery.getJSON.called);
    if (registerData.called) {
      assert(Array.isArray(registerData.getCall(0).args[0]));
    }*/
  });

});

describe('instagram-connector:teardown', function describesConnectorTearDown() {
  var tearDownComplete;

  beforeEach(function connectorTearDownBeforeEach() {
    tearDownComplete = sinon.spy();
    wdcwConfig = require('../src/main.js');
  });

  it('resolves teardown', function connectorTearDown(done) {
    // If available, ensure the completion callback is always called.
    if (wdcwConfig.hasOwnProperty('teardown')) {
      wdcwConfig.teardown.call(connector)
        .then(function () {
          done();
        });
    }
  });

});
