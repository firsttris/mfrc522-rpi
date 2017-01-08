"use strict";
const mfrc522 = new (require("./mfrc522"))();
let continueReading = true;

//# This loop keeps checking for chips. If one is near it will get the UID and authenticate
console.log("scanning...");
console.log("Please put chip or keycard in the antenna inductive zone!");
console.log("Press Ctrl-C to stop.");

while (continueReading) {

    //# Scan for cards
    let response = mfrc522.findCard();

    if (!response.status) {
        continue;
    }
    //# Card is found
    console.log("Card detected, CardType: " + response.bitSize);

    //# Get the UID of the card
    response = mfrc522.getUid();
    if (!response.status) {
        console.log("UID Scan Error");
        continue;
    }
    //# If we have the UID, continue
    const uid = response.data;
    console.log("Card read UID: %s %s %s %s", uid[0].toString(16), uid[1].toString(16), uid[2].toString(16), uid[3].toString(16));

    //# Select the scanned card
    mfrc522.selectCard(uid);

    //# This is the default key for authentication
    const key = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];

    //# dump RFID chip memory
    for (let i = 0; i < 64; i++) {
        if (mfrc522.authenticate(i, key, uid)) {
            console.log("Block: "+i+" Data: "+mfrc522.getDataForBlock(i));
        } else {
            console.log("Authentication Error");
            break;
        }
    }

    //# Stop
    mfrc522.stopCrypto();

}