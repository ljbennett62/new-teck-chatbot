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
var express = require('express');
var app = express();


//var InvestmentPortfolioV1 = require('https://investment-portfolio.mybluemix.net/api/v1/portfolios');
//var investmentportfolio = new InvestmentPortfolioV1({
  //username: process.env.CRED_PORTFOLIO_USERID,
  //password: process.env.CRED_PORTFOLIO_PWD
//});


function getHoldingsFromResponse(getHoldingsResp) {
	console.log('get inside getholdingsresponse', JSON.stringify(getHoldingsResp));
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

  return rp(options);
  //return options;
  //var holdings = getHoldingsFromResponse(rp(options));
  //console.log('Portfolio', portfolioId, 'raw holdings are:', holdings);

}



module.exports = {

	//portfoliocall: function(params, callback) {
		//conversation.message(newMessage, function(err, response) {
	    getPortfolioHoldings: function(messageResponse, callback) {
	    // Call Portfolio service (via request-promise) to get holdings
	     getPortfolioHoldingsRP(messageResponse)
	       .then(function (getHoldingsResp) {
	        	  console.log('INSIDE then function', JSON.stringify(getHoldingsResp));
		          var holdings = getHoldingsFromResponse(getHoldingsResp);
		          //var holdings = getHoldingsFromResponse(getHoldingsResp);
		          console.log('Portfolio', portfolioId, 'raw holdings are:', holdings);

		          // Check whether no holdings
		          if(holdings == null || holdings.length < 1) {
		            //sendTwilioResponse('Your portfolio is empty', res);
		            console.log('Your portfolio is empty');
		            return;  // <------- return ------!
		          }

	          // JTE TODO look at sorting holdings by asset name, size, etc?
	          // Collapse asset names into string list for calling Xignite bulk pricing service
	          var strPositions = holdings.reduce(function(arr,holding) {
	            arr.push( util.format(" %s shares of %s", holding.quantity, holding.asset));
	            return arr;
	          }, []).join();

	          var holdingsMsg = "Your portfolio consists of"+ strPositions;
	          console.log('holdingmsg is: ', holdingsMsg);
	          messageResponse.output.text = holdingsMsg;
	          console.log('MR2: ', JSON.stringify(messageResponse));
	        
	          //sendTwilioResponse(holdingsMsg, res);
	          return holdingsMsg;
	          
	        })
	        /*if (err) {
        		console.log('error:', err);
        		callback(err);
      		}
      		else {
        		callback(null, holdingMsg);
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