var mfrc522 = require("./mfrc522");

mfrc522.init();

//# This loop keeps checking for chips. If one is near it will get the UID and authenticate
console.log("scanning...")
console.log("Please put chip or keycard in the antenna inductive zone!");
console.log("Press Ctrl-C to stop.");

while (true) {

    //# Scan for cards
    var response = mfrc522.findCard();
    var status = response.status;
    var tagType = response.bitSize;

    if (status == mfrc522.ERROR) {
        continue;
    }
    //# Card is found
    console.log("Card detected, CardType: " + tagType);

    //# Get the UID of the card
    response = mfrc522.getUid();
    status = response.status;
    var uid = response.data;

    if (status == mfrc522.ERROR) {
        console.log("UID Scan ERROR");
        continue;
    }
    //# If we have the UID, continue
    console.log("Card read UID: %s %s %s %s", uid[0].toString(16), uid[1].toString(16), uid[2].toString(16), uid[3].toString(16));

    //# Select the scanned card
    mfrc522.selectCard(uid);

    //# This is the default key for authentication
    var key = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];

    //# dump RFID chip memory
    for (var i = 0; i < 64; i++) {
        var status = mfrc522.authenticate(i, key, uid);
        if (status) {
            mfrc522.readDataFromBlock(i);
        }
        else {
            console.log("Authentication ERROR");
        }
    }

    //# Stop
    mfrc522.stopCrypto();


}