# mfrc522-rpi

:key: lightweight JavaScript interface to control RFID reader MFRC522 with Raspberry-pi

###Features
- RC522 and ISO14443 card communication
- Read UID & card memory (64Bit)
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