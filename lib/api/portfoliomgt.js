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
var debug = require('debug')('bot:api:portfoliomgt');

var util = require('util');
var rp = require('request-promise');

//var InvestmentPortfolioV1 = require('https://investment-portfolio.mybluemix.net/api/v1/portfolios');
//var investmentportfolio = new InvestmentPortfolioV1({
  //username: process.env.CRED_PORTFOLIO_USERID,
  //password: process.env.CRED_PORTFOLIO_PWD
//});


function getHoldingsFromResponse(getHoldingsResp) {
	console.log('get inside getholdingsresponse');
  if( getHoldingsResp.holdings.length > 0 ) {
    return getHoldingsResp.holdings[0].holdings;
  }
  else {
    return [];
  }
}

// Return a promise for calling the IBM Portfolio service
// Input param: Id of an existing portfolio
function getPortfolioHoldingsRP(portfolioId) {
   console.log('get inside getholdingsresponseRP');
  // JTE TODO is there a better way to dynamically construct RESTful path?
  var sURI = util.format("%s/%s/holdings", process.env.URL_GET_PORTFOLIO_HOLDINGS, portfolioId );
   console.log('what is suri ', sURI);
  var options = {
      uri: sURI,
      auth: {
        'user': process.env.CRED_PORTFOLIO_USERID,
        'pass': process.env.CRED_PORTFOLIO_PWD
      },
      json: true // Automatically parses the JSON string in the response
  };
  return rp(options);
}

module.exports = {

	//portfoliocall: function(params, callback) {

	    getPortfolioHoldings: function(portfolioId, callback) {
	     console.log('get inside porfolio holding');
	    // Call Portfolio service (via request-promise) to get holdings
	      getPortfolioHoldingsRP(portfolioId)
	        .then(function (getHoldingsResp) {
	        	  console.log('INSIDE then function', getHoldingsResp);
		          var holdings = getHoldingsFromResponse(getHoldingsResp);
		          console.log('Portfolio', portfolioId, 'raw holdings are:', holdings);

		          // Check whether no holdings
		          if(holdings == null || holdings.length < 1) {
		            //sendTwilioResponse('Your portfolio is empty', res);
		            console.log('Your portfolio is empty');
		            return;  // <------- return ------!
		          }

	          // JTE TODO look at sorting holdings by asset name, size, etc?
	          // Collapse asset names into string list for calling Xignite bulk pricing service
	          /*var strPositions = holdings.reduce(function(arr,holding) {
	            arr.push( util.format(" %s shares of %s", holding.quantity, holding.asset));
	            return arr;
	          }, []).join();

	          var holdingsMsg = "Your portfolio consists of" + strPositions;
	          console.log(holdingsMsg); */
	          //sendTwilioResponse(holdingsMsg, res); 
	        })
	        /*if (err) {
	          console.log('error:', err);
	          callback(err);
	         }
	         else {
	          //callback(null, responsemsg);
	          callback(null, 'returned')
	         }*/
	        .catch(function (err) {
	             //API call failed...
	             console.log("Outer Error", err.message);
	        });
	    },

	   /* getTopPortfolioHoldings: function(params, callback) {
	    	console.log('in TPH');
	    	return('TPH');
	        //callback(null);
	    }*/

	    // Respond to user saying Hello.  Grab the customer record based matching
	    // the supplied phone number as the key
	    welcome: function(params, callback) {


	       // Set default response, if phone # unrecognized
	       //var msg = "Greetings friend. I don\'t believe we\'ve met before";
	       var responseMsg = "Greetings friend. How can I help you";
	       return responseMsg;

	      //sendTwilioResponse(msg, res);  

	    }

	//}
}