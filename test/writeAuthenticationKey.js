"use strict";
const Mfrc522 = require("./../index"); // when using module, change this to: require("mfrc522-rpi")
const SoftSPI = require("rpi-softspi");

//# This loop keeps checking for chips. If one is near it will get the UID and authenticate
console.log("scanning...");
console.log("Please put chip or keycard in the antenna inductive zone!");
console.log("Press Ctrl-C to stop.");

const softSPI = new SoftSPI({
  clock: 23, // pin number of SCLK
  mosi: 19, // pin number of MOSI
  miso: 21, // pin number of MISO
  client: 24 // pin number of CS
});

// GPIO 24 can be used for buzzer bin (PIN 18), Reset pin is (PIN 22).
// I believe that channing pattern is better for configuring pins which are optional methods to use.
const mfrc522 = new Mfrc522(softSPI).setResetPin(22).setBuzzerPin(18);

setInterval(function() {
  //# reset card
  mfrc522.reset();

  //# Scan for cards
  let response = mfrc522.findCard();
  if (!response.status) {
    return;
  }

  console.log("Card detected, CardType: " + response.bitSize);

  //# Get the UID of the card
  response = mfrc522.getUid();
  if (!response.status) {
    console.log("UID Scan Error");
    return;
  }
  //# If we have the UID, continue
  const uid = response.data;
  console.log(
    "Card read UID: %s %s %s %s",
    uid[0].toString(16),
    uid[1].toString(16),
    uid[2].toString(16),
    uid[3].toString(16)
  );

  //# Select the scanned card
  const memoryCapacity = mfrc522.selectCard(uid);
  console.log("Card Memory Capacity: " + memoryCapacity);

  //# oldKey is the default key for authentication
  const oldKey = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff];
  const newKey = [0x11, 0x22, 0x33, 0x44, 0x55, 0x66];

  //# Authenticate on Block 11 with key and uid
  if (!mfrc522.authenticate(11, oldKey, uid)) {
    console.log("Authentication Error");
    return;
  }

  console.log("Changing access key in block 11 for blocks 8-11 to:", newKey);
  mfrc522.writeAuthenticationKey(11, newKey);

  console.log("Now we can use the new access key to store data in block 10...");

  if (!mfrc522.authenticate(10, newKey, uid)) {
    console.log("Authentication Error");
    return;
  }

  const oldData = mfrc522.getDataForBlock(10);
  console.log("Block 10 previous data: ", oldData);
  const newData = [
    0x00,
    0x01,
    0x02,
    0x03,
    0x04,
    0x05,
    0x06,
    0x07,
    0x08,
    0x09,
    0x0a,
    0x0b,
    0x0c,
    0x0d,
    0x0e,
    0x0f
  ];
  console.log("Data to write: ", newData);
  mfrc522.writeDataToBlock(10, newData);
  console.log("Block 10 data is now: ", mfrc522.getDataForBlock(10));
  console.log("Change block 10 back to previous data");
  mfrc522.writeDataToBlock(10, oldData);

  console.log("Now we change the access key back to factory default");
  mfrc522.writeAuthenticationKey(11, oldKey);

  mfrc522.stopCrypto();

  console.log("finished successfully!");
  process.exit();
}, 500);
