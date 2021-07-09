
/**
 * Rounds a number with x decimals
 * @param {Number} value Number to round 
 * @param {Number} decimals Amount of decimals
 * @returns {Number} Rounded number
 */
module.exports = (value, decimals) => {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals)
}