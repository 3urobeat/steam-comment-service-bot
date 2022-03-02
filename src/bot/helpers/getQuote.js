/*
 * File: getQuote.js
 * Project: steam-comment-service-bot
 * Created Date: 02.03.2022 16:21:11
 * Author: 3urobeat
 * 
 * Last Modified: 02.03.2022 18:15:30
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
    let selection = randomstring(quotesArr); //get random quote for this iteration

    if (lastQuotes.length > 4) lastQuotes.splice(0, 1) //remove first element from array if we have more than 4 in it
    
    if (lastQuotes.includes(selection)) {
        logger("debug", "getQuote(): The selected quote is in lastQuotes array. Picking again...")
        
        this.getQuote(quotesArr, lastQuotes, (cb) => { 
            quoteCallback(quotesArr, lastQuotes, cb) //call this function again to get a new quote and pass cb to get callback from another execution back to the first one
        })
    } else {
        if (quotesArr.length > 5) lastQuotes.push(selection) //push this comment to lastquotes array to not get it the next 5 times if the quotes.txt has more than 5 quotes

        logger("debug", "getQuote(): Found quote: " + selection)

        quoteCallback(selection)
    }

}