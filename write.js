var mfrc522 = require("./mfrc522");
var continueReading = true;

mfrc522.init();

//# This loop keeps checking for chips. If one is near it will get the UID and authenticate
console.log("scanning...")
console.log("Please put chip or keycard in the antenna inductive zone!");
console.log("Press Ctrl-C to stop.");

while (continueReading) {

    //# Scan for cards
    var response = mfrc522.findCard();
    var status = response.status;
    var tagType = response.bitSize;

    //# If a card is found
    if (status == mfrc522.ERROR) {
        continue;
    }
    console.log("Card detected, CardType: " + tagType);

    //# Get the UID of the card
    response = mfrc522.getUid();
    status = response.status;
    var uid = response.data;

    //# If we have the UID, continue
    if (status == mfrc522.ERROR) {
        console.log("UID Scan ERROR");
        continue;
    }

    //# Print UID
    console.log("Card read UID: %s %s %s %s", uid[0].toString(16), uid[1].toString(16), uid[2].toString(16), uid[3].toString(16));

    //# This is the default key for authentication
    var key = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];

    //# Select the scanned tag
    mfrc522.selectCard(uid);

    //# Authenticate
    status = mfrc522.authenticate(8, key, uid);

    //# Check if authenticated
    if (status == mfrc522.ERROR) {
        console.log("Authentication ERROR");
        continue;
    }

    //# Variable for the data to write
    var data = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];

    console.log("Sector 8 looked like this:");
    mfrc522.readDataFromBlock(8);

    console.log("Sector 8 will now be filled with 0xFF:");
    mfrc522.writeDataToBlock(8, data);

    console.log("It now looks like this:");
    mfrc522.readDataFromBlock(8);

    data = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

    //console.log("All Blocks:");
    //mfrc522.dumpCard(key, uid);

    console.log("Now we fill it with 0x00:");
    mfrc522.writeDataToBlock(8, data);

    console.log("It is now empty:");
    mfrc522.readDataFromBlock(8);

    mfrc522.stopCrypto();

    continueReading = false;
    console.log("finished successfully!");


}