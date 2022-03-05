/*
 * File: getQuote.js
 * Project: steam-comment-service-bot
 * Created Date: 02.03.2022 16:21:11
 * Author: 3urobeat
 * 
 * Last Modified: 05.03.2022 14:46:36
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


/**
 * Gets a random quote
 * @param {Array} quotesArr The array of quotes to choose from
 * @param {Array} lastQuotes The last few quotes used
 * @param {function} [callback] Called with `quote` (String) and `stdout` (String) (npm response) parameters on completion
 */
module.exports.getQuote = (quotesArr, lastQuotes, quoteCallback) => {

    var randomstring = arr => arr[Math.floor(Math.random() * arr.length)]; //smol function to get random string from array
    var selection;
    var retry = false;

    if (lastQuotes.length > advancedconfig.lastQuotesSize - 1) lastQuotes.splice(0, 1) //remove first element from array if we have more than 4 in it
    
    //retry selection until selection isn't in lastQuotes array
    do {
        selection = randomstring(quotesArr); //get a random quote

        //Set retry to true and stop this iteration if selection is in lastQuotes array
        if (lastQuotes.includes(selection)) {
            logger("debug", "getQuote(): Selected quote is in lastQuotes array, retrying...")
            retry = true
            return;
        }
        
        retry = false

        //push this comment to lastquotes array to not get it the next lastQuotesSize times if the quotes.txt has more than lastQuotesSize quotes
        if (quotesArr.length > advancedconfig.lastQuotesSize) lastQuotes.push(selection)

        //make callback
        logger("debug", "getQuote(): Found quote: " + selection)
        quoteCallback(selection);
    } while (retry);
}