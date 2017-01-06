var mfrc522 = require("./mfrc522");

mfrc522.init();

//# This loop keeps checking for chips. If one is near it will get the UID and authenticate
console.log("MFRC522 data read example ...");
console.log("Press Ctrl-C to stop.");
while (true) {

    //# Scan for cards
    var response = mfrc522.request(mfrc522.PICC_REQIDL);
    var status = response.status;
    var tagType = response.bitSize;

    //# If a card is found
    if (status == mfrc522.MI_OK) {
        console.log("Card detected");
    }

    //# Get the UID of the card
    response = mfrc522.anticoll();
    status = response.status;
    var uid = response.data;

    //# If we have the UID, continue
    if (status == mfrc522.MI_OK) {
        //# Print UID
        console.log("Card read UID: %s %s %s %s", uid[0].toString(16), uid[1].toString(16), uid[2].toString(16), uid[3].toString(16));

        //# This is the default key for authentication
        var key = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];

        //# Select the scanned tag
        mfrc522.selectTag(uid);

        //# Dump the data
        mfrc522.dumpClassic1K(key, uid);

        //# Stop
        mfrc522.stopCrypto1();
    }
}