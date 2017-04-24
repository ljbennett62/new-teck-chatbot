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

var pmanagement = require('./api/portfoliomgt');
var debug = require('debug')('bot:controller');
var extend = require('extend');
var Promise = require('bluebird');
var conversation = require('./api/conversation');
var cloudant = require('./api/cloudant');
var format = require('string-template');
var pick = require('object.pick');
var mcache = require('memory-cache'); // For maintaining state of a Conversation

var sendMessageToConversation = Promise.promisify(conversation.message.bind(conversation));
var getUser = Promise.promisify(cloudant.get.bind(cloudant));
var saveUser = Promise.promisify(cloudant.put.bind(cloudant));
var dbCustomers = cloudant.dbname;

module.exports = {
  /**
   * Process messages from a channel and send a response to the user
   * @param  {Object}   message.user  The user
   * @param  {Object}   message.input The user meesage
   * @param  {Object}   message.context The conversation context
   * @param  {Function} callback The callback
   * @return {void}dbuser*/
  processMessage: function(_message, callback) {
    var message = extend({ input: {text: _message.text} }, _message);
    var input = message.text ? { text: message.text } : message.input;
    var user = message.user || message.from;
    

    var phoneNum = "+1 (732) 759-9154";  //phone number
    //var phoneNum = message.user || message.from;  //phone number HARDCODING DURING TESTING
    phoneNum = phoneNum.replace(/\D/g,''); // strip all non-numeric chars
    console.log('message: ' + JSON.stringify(message));
    

    debug('1. Process new message: %s.', JSON.stringify(message.input, null, 2));

    console.log('-----------------');
    console.log('/SMS Input received: ' + JSON.stringify(message.input, null, 2) + ' from ' + phoneNum );


    getUser(user).then(function(dbUser) {
      var context = dbUser ? dbUser.context : {};
      message.context = context;
      
      // Need to remove this section - need to figure out to make sure program works without it
      return getUser(user).then(function(dbUser) { 
        console.log('did we get here');
        debug('1a. input.text: %s, extracted city: %s.');
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

      

      // Update session context, extending session
      //context = messageResponse.context;
      //console.log('extended context for', phoneNum, JSON.stringify(context));

      if( "portfolio_holdings" == intentName ) {
          console.log('*** ACTION: Get portfolio holdings');
          pmanagement.getPortfolioHoldings('test');
          //pmanagement.getPortfolioHoldings(sessionContext.userProfile.portfolio);
      }

      else if( "portfolio_top_holdings" == intentName ) {
          console.log('*** ACTION: Get TOP portfolio holdings');
          pmanagement.getPortfolioHoldings('test');
          //pmanagement.getTopPortfolioHoldings(sessionContext.userProfile.portfolio);
      }

      else if( "hello" == intentName ) {
              console.log('*** ACTION: Respond to welcome message');
              var msg = pmanagement.welcome(messageResponse.context);
              console.log('Welcome response ' + msg );
              messageResponse.output.text = msg;
      }
      return messageResponse;

      })
      .then(function(messageToUser) {
         debug('7. Save conversation context.');
         if (!dbUser) {
           dbUser = {_id: user};
         }
         dbUser.context = messageToUser.context;
         return saveUser(dbUser)
         .then(function(data) {
            debug('7. Send response to the user.');
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