var mfrc522 = require("./mfrc522");

mfrc522.init();

//# This loop keeps checking for chips. If one is near it will get the UID and authenticate
console.log("MFRC522 data write example ...");
console.log("Press Ctrl-C to stop.");
var continueReading = true;
while (continueReading) {

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

        //# Authenticate
        status = mfrc522.auth(mfrc522.PICC_AUTHENT1A,8,key,uid);

        //# Check if authenticated
        if (status == mfrc522.MI_OK) {

            //# Variable for the data to write
            var data = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];

            console.log("Sector 8 looked like this:");
            mfrc522.readDataFromSector(8);

            console.log("Sector 8 will now be filled with 0xFF:");
            mfrc522.writeDataToSector(8,data);

            console.log("It now looks like this:");
            mfrc522.readDataFromSector(8);

            data = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

            //console.log("All Sectors");
            //mfrc522.DumpClassic1K(key, uid);

            console.log("Now we fill it with 0x00:");
            mfrc522.writeDataToSector(8,data);

            console.log("It is now empty:");
            mfrc522.readDataFromSector(8);

            mfrc522.stopCrypto1();

            continueReading = false;
            console.log("finished successfully!");
        } else {
            console.log("Authentication Error");
        }

    }
}