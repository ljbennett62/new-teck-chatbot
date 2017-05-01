/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

	'use strict';
	var extend = require('extend');
	var debug = require('debug')('bot:api:portfoliomgt');

	var util = require('util');
	var rp = require('request-promise');
	var portfolioId = 'P1';


module.exports = {

	// Return a promise for calling the IBM Portfolio service
	// Input param: Id of an existing portfolio
	getPortfolioHoldingsRP: function(portfolioID) {
	  // JTE TODO is there a better way to dynamically construct RESTful path?
	  //var sURI = util.format("%s/%s/holdings", process.env.URL_GET_PORTFOLIO_HOLDINGS, portfolioId );
	  var sURI = util.format("%s/%s/holdings", process.env.URL_GET_PORTFOLIO_HOLDINGS, 'P1');
	   console.log('what is suri ', sURI);
	  var options = {
	      uri: sURI,
	      auth: {
	        'user': process.env.CRED_PORTFOLIO_USERID,
	        'pass': process.env.CRED_PORTFOLIO_PWD
	      },
	      json: true // Automatically parses the JSON string in the response
	  };
	  /*if (err) {
        console.log('error:', err);
        callback(err);
      }
      else {
        console.log('in portfoliomgt', JSON.stringify(sURI));
        callback(null, sURI);
      }*/
      //return options;
       return rp(options);
	 }
}