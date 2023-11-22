const _ = require("underscore")

const fortuna = require('javascript-fortuna');
fortuna.init();

module.exports.valueOfCard = (card) => {

    let cardsDiff =  this.DiffColor(card)

    if(this.PureRonForCheck(cardsDiff)){
        return 5
    }else if(this.TeenForCheck(cardsDiff) ){
        return 4
    }else if(this.RonForCheck(cardsDiff)){
        return 3
    }else if(this.ColorCardCheck(cardsDiff)){
        return 2
    }else if(this.PairForCheck(cardsDiff)){
        return 1
    }
    return 0;
}


module.exports.DiffColor = (card) => {
    let obj = {
        cards: [],
        color: []
    };
    for (let i in card) {
        if (card[i] != null) {
            let d = card[i].split('-');
            obj.cards.push(parseInt(d[1]));
            obj.color.push(d[0]);
        }
    }
    return obj;
}

module.exports.TeenForCheck = (a) => {
    let flag = true;

    let point = _.filter(a.cards, function (num) { return num != 0; });
    let count = 0;

    for (let x in a.color) {

        if (a.color[x] == a.color[0]) {
            count++;
        }
    }

    if (count >= 2) {
        return false
    }

    if (point.length == 1) {
        return flag;
    }

    for (let x in point) {
        if (point[x] != point[0]) {
            flag = false;
            break;
        }
    }

    return flag;
}


module.exports.PureRonForCheck = (a) => {

    let flag = true;

    a.cards.sort(function (e, f) {
        return e - f
    });


    if (a.cards[0] == 1) {
        if ((a.cards.indexOf(12) || a.cards.indexOf(13)) && !a.cards.indexOf(2)) {
            removedCard = a.cards.splice(0, 1);
            a.cards.push(removedCard[0]);
        }
    }


    if (flag == true) {
        for (let x in a.color) {
            if (a.color[x] != a.color[0]) {
                flag = false;
                break;
            }
        }
    }

    if (flag == true) {
        for (let i = 1; i < a.cards.length; i++) {

            if (a.cards[i] - a.cards[i - 1] == 1 || a.cards[i] - a.cards[i - 1] == -12) {


                flag = true;
            } else {
                flag = false;
                break;
            }
        }
    }
    return flag;

}


module.exports.RonForCheck = (a) =>{

    let flag = true;

    a.cards.sort(function (e, f) {
        return e - f
    });


    if (a.cards[0] == 1) {
        if ((a.cards.indexOf(12) || a.cards.indexOf(13)) && !a.cards.indexOf(2)) {
            removedCard = a.cards.splice(0, 1);
            a.cards.push(removedCard[0]);
        }
    }


    // if (flag == true) {
    //     for (let x in a.color) {
    //         if (a.color[x] != a.color[0]) {
    //             flag = false;
    //             break;
    //         }
    //     }
    // }

    if (flag == true) {
        for (let i = 1; i < a.cards.length; i++) {

            if (a.cards[i] - a.cards[i - 1] == 1 || a.cards[i] - a.cards[i - 1] == -12) {


                flag = true;
            } else {
                flag = false;
                break;
            }
        }
    }
    return flag;

}


module.exports.ColorCardCheck = (a) => {
    let flag = true;
    //let point = _.filter(a.cards, function (num) { return num != 0; });
    let count = 0;

    for (let x in a.color) {

        if (a.color[x] == a.color[0]) {
            count++;
        }
    }

    if (count <= 2) {
        return false
    }
  
    return flag;
}

module.exports.PairForCheck = (a) => {
    let flag = true;

    let point = _.filter(a.cards, function (num) { return num != 0; });

    console.log("Point ",point)
    let count = 0

    for (let x in point) {

        if (point[x] == point[0]) {
            count++
        }
    }
    console.log("count ",count)
    if(count < 2){
        return false
    }
    return flag;
}

module.exports.GetRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };