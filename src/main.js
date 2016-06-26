(function(root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(require('jquery'));
  } else {
    root.wdcwConfig = factory(root.jQuery);
  }
} (this, function ($) {
  var wdcwConfig = {tables: {}};

  wdcwConfig.name = 'Instagram';

  var buildApiFrom;

  /**
   * Run during initialization of the web data connector.
   *
   * @param {string} phase
   *   The initialization phase. This can be one of:
   *   - tableau.phaseEnum.interactivePhase: Indicates when the connector is
   *     being initialized with a user interface suitable for an end-user to
   *     enter connection configuration details.
   *   - tableau.phaseEnum.gatherDataPhase: Indicates when the connector is
   *     being initialized in the background for the sole purpose of collecting
   *     data.
   *   - tableau.phaseEnum.authPhase: Indicates when the connector is being
   *     accessed in a stripped down context for the sole purpose of refreshing
   *     an OAuth authentication token.
   */
  wdcwConfig.setup = function setup(phase) {
    // You may need to perform set up or other initialization tasks at various
    // points in the data connector flow. You can do so here.
    switch (phase) {
      case 'interactive':
        // Perform set up tasks that relate to when the user will be prompted to
        // enter information interactively.
        wdcwConfig._setUpInteractivePhase.call(this);
        break;

      case 'gatherData':
        // Perform set up tasks that should happen when Tableau is attempting to
        // retrieve data from your connector (the user is not prompted for any
        // information in this phase.
        break;

      case 'auth':
        // Perform set up tasks that should happen when Tableau is attempting to
        // refresh OAuth authentication tokens.
        break;
    }

    // Always return a resolved promise when initialization tasks are complete.
    // This can be especially useful when initialization tasks are asynchronous
    // in nature.
    return Promise.resolve();
  };

  /**
   * Actual interactive phase setup code. Mostly separated for testability, but
   * tests still TBD...
   */
  wdcwConfig._setUpInteractivePhase = function setUpInteractivePhase() {
    var connector = this,
        $modal = $('div.modal'),
        $form = $('form'),
        recoverFromError = function recoverFromError() {
          $modal.find('h3').text('There was a problem authenticating.');
          setTimeout(function () {
            $modal.modal('hide');
          }, 2000);
        },
        params,
        uri;

    // Listen for oauth flow indicators from Instagram.
    uri = new URI(window.location.href);
    if (uri.hasQuery('code') && uri.hasQuery('state')) {
      params = uri.search(true);

      // Pop a modal indicating that we're attempting to authenticate.
      $modal.modal('show');

      // Validate the provided state.
      $.ajax({url: '/validate?state=' + params.state})
        .then(function stateValidated() {
          return $.ajax({url: '/tokenize?code=' + params.code})
        })
        .then(function accessTokenRetrieved(response) {
          // Set the connection password to the returned token value.
          connector.setPassword(response.access_token);
          $('#password').val(response.access_token).change();

          // Push a window history change so Tableau remembers the bare URL
          // as the connection location, not the one that includes a "code"
          // param as returned by Instagram during initial authorization.
          window.history.pushState({}, '', uri.protocol() + '://' + uri.authority());

          // Hide the "attempting auth" modal; trigger connection start.
          $modal.modal('hide');
          $('form').submit();
        })
        .fail(recoverFromError);
    }

    // Add a handler to detect the need for and initiate oauth flow.
    $form.submit(function (event) {
      // If connection is attempted and we have no token on hand, then we need
      // to initiate our oauth flow to get it.
      if (!connector.getPassword()) {
        // Prevent the WDCW handler from firing.
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // Save off all existing connection details so that they persist
        // after Instagram redirects back post-authentication.
        connector.setConnectionData({
          User: $('#User').val()
        });

        // Send the user to the Instagram authentication page (for oauth).
        window.location = '/authorize';
      }
    });

    // Reverse submit bindings on the $form element so our handler above is
    // triggered before the main WDCW handler, allowing us to prevent it.
    $._data($form[0], 'events').submit.reverse();
  };

  wdcwConfig.schema = function schema() {
    // Potentially, your connector has a fixed set of tables with pre-specified
    // schemas that you could return like this:
    return Promise.all([
      $.when($.getJSON('./src/schema/media.json'))
    ]);
  };

  wdcwConfig.tables.media = {};
  wdcwConfig.tables.media.getData = function (lastRecord) {
    var user = this.getConnectionData('User') || 'self',
        path = 'users/' + user + '/media/recent',
        apiOptions = {last: lastRecord},
        withOptions = buildAjaxRequestOptionsFrom.call(this, path, apiOptions),
        promise;

    promise = new Promise(function (resolve) {
      var localOptions = withOptions,
          mergedResults = {data: []};

      if (lastRecord) {
        localOptions.data.max_id = token;
      }

      $.ajax(localOptions).then(function (response) {
        mergedResults.data = mergedResults.data.concat(response.data);

        if (response.pagination.next_max_id) {
          // Recursion.
        }
        else {
          resolve(mergedResults);
        }
      });
    });

    return promise;
  };

  wdcwConfig.tables.media.postProcess = function (response) {
    var processedData = [];
    console.log(response);

    response.data.forEach(function shapeData(media) {
      processedData.push({
        id: media.id,
        comment_count: media.comments ? media.comments.count : 0,
        caption_text: media.caption ? media.caption.text : null,
        like_count: media.likes ? media.likes.count : 0,
        link: media.link,
        user_name: media.user.username,
        user_full_name:media.user.full_name,
        user_picture: media.user.profile_picture,
        user_id: media.user.id,
        created_time: moment.unix(media.created_time).format('YYYY-MM-DD HH:mm:ss'),
        media_url: media[media.type + 's'].standard_resolution.url,
        type: media.type,
        location_lat: media.location ? media.location.latitude : null,
        location_lon: media.location ? media.location.longitude : null,
        location_id: media.location ? media.location.id : null,
        location_address: media.location ? media.location.street_address : null,
        location_name: media.location ? media.location.name : null
      });
    });

    // Once you've retrieved your data and shaped it into the form expected,
    // resolve it.
    return Promise.resolve(processedData);
  };

  // You can write private methods for use above like this:

  /**
   * Helper function to build an API endpoint that uses our proxy.
   *
   * @param {string} path
   *   API endpoint path from which to build a full URL.
   *
   * @param {object} opts
   *   Options to inform query parameters and paging.
   */
  buildAjaxRequestOptionsFrom = function buildApiFrom(path, opts) {
    var connector = this,
        url = 'https://api.instagram.com/v1/' + path,
        returnOptions = {data: {}};

    returnOptions.dataType = 'jsonp';
    returnOptions.url = url;
    returnOptions.data.access_token = connector.getPassword();
    returnOptions.data.count = 40;

    // If opts.last was passed, build the config so only newer media is returned.
    if (opts.last) {
      returnOptions.data.min_id = opts.last;
    }

    return returnOptions;
  };

  return wdcwConfig;
}));
