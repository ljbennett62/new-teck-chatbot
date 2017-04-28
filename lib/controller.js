
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

var portfoliomgt = require('./api/portfoliomgt');
var debug = require('debug')('bot:controller');
var extend = require('extend');
var Promise = require('bluebird');
var conversation = require('./api/conversation');
var cloudant = require('./api/cloudant');
var format = require('string-template');
var pick = require('object.pick');
var mcache = require('memory-cache'); // For maintaining state of a Conversation
var twilio = require('twilio'); // Twilio integration
var portfolio_Id = 'P1';

var portfolioHoldingsCall = Promise.promisify(portfoliomgt.getPortfolioHoldingsRP.bind(portfoliomgt));
var sendMessageToConversation = Promise.promisify(conversation.message.bind(conversation));
var getUser = Promise.promisify(cloudant.get.bind(cloudant));
var saveUser = Promise.promisify(cloudant.put.bind(cloudant));
var dbCustomers = cloudant.dbname;
var _messageResponse = {};
var util = require('util');
var rp = require('request-promise');

module.exports = {
  /**
   * Process messages from a channel and send a response to the user
   * @param  {Object}   message.user  The user
   * @param  {Object}   message.input The user meesage
   * @param  {Object}   message.context The conversation context
   * @param  {Function} callback The callback
   * @return {void}dbuser*/
  processMessage: function(_message, res, callback) {
    var message = extend({ input: {text: _message.Body} }, _message);
    //var input = message.text ? { text: message.text } : message.input;
    var user = message.user || message.from;
    //res.json(JSON.stringify(message)); //tried to see if i could write to res
    //res.send(JSON.stringify(message));

    //var phoneNum = "+1 (732) 759-9154";  //phone number
    //var phoneNum = message.user || message.from;  //phone number HARDCODING DURING TESTING
    //phoneNum = phoneNum.replace(/\D/g,''); // strip all non-numeric chars
    //console.log('message: ' + JSON.stringify(message));
    

    debug('1. Process new message: %s.', JSON.stringify(message.input, null, 2));

    //console.log('-----------------');
    //console.log('/SMS Input received: ' + JSON.stringify(message.input, null, 2) + ' from ' + phoneNum );


    getUser(user).then(function(dbUser) {
      var context = dbUser ? dbUser.context : {};
      message.context = context;
      
      // Need to remove this section - need to figure out to make sure program works without it
      return getUser(user).then(function(dbUser) { 
        console.log('did we get here');
      })
      .then(function() {
          debug('2. Send message to Conversation.', JSON.stringify(message, null, 2));
          return sendMessageToConversation(message);
      })


      //3. Process the response from Conversation
      .then(function(messageResponse) {
          debug('3. Conversation response: %s.', JSON.stringify(messageResponse, null, 2));
          // Catch any issue we could have during all the steps above
          //var responseContext = messageResponse.context;
          //console.log('contexttt is:', JSON.stringify(responseContext));
         
          // Extract response returned by Watson
          //var responseMsg = ' ';

          //responseMsg = messageResponse.output.text[0];
          var responseContext = messageResponse.context;
          var firstIntent = (messageResponse.intents != null && messageResponse.intents.length>0 ) ? messageResponse.intents[0] : null;
          var intentName = (firstIntent != null) ? firstIntent.intent : "";
          var intentConfidence = (firstIntent != null) ? firstIntent.confidence : "";

          var firstEntity = (messageResponse.entities != null && messageResponse.entities.length>0 ) ? messageResponse.entities[0] : null;
          var entityName = (firstEntity != null) ? firstEntity.entity : "";
          var entityValue= (firstEntity != null) ? firstEntity.value : "";

          var conversationId = messageResponse.context.conversation_id;
          console.log('Detected intent {' + intentName + '} with confidence ' + intentConfidence);
          console.log('Detected entity {' + entityName + '} with value {' + entityValue + "}");
          console.log('Conversation id = ' + conversationId);
          console.log('Conversation context = ' + JSON.stringify(messageResponse.context));
          _messageResponse = extend({}, messageResponse);
          return intentName;
        })
        .then (function (intentName) {
          if (intentName == "hello") {
           _messageResponse.output.text = 'Greetings';
           return _messageResponse;
          } 
          else
          { 
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
          }
        })
        .then (function (options) {
          var holdings = {};
          if (_messageResponse.output.text == 'Greetings')
             return _messageResponse;
          else
          {
              if( options.holdings.length > 0 ) {
                 holdings = options.holdings[0].holdings;
                 console.log('Portfolio', portfolio_Id, 'raw holdings are:', holdings);
                 // Collapse asset names into string list for calling Xignite bulk pricing service
                 var strPositions = holdings.reduce(function(arr,holding) {
                 arr.push( util.format(" %s shares of %s", holding.quantity, holding.asset));
                    return arr;
                 }, []).join();
                 var holdingsMsg = "Your portfolio consists of" + strPositions;

                 _messageResponse.output.text = holdingsMsg;
              }
              else {
                  holdings = [];
                 _messageResponse.output.text = 'Your portfolio is empty';
              }
          }
          return _messageResponse;
        })

      .then(function(messageToUser) {
         debug('4. Save conversation context.');
         if (!dbUser) {
           dbUser = {_id: user};
         }
         dbUser.context = messageToUser.context;
         return saveUser(dbUser)
         .then(function(data) {
            debug('5. Send response to the user.');
            messageToUser = extend(messageToUser, _message);
            //console.log('messagetouser: ', JSON.stringify(messageToUser));
            callback(null, messageToUser);
         });
      })
    })
      .catch(function (error) {
        debug(error);
        callback(error);
      });
  }
}