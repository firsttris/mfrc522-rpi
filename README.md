# mfrc522-rpi

:key: JavaScript class to control MFRC522 RFID Module with your Raspberry-pi

MFRC522 is completely integrated in all types of <b>13.56MHz RFID</b> passive contactless communication methods and protocols.


It uses the ISO14443 specification to communicate with all types of MIFARE cards (also known as <b>NTAG, NFC</b>)


###Features
- Read uid & card memory
- Write card memory & card key

### Install
Install the latest version via npm:

*Can only be installed on rpi, through dependency to wiring-pi*

[![npm version](https://badge.fury.io/js/mfrc522-rpi.svg)](https://badge.fury.io/js/mfrc522-rpi)

```
npm install mfrc522-rpi
```
### Basic Usage
Find basic examples in "test" directory

### Scripts
run basic examples
```
sudo npm run read
sudo npm run write
sudo npm run dumpCard
```

#### Example

On your NFC Chip are key and data register (see card register)

Block 7 is a key register
It contains the keys for data register 8, 9, 10

There are 2 keys located in block 7

KEY B: first 6 bit of block 7 - in hex 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 

(6 x 0 in decimal values)

KEY A: last 6 bit of block 7 - in hex 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF

(6 x 255 in decimal values)

You can authenticate on Block 8, 9, 10 with the key's from Block 7

My module is configured to only authenticate with Key A.

### Card Register

FIFO Buffer Contains 64 byte

```
Block: 0 Data: 89,229,151,26,49,8,4,0,98,99,100,101,102,103,104,105
Block: 1 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 2 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 3 Data: 0,0,0,0,0,0,255,7,128,105,255,255,255,255,255,255
Block: 4 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 5 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 6 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 7 Data: 0,0,0,0,0,0,255,7,128,105,255,255,255,255,255,255
Block: 8 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 9 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 10 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 11 Data: 0,0,0,0,0,0,255,7,128,105,255,255,255,255,255,255
Block: 12 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 13 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 14 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 15 Data: 0,0,0,0,0,0,255,7,128,105,255,255,255,255,255,255
Block: 16 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 17 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 18 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 19 Data: 0,0,0,0,0,0,255,7,128,105,255,255,255,255,255,255
Block: 20 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 21 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 22 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 23 Data: 0,0,0,0,0,0,255,7,128,105,255,255,255,255,255,255
Block: 24 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 25 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 26 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 27 Data: 0,0,0,0,0,0,255,7,128,105,255,255,255,255,255,255
Block: 28 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 29 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 30 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 31 Data: 0,0,0,0,0,0,255,7,128,105,255,255,255,255,255,255
Block: 32 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 33 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 34 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 35 Data: 0,0,0,0,0,0,255,7,128,105,255,255,255,255,255,255
Block: 36 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 37 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 38 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 39 Data: 0,0,0,0,0,0,255,7,128,105,255,255,255,255,255,255
Block: 40 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 41 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 42 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 43 Data: 0,0,0,0,0,0,255,7,128,105,255,255,255,255,255,255
Block: 44 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 45 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 46 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 47 Data: 0,0,0,0,0,0,255,7,128,105,255,255,255,255,255,255
Block: 48 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 49 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 50 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 51 Data: 0,0,0,0,0,0,255,7,128,105,255,255,255,255,255,255
Block: 52 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 53 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 54 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 55 Data: 0,0,0,0,0,0,255,7,128,105,255,255,255,255,255,255
Block: 56 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 57 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 58 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 59 Data: 0,0,0,0,0,0,255,7,128,105,255,255,255,255,255,255
Block: 60 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 61 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 62 Data: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Block: 63 Data: 0,0,0,0,0,0,255,7,128,105,255,255,255,255,255,255
```

### Chang Auth Key
(not tested)
Authenticate on block 7 with key from block 7, write new key to block.

### Documentation
Manufacturer documentation

[MFRC522-Doc.pdf](https://www.nxp.com/documents/data_sheet/MFRC522.pdf)

###Sources

https://github.com/miguelbalboa/rfid

https://github.com/mxgxw/MFRC522-python

### Wiring
![Screenshot](https://dl.dropboxusercontent.com/u/13344648/dev/rpi-mfrc522-wiring2.PNG)

### Which hardware is used?

![Screenshot](https://dl.dropboxusercontent.com/u/13344648/dev/RC522.jpg)

Link to Amazon (Germany): [Link](https://www.amazon.de/dp/B00QFDRPZY/ref=cm_sw_r_tw_dp_x_.zoCybA5MAYZ0)