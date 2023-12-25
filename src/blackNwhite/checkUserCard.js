
const logger = require("../../logger");
const _ = require("underscore")

module.exports.getWinnerUser = (userInfo, hukum, isShow, showUserSeatIndex, BNWCards) => {
    logger.info("BNWCards -->", BNWCards)
    let cardArr = []
    cardArr.push(BNWCards.black, BNWCards.white)
    let cardsResult = [];

    for (let i = 0; i < cardArr.length; i++) {
        let response = this.getWinState(cardArr[i], hukum);
        logger.info("BNWCards response : ", response);
        cardsResult.push(response);
    }

    cardsResult = cardsResult.sort((a, b) => {
        return b.cardCount - a.cardCount
    }).sort((a, b) => {
        return a.index - b.index
    })
    logger.info("getWinnerUser cardsResult : ", cardsResult);

    return cardsResult;
    ////Old COde
    // for (let i = 0; i < userInfo.length; i++) {
    //     let response = this.getWinState(userInfo[i].cards, hukum);
    //     logger.info("getWinnerUser response : ", response);

    //     response.seatIndex = userInfo[i].seatIndex;
    //     players.push(response);
    // }

    // players = players.sort((a, b) => {
    //     return b.cardCount - a.cardCount
    // }).sort((a, b) => {
    //     return a.index - b.index
    // })
    // logger.info("getWinnerUser players : ", players);

    // if (typeof isShow != "undefined" && isShow) {
    //     let winners = [players[0]];
    //     if (winners[0].cardCount == players[1].cardCount && winners[0].index == players[1].index) {
    //         if (winners[0].seatIndex == showUserSeatIndex) {
    //             winners = [players[1]];
    //         }
    //     }
    //     return winners;
    // } else {
    //     let winners = [players[0]];
    //     for (let i = 1; i < players.length; i++) {
    //         if (winners[0].cardCount == players[1].cardCount && winners[0].index == players[1].index) {
    //             winners.push(players[i]);
    //         }
    //     }
    //     return winners;
    // }
}

module.exports.getWinState = (userCards, hukum) => {

    // let hukumCards = this.gethukumList(userCards, hukum);
    // logger.info("\ngetWinState hukumCards : ", hukumCards);

    // let remaningCards = _.difference(userCards, hukumCards);
    // logger.info("getWinState hciuc :", remaningCards, hukumCards, userCards);

    // remaningCards = remaningCards.sort((a, b) => {
    //     return b.split('-')[1] - a.split('-')[1];
    // })
    // logger.info("getWinState remaningCards :", remaningCards);

    let cards = userCards //this.replaceHukumCards(remaningCards, hukum);
    logger.info("getWinState cards :", cards);

    cards = cards.sort((a, b) => {
        return b.split('-')[1] - a.split('-')[1];
    });
    logger.info("getWinState cards :", cards);

    let resTrail = this.checkTrail(cards);
    logger.info("getWinState resTrail :", resTrail);

    if (resTrail.flag) {
        return resTrail;
    }

    let resPureSeq = this.checkPureSeq(cards);
    logger.info("getWinState resPureSeq :", resPureSeq);

    if (resPureSeq.flag) {
        return resPureSeq;
    }

    let resSeq = this.checkSeq(cards);
    logger.info("getWinState resSeq :", resSeq);

    if (resSeq.flag) {
        return resSeq;
    }

    let resColor = this.checkColor(cards);
    logger.info("getWinState resColor :", resColor);

    if (resColor.flag) {
        return resColor;
    }

    let resPair = this.checkPair(cards);
    logger.info("getWinState resPair :", resPair);

    if (resPair.flag) {
        return resPair;
    }

    return {
        flag: true,
        cards: cards,
        cardCount: this.countCards(cards),
        status: "High_Cards",
        index: 6,
        winResult: "",
    }
}

module.exports.gethukumList = (nCards, hukum) => {
    logger.info("gethukumList check  cards -->", nCards)
    let hukumList = [];
    nCards = nCards.map((e) => {
        logger.info("gethukumList check  cards  E-->", e)
        if ((e.split("-")[1]) === (hukum.split("-")[1])) {
            hukumList.push(e);
        }
        return e;
    })
    return hukumList;
}

module.exports.replaceHukumCards = (remaningCards, hukum) => {
    logger.info("replaceHukumCards remaningCards : ", remaningCards.length);
    if (remaningCards.length == 0) {
        return [
            "H-1-0", "S-1-0", "D-1-0"
        ]
    } else if (remaningCards.length == 1) {
        let suit = ["H", "S", "D", "C"];
        let cards = [remaningCards[0]];
        for (let i = 0; i < (3 - remaningCards.length); i++) {
            for (let j = 0; j < suit.length; j++) {
                let card = suit[j] + "-" + remaningCards[0].split('-')[1] + "-0";
                if (cards.indexOf(card) == -1) {
                    cards.push(card);
                    break;
                }
            }
        }
        return cards;
    } else if (remaningCards.length == 2) {
        logger.info("replaceHukumCards remaningCards 11: ", remaningCards[0].split('-')[0], remaningCards[1].split('-')[0]);
        if (remaningCards[0].split('-')[0] == remaningCards[1].split('-')[0]) {
            logger.info("replaceHukumCards remaningCards 11: ", remaningCards.length);
            let cards = this.getRemaningCards(remaningCards);
            return cards;
        } else {
            let cards = this.getRemaningCards(remaningCards);
            return cards;
        }
    } else {
        return remaningCards;
    }
}

module.exports.getRemaningCards = (remaningCards) => {
    logger.info("getRemaningCards remaningCards 11: ", remaningCards)
    if (remaningCards[0].split('-')[1] == 12 && remaningCards[1].split('-')[1] == 1) {

        let card = remaningCards[0].split('-')[0] + "-14-0"
        remaningCards.push(card);

        return remaningCards;
    } else if (remaningCards[0].split('-')[1] == 13 && remaningCards[1].split('-')[1] == 12) {

        let card = remaningCards[0].split('-')[0] + "-1-0"
        remaningCards.push(card);

        return remaningCards;
    } else if (remaningCards[0].split('-')[1] == 2 && remaningCards[1].split('-')[1] == 3) {

        let card = remaningCards[0].split('-')[0] + "-" + (remaningCards[1].split('-')[1] - 1) + "-0"
        remaningCards.push(card);

        return remaningCards;
    } else if ((remaningCards[1].split('-')[1] - remaningCards[0].split('-')[1]) == -1) {
        let no = Number(remaningCards[0].split('-')[1]) + 1;
        let card = remaningCards[0].split('-')[0] + "-" + no + "-0"
        remaningCards.push(card);

        return remaningCards;
    } else if ((remaningCards[1].split('-')[1] - remaningCards[0].split('-')[1]) == -2) {
        let no = Number(remaningCards[1].split('-')[1]) + 1
        let card = remaningCards[0].split('-')[0] + "-" + no + "-0"
        remaningCards.push(card);

        return remaningCards;
    } else if (remaningCards[0].split('-')[0] == remaningCards[1].split('-')[0]) {

        let card = remaningCards[0].split('-')[0] + "-1-0"
        remaningCards.push(card); 1

        return remaningCards;
    } else {
        let suit = ["H", "S", "D", "C"];
        let cards = remaningCards;
        logger.info("getRemaningCards cards 11: ", cards)
        for (let i = 0; i < (3 - remaningCards.length); i++) {
            for (let j = 0; j < suit.length; j++) {
                let card = suit[j] + "-" + remaningCards[0].split('-')[1] + "-0";
                logger.info("getRemaningCards card 11: ", card)
                if (cards.indexOf(card) == -1) {
                    cards.push(card);
                    break;
                }
            }
        }
        return cards;
    }
}

module.exports.countCards = (cards) => {
    let sum = 0;
    for (let i = 0; i < cards.length; i++) {
        let cardsC = (Number(cards[i].split('-')[1]) == 1) ? 14 : Number(cards[i].split('-')[1])
        sum = sum + cardsC
    }
    return sum
}

module.exports.checkTrail = (cards) => {
    let response = {
        flag: false
    }
    for (let i = 0; i < cards.length; i++) {
        if (cards[0].split('-')[1] != cards[i].split('-')[1]) {
            return response;
        }
    }
    if (cards[0].split('-')[1] == 1) {
        return {
            flag: true,
            cards: cards,
            cardCount: (14) * 3,
            status: "Tie",
            index: 1
        }
    } else {
        return {
            flag: true,
            cards: cards,
            cardCount: (cards[0].split('-')[1]) * 3,
            status: "Tie",
            index: 1
        }
    }
}

module.exports.checkSeqCondition = (cards, flag) => {
    if (cards[0].split('-')[1] == 3 && cards[1].split('-')[1] == 2 && cards[2].split('-')[1] == 1) {
        return {
            flag: true,
            cards: cards,
            cardCount: 38,
            status: (flag) ? "Pure_Sequence" : "Sequence",
            index: (flag) ? 2 : 3
        }
    } else if (cards[0].split('-')[1] == 13 && cards[1].split('-')[1] == 12 && cards[2].split('-')[1] == 1) {
        return {
            flag: true,
            cards: cards,
            cardCount: 37,
            status: (flag) ? "Pure_Sequence" : "Sequence",
            index: (flag) ? 2 : 3
        }
    } else {
        return {
            flag: false
        }
    }
}

module.exports.checkPureSeq = (cards) => {
    logger.info("checkPureSeq  cards : ", cards);
    let response = {
        flag: false
    }
    for (let i = 0; i < cards.length; i++) {
        if (cards[0].split('-')[0] != cards[i].split('-')[0]) {
            return response;
        }
    }

    let special_seq = this.checkSeqCondition(cards, true);
    if (special_seq.flag) {
        return special_seq
    }

    for (let i = 0; i < cards.length - 1; i++) {
        if ((cards[i].split('-')[1] - cards[i + 1].split('-')[1]) != 1) {
            return response;
        }
    }

    return {
        flag: true,
        cards: cards,
        cardCount: this.countCards(cards),
        status: "Pure_Sequence",
        index: 2
    }
}

module.exports.checkSeq = (cards) => {
    logger.info("checkSeq  cards : ", cards);
    let response = {
        flag: false
    }

    let special_seq = this.checkSeqCondition(cards, true);
    if (special_seq.flag) {
        return special_seq
    }

    for (let i = 0; i < cards.length - 1; i++) {
        if ((cards[i].split('-')[1] - cards[i + 1].split('-')[1]) != 1) {
            return response;
        }
    }

    return {
        flag: true,
        cards: cards,
        cardCount: this.countCards(cards),
        status: "Sequence",
        index: 3
    }
}

module.exports.checkColor = (cards) => {
    logger.info("checkColor  cards : ", cards);
    let response = {
        flag: false
    }
    for (let i = 0; i < cards.length; i++) {
        if (cards[0].split('-')[0] != cards[i].split('-')[0]) {
            return response;
        }
    }
    return {
        flag: true,
        cards: cards,
        cardCount: this.countCards(cards),
        status: "Color",
        index: 4
    }
}

module.exports.checkPair = (cards) => {
    logger.info("checkPair  cards : ", cards);
    let response = {
        flag: false
    }
    let same = false;
    for (let i = 0; i < cards.length - 1; i++) {
        if (Number(cards[i].split('-')[1]) == Number(cards[i + 1].split('-')[1])) {
            same = true;
        }
    }
    if (!same) {
        return response;
    }
    return {
        flag: true,
        cards: cards,
        cardCount: this.countCards(cards),
        status: "Pair",
        index: 5
    }
}
