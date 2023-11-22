const _ = require("underscore")

deckOne = [
    'H-1-0', 'H-2-0', 'H-3-0', 'H-4-0', 'H-5-0', 'H-6-0', 'H-7-0', 'H-8-0', 'H-9-0', 'H-10-0', 'H-11-0', 'H-12-0', 'H-13-0',
    'S-1-0', 'S-2-0', 'S-3-0', 'S-4-0', 'S-5-0', 'S-6-0', 'S-7-0', 'S-8-0', 'S-9-0', 'S-10-0', 'S-11-0', 'S-12-0', 'S-13-0',
    'D-1-0', 'D-2-0', 'D-3-0', 'D-4-0', 'D-5-0', 'D-6-0', 'D-7-0', 'D-8-0', 'D-9-0', 'D-10-0', 'D-11-0', 'D-12-0', 'D-13-0',
    'C-1-0', 'C-2-0', 'C-3-0', 'C-4-0', 'C-5-0', 'C-6-0', 'C-7-0', 'C-8-0', 'C-9-0', 'C-10-0', 'C-11-0', 'C-12-0', 'C-13-0',
]

var color = ['H', 'S', 'D', 'C'];
var card = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]


console.log(HighCard(deckOne, color, card))


function GetRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function HighCard(pack, color, card) {

    var poss = [];
    var cardDealNumber = GetRandomInt(1, 3)

    if (cardDealNumber == 1) {
        // Teen 
        color = _.shuffle(color);
        var number = card[GetRandomInt(0, card.length - 1)]
        card.splice(card.indexOf(number), 1);


        for (var i = 0; i < 3; i++) {
            poss.push(color[i] + "-" + number + "-0");
        }

    } else if (cardDealNumber == 2) {
        // Normal Ron 

        var number = card[GetRandomInt(0, card.length - 3)]


        for (var i = 0; i < 3; i++) {
            if (typeof card[number] == 'undefined')
                number = 0

            var c = color[GetRandomInt(0, color.length - 1)]

            poss.push(c + "-" + card[number] + "-0");
            number++;

        }

    } else if (cardDealNumber == 3) {
        // Color Ron 
        console.log("Same COLOR RON ", card)
        var c = color[GetRandomInt(0, color.length - 1)]

        var number = card[GetRandomInt(0, card.length - 3)]
        card.splice(card.indexOf(number), 3)

        console.log("Same COLOR RON card ", card)


        for (var i = 0; i < 3; i++) {

            poss.push(c + "-" + number + "-0");
            number++;

        }


    } else if (cardDealNumber == 4) {
        // Normal COLOR 
        var c = color[GetRandomInt(0, color.length - 1)]
        color.splice(color.indexOf(c), 1);

        for (var i = 0; i < 3; i++) {
            if (typeof card[number] == 'undefined')
                number = 0

            var number = card[GetRandomInt(0, card.length - 1)]

            console.log("number ", number)
            console.log("card[number] ", card)
            poss.push(c + "-" + number + "-0");
            card.splice(card.indexOf(number), 1);
        }


        console.log("poss ", poss)

    } else {

        // pair 
        console.log("Pair ")
        var number = card[GetRandomInt(0, card.length - 3)]
        card.splice(card.indexOf(number), 1)

        for (var i = 0; i < 3; i++) {
            if (typeof card[number] == 'undefined')
                number = 0

            if (i == 2) {
                number = card[GetRandomInt(0, card.length - 3)]
                card.splice(card.indexOf(number), 1)
            }

            var c = color[GetRandomInt(0, color.length - 1)]
            color = _.difference(color, [c])

            poss.push(c + "-" + number + "-0");
        }

    }

    var finalcard = [];

    for (var i = 0; i < poss.length; i++) {
        if (pack.indexOf(poss[i]) != -1) {
            finalcard.push(poss[i]);
            pack.splice(pack.indexOf(poss[i]), 1);
        }
    }


    return _.flatten(finalcard)

}



