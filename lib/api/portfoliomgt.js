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

module.exports = {

	// Get the holdings (assest and shares) in the specified portfolio
    getPortfolioHoldings: function(params, callback) {
        console.log('in PH');
        return('PH');
        //callback(null);
    },

    getTopPortfolioHoldings: function(params, callback) {
    	console.log('in TPH');
    	return('TPH');ol9
        //callback(null);
    },

    // Respond to user saying Hello.  Grab the customer record based matching
    // the supplied phone number as the key
    welcome: function(params, callback) {


       // Set default response, if phone # unrecognized
       //var msg = "Greetings friend. I don\'t believe we\'ve met before";
       var responseMsg = "Greetings friend. How can I help you";
       return responseMsg;
       // Is this phone number unrecognized?
       /*if( sessionContext && sessionContext.userProfile && sessionContext.userProfile.name) {
        // NOTE: assuming only one row since searched on unique key
        msg = "Hi " + sessionContext.userProfile.name + ". How can I help you?";
       }*/

       /*if (err) {
        console.log('error:', err);
        callback(err);
      }
      else {
        console.log('in welcome', JSON.stringify(response));
        callback(null, Responsemsg);*/

       sendTwilioResponse(msg, res);
       //}
    }

}