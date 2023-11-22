
const _ = require("underscore")

function RobotAction(table,card){
    const playerInfo = table.playerInfo[table.turnSeatIndex]

    let totalPlayer =  getPlayingUserInRound(table.playerInfo)  

    let robotCardValue = valueOfCard([ 'C-3-0', 'D-4-0', 'C-11-0' ])

    function GetRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    //robotCardValue 
    // 5 4 3 2 1
    if(potlimit/2 <= potValue && GetRandomInt(0,1) && playStatus == "blind"){
        // Card Seen 
    }


    if(playerInfo.playerStatus == "action"){
        //action Valu Funcation call
        
        //1. check potlimit over ho gaya tha ke nahi
        if(table.chalLimit > table.chalValue*2){
            if(robotCardValue == 5 || robotCardValue == 4 || robotCardValue == 3 ){
                // double chalValue value and action
                //action chalValue 
            }else if(robotCardValue == 2 || robotCardValue == 1){
                //action chalValue Normal
                if(totalPlayer == 2){
                    //Check Pot Limit or turn Number 
                    // Show karna he ya action 

                }else{
                    // action Ya Pack 
                    //check Pot Limit or turn Number 
                }

            }else {
                //Normal Card 
                // Pack Or action or Show 
                if(totalPlayer == 2){
                    //Check Pot Limit or turn Number 
                    // Show karna he ya action 

                }else{
                    // action Ya Pack 
                    //check Pot Limit or turn Number 
                }
            }
        }else {
            if(robotCardValue == 5 || robotCardValue == 4 || robotCardValue == 3 || robotCardValue == 2 || robotCardValue == 1 ){
                // Cahal 
            }else{
                // Normal Card 
                // Pack Or action or Show 
                if(totalPlayer == 2){
                    //Check Pot Limit or turn Number 
                    // Show karna he ya action 

                }else{
                    // action Ya Pack 
                    //check Pot Limit or turn Number 
                }
            }
        }

    }else if(playerInfo.playerStatus == "blind"){
        //Blind Valu Funcation call
        //1. check potlimit over ho gaya tha ke nahi
        if(table.chalLimit > table.chalValue*2){
            if(robotCardValue == 5 || robotCardValue == 4 || robotCardValue == 3 ){
                // double chalValue  value and Chal
                //Blind chalValue 
            }else if(robotCardValue == 2 || robotCardValue == 1){
                //Blind chalValue Normal
                if(totalPlayer == 2){
                    //Check Pot Limit or turn Number 
                    // Show karna he ya action 

                }else{
                    // action Ya Pack 
                    //check Pot Limit or turn Number 
                }
            }
        }else {
            if(robotCardValue == 5 || robotCardValue == 4 || robotCardValue == 3 || robotCardValue == 2 || robotCardValue == 1 ){
                // Cahal 
            }else{
                //Nomral Card 
                // Pack Or action or Show 
            }
        }

    }
    
}
console.log("valueOfCard ",valueOfCard([ 'C-3-0', 'D-4-0', 'C-11-0' ]))

function valueOfCard(card){

    let cardsDiff =  DiffColor(card)
    console.log("cardsDiff ",cardsDiff)
    if(PureRonForCheck(cardsDiff)){
        return 5
    }else if(TeenForCheck(cardsDiff) ){
        return 4
    }else if(RonForCheck(cardsDiff)){
        return 3
    }else if(ColorCardCheck(cardsDiff)){
        return 2
    }else if(PairForCheck(cardsDiff)){
        return 1
    }
    return 0;
}


function DiffColor  (card) {
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

function TeenForCheck  (a) {
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


function PureRonForCheck (a) {

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


function RonForCheck (a) {

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


function ColorCardCheck  (a) {
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

function PairForCheck  (a) {
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


