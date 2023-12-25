const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const fortuna = require('javascript-fortuna');
fortuna.init();
const CONST = require('../../constant');
const logger = require("../../logger");
const commandAcions = require("../helper/socketFunctions");
const roundStartActions = require("./roundStart");
const checkWinnerActions = require('./checkWinner');
const PlayingTables = mongoose.model("blackNwhiteTables");
const _ = require("underscore")
const cardLogic = require("./cardLogic");

module.exports.cardDealStart = async (tbid) => {
    logger.info("collectBoot tbid : ", tbid);
    let wh = {
        _id: tbid
    };
    let tb = await PlayingTables.findOne(wh, {}).lean();
    logger.info("collectBoot tb : ", tb);

    let cardDetails = this.getCardsDeatil();
    logger.info("collectBoot cardDetails : ", cardDetails);

    const update = {
        $set: {
            gameState: "StopBatting",
        }
    }
    const cardDealIndexs = await this.setUserCards(cardDetails, tb);
    logger.info("initRoundState cardDealIndexs : ", cardDealIndexs);

    logger.info("initRoundState update : ", update);

    const tabInfo = await PlayingTables.findOneAndUpdate(wh, update, { new: true });
    logger.info("findTableAndJoin tabInfo : ", tabInfo);

    const eventResponse = {
        cards: cardDealIndexs
    }
    commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.BNW_STOP_BATTING_TIMER, {});

    // let tbId = tabInfo._id;
    // let jobId = commandAcions.GetRandomString(10);
    // let delay = commandAcions.AddTime(5);
    // const delayRes = await commandAcions.setDelay(jobId, new Date(delay));

    // await roundStartActions.roundStarted(tbId)
    await checkWinnerActions.winnercall(tabInfo);
}

module.exports.setUserCards = async (cardsInfo, tb) => {
    try {
        logger.info("setUserCards cardsInfo : 1 ", cardsInfo);
        // const cards = cardsInfo;

        let upWh = {
            _id: tb._id
        }
        let updateData = {
            $set: {}
        }

        // tb.BNWCards.black.push(cardsInfo[0])
        // tb.BNWCards.black.push(cardsInfo[1])

        updateData.$set["BNWCards.black"] = cardsInfo.cards[0];
        updateData.$set["BNWCards.white"] = cardsInfo.cards[1];

        logger.info("updateData ==>", updateData)

        const tbl = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("table -->", tbl)
        return tbl.BNWCards;
    } catch (err) {
        logger.info("Exception setUserCards : 1 ::", err)
    }
}

module.exports.getCards = (playerInfo) => {
    let deckCards = Object.assign([], CONST.deckOne);

    //deckCards = deckCards.slice(0, deckCards.length);

    logger.info("getCards deckCards ::", deckCards);

    let cards = [];
    let color = ['H', 'S', 'D', 'C'];
    let number = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

    for (let i = 0; i < playerInfo.length; i++) {
        if (typeof playerInfo[i].seatIndex != "undefined" && playerInfo[i].status == "play" && playerInfo[i].Iscom == 1) {
            let card = [];

            console.log(playerInfo[i].Iscom)

            card = this.HighCard(deckCards, color, number)

            cards[playerInfo[i].seatIndex] = card;
        }
    }

    for (let i = 0; i < playerInfo.length; i++) {
        if (typeof playerInfo[i].seatIndex != "undefined" && playerInfo[i].status == "play") {
            let card = [];

            console.log(playerInfo[i].Iscom)


            if (typeof playerInfo[i].seatIndex != "undefined" && playerInfo[i].Iscom == 0) {
                for (let i = 0; i < 3; i++) {
                    let ran = parseInt(fortuna.random() * deckCards.length);
                    card.push(deckCards[ran])
                    deckCards.splice(ran, 1);
                }

                cards[playerInfo[i].seatIndex] = card;
            }

        }
    }

    let ran = parseInt(fortuna.random() * deckCards.length);
    let hukum = deckCards[ran];
    deckCards.splice(ran, 1);

    logger.info("getCards hukum ::", hukum);
    console.log("cards cards ", cards)
    return {
        hukum: hukum,
        cards: cards
    }
}

module.exports.HighCard = (pack, color, card) => {

    var poss = [];
    var cardDealNumber = cardLogic.GetRandomInt(1, 3)

    if (cardDealNumber == 1) {
        // Teen 
        color = _.shuffle(color);
        var number = card[cardLogic.GetRandomInt(0, card.length - 1)]
        card.splice(card.indexOf(number), 1);


        for (var i = 0; i < 3; i++) {
            poss.push(color[i] + "-" + number + "-0");
        }

    } else if (cardDealNumber == 2) {
        // Normal Ron 

        var number = card[cardLogic.GetRandomInt(0, card.length - 3)]


        for (var i = 0; i < 3; i++) {
            if (typeof card[number] == 'undefined')
                number = 0

            var c = color[cardLogic.GetRandomInt(0, color.length - 1)]

            poss.push(c + "-" + card[number] + "-0");
            number++;

        }

    } else if (cardDealNumber == 3) {
        // Color Ron 
        console.log("Same COLOR RON ", card)
        var c = color[cardLogic.GetRandomInt(0, color.length - 1)]

        var number = card[cardLogic.GetRandomInt(0, card.length - 3)]
        card.splice(card.indexOf(number), 3)

        console.log("Same COLOR RON card ", card)


        for (var i = 0; i < 3; i++) {

            poss.push(c + "-" + number + "-0");
            number++;

        }


    } else if (cardDealNumber == 4) {
        // Normal COLOR 
        var c = color[cardLogic.GetRandomInt(0, color.length - 1)]
        color.splice(color.indexOf(c), 1);

        for (var i = 0; i < 3; i++) {
            if (typeof card[number] == 'undefined')
                number = 0

            var number = card[cardLogic.GetRandomInt(0, card.length - 1)]

            console.log("number ", number)
            console.log("card[number] ", card)
            poss.push(c + "-" + number + "-0");
            card.splice(card.indexOf(number), 1);
        }


        console.log("poss ", poss)

    } else {

        // pair 
        console.log("Pair ")
        var number = card[cardLogic.GetRandomInt(0, card.length - 3)]
        card.splice(card.indexOf(number), 1)

        for (var i = 0; i < 3; i++) {
            if (typeof card[number] == 'undefined')
                number = 0

            if (i == 2) {
                number = card[cardLogic.GetRandomInt(0, card.length - 3)]
                card.splice(card.indexOf(number), 1)
            }

            var c = color[cardLogic.GetRandomInt(0, color.length - 1)]
            color = _.difference(color, [c])

            poss.push(c + "-" + number + "-0");
        }

    }

    var finalcard = [];
    console.log("poss ", poss)
    for (var i = 0; i < poss.length; i++) {
        console.log("pack", pack)
        if (pack.indexOf(poss[i]) != -1) {
            finalcard.push(poss[i]);
            pack.splice(pack.indexOf(poss[i]), 1);
        }
    }

    console.log("finalcard  ", finalcard)
    return _.flatten(finalcard)

}

module.exports.getCardsDeatil = () => {
    try {
        let deckCards = Object.assign([], CONST.deckOne);
        // deckCards = shuffle(deckCards);

        let cards = [];

        for (let i = 0; i < 2; i++) {
            let card = [];
            for (let i = 0; i < 3; i++) {
                let ran = parseInt(fortuna.random() * deckCards.length);
                card.push(deckCards[ran]);
                deckCards.splice(ran, 1);
            }
            cards.push(card);
        }

        return {
            cards,
        };
    } catch (err) {
        logger.error('cardDeal.js getCards error => ', err);
    }
};
