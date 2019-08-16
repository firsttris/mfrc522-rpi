# mfrc522-rpi

:key: JavaScript class to control MFRC522 RFID Module with your Raspberry-pi

MFRC522 is integrated in all types of <b>13.56MHz RFID</b> passive contactless communication methods and protocols.

It uses the ISO14443 specification to communicate to MIFARE cards (also known as <b>NTAG, NFC</b>)
[MIFARE wiki](https://en.wikipedia.org/wiki/MIFARE)
[ISO14443 wiki](https://de.wikipedia.org/wiki/ISO/IEC_14443)

## Features

- Read uid & card memory
- Write card memory & card key
- Buzzer notification (Optional)

## Demo

[![Watch the video](https://github.com/firsttris/mfrc522-rpi/raw/docs/wiki/youtube.png)](https://youtu.be/e5D_fy8IIjY)

## Enable SPI

The SPI master driver is disabled by default on Raspbian. To enable it, use raspi-config, or ensure the line dtparam=spi=on isn't commented out in /boot/config.txt. When it is enabled then reboot your pi. If the SPI driver was loaded, you should see the device /dev/spidev0.0

[more info about SPI](https://www.raspberrypi.org/documentation/hardware/raspberrypi/spi/README.md)

## Install

Installation tested with node (8,10,11) versions. Currently (Mai 2019) [node-rpio](https://github.com/jperkin/node-rpio#compatibility) is not compatible with node 12. You could use NVM (Node Version Manager) to downgrade your node installation to a lower version (e.g. 11):

[![npm version](https://badge.fury.io/js/mfrc522-rpi.svg)](https://badge.fury.io/js/mfrc522-rpi)

```
npm install mfrc522-rpi
```

## Usage

By reading examples in `test` folder, you can interface your raspberry pi accordingly.

#### read uid

`node /node_modules/mfrc522-rpi/test/read.js`

#### dump card

`node /node_modules/mfrc522-rpi/test/dumpCard.js`

#### dump NTAG213 (sticker)

`node /node_modules/mfrc522-rpi/test/dumpNTAG213.js`

#### write card

`node /node_modules/mfrc522-rpi/test/write.js`

Thank you to [musdom](https://github.com/musdom) for providing code example for NTAG213 https://github.com/firsttris/mfrc522-rpi/issues/5

### Card Register

On your NFC Chip are key and data register (see card register). Block 7 is a key register
It contains the keys for data register 8, 9, 10. There are 2 keys located in block 7:

- KEY B: first 6 bit of block 7 - in hex: 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
- KEY A: last 6 bit of block 7 - in hex: 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF
- Accessbits: 4 bits in the middle - in decemial: 255, 7, 128, 105

You can authenticate on block 8, 9, 10 with the key's from block 7

The module is configured to authenticate only with Key A.

Physical memory content of the chip/card which was included on the RFID-RC522 Module

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

## Buzzer

It's possible to get buzzer notifications (Optional feature) when the module reads a chip, simply connect a piezo speaker (active one) with the BROWN cable to PIN 18 and the black to any ground on the GPIO's (see wiring)

## Documentation

Manufacturer documentation of MFRC522

[MFRC522-Doc.pdf](https://www.nxp.com/documents/data_sheet/MFRC522.pdf)

### NTAG (NXP213)

[about NFC-TAG types](http://www.nfc-tag-shop.de/info/ueber-nfc-tags/nfc-tag-typen.html)

[ebay link](http://www.ebay.de/itm/121594983773?_trksid=p2060353.m2749.l2649)

[NTAG213_215_216.pdf](https://www.nxp.com/documents/data_sheet/NTAG213_215_216.pdf)

### Sources

https://github.com/miguelbalboa/rfid

https://github.com/mxgxw/MFRC522-python

### Wiring

Follow the map here to do the interface pins.

| Name   | Pin # | Pin name           |
| ------ | ----- | ------------------ |
| SDA    | 24    | CE0                |
| SCK    | 23    | SCLK1              |
| MOSI   | 19    | MOSI1              |
| MISO   | 21    | MOSO1              |
| IRQ    | None  | None               |
| GND    | Any   | Any Ground         |
| RST    | 22    | GPIO5C3            |
| 3.3V   | 1     | 3V3                |
| Buzzer | 18    | GPIO5B3 (Optional) |

Note that the pins number is different from the BCM number.

![Screenshot](wiki/mfrc522-node.png)

![Screenshot](wiki/gpio-map.png)

### Which hardware is used?

List of hardware which are used with links to `amazon.de`:

- [Raspberry Pi 3 B+](https://www.amazon.de/Raspberry-1373331-Pi-Modell-Mainboard/dp/B07BDR5PDW/ref=sr_1_3?crid=78XCCBIEFSD9&keywords=raspberry+pi+3+b%2B&qid=1565892766&s=gateway&sprefix=raspberry%2Caps%2C173&sr=8-3)
- [RFID kit RC522](https://www.amazon.de/AZDelivery-Reader-Arduino-Raspberry-gratis/dp/B01M28JAAZ/ref=sr_1_1?keywords=MFRC522&qid=1565892804&s=gateway&sr=8-1)
- [DC to DC regulator (5V to 3.3V)](https://www.amazon.de/PEMENOL-AMS1117-Stromversorgungsmodul-Raspberry-Mikrocontroller/dp/B07FSLGPR8/ref=sr_1_1?keywords=AMS1117&qid=1565868927&s=ce-de&sr=1-1) (optional) used only if you want to interface buzzer with the system.
  ![ams1117](wiki/ams1117.png)
- [Active buzzer (NOT passive)](https://www.amazon.de/BETAFPV-Terminals-Electronic-Continuous-12X9-5mm/dp/B073RH8TQK/ref=sr_1_2?keywords=Active+buzzer&qid=1565892971&s=ce-de&sr=1-2) (optional)
  ![ams1117](wiki/diff-passive-active-buzzer.jpg)
- [NPN transistor](https://www.amazon.de/100pcs-S8050-S8050D-Transistor-40Volts/dp/B00CZ6K2SM/ref=sr_1_1?keywords=s8050&qid=1565894051&s=computers&sr=1-1) (Optional)

Those three optional component are required to run the buzzer with 5V. The RC522 is running at 3.3V so we need to step down the voltage a bit.

## Demonstration

- Some images and video demonstration can be found [here](docs/demo.md)

## Circuit Diagram:

Inside `project-diagram` folder there is a diagram for the system. You can run it with `Fritzing` application and make a printable PCB after aligning components on your wish.

## Code of Conduct

See the [CODE](CODE_OF_CONDUCT.md)

## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).
