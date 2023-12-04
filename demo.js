

console.log(generateNumber(0,60))


function generateNumber (minRange,maxRange){

    // Generate a random decimal number between 0 (inclusive) and 1 (exclusive)
    const randomDecimal = Math.random().toFixed(2);
    console.log('Random Decimal:', randomDecimal);

    const randomWholeNumber = getRandomInt(minRange, maxRange);
    console.log('Random Whole Number:randomWholeNumber ', randomWholeNumber);

    console.log('Random Whole Number:', randomWholeNumber+parseFloat(randomDecimal));

    return randomWholeNumber+parseFloat(randomDecimal)
}

// Generate a random whole number between a specified range (min and max)
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}