"use strict";
const CMD = require("./commands");
const rpio = require("rpio");
const OK = true;
const ERROR = false;
let BUZZERCount = 1;
let isCycleEnded = true;

class MFRC522 {
  /**
   * Initialize MFRC522
   *
   * @param {any} SoftSPI object
   * @param {any} reset pin number
   * @memberof MFRC522
   */
  constructor(spi) {
    this.spi = spi;
    this.spi.open();
    return this;
  }

  setResetPin(pin = 22) {
    if (!pin) {
      throw new Error(
        "Invalid parameter! reset pin parameter is invalid or not provided!"
      );
    }
    this.reset_pin = pin;
    // Hold RESET pin low for 50ms to hard reset the reader
    rpio.open(this.reset_pin, rpio.OUTPUT, rpio.LOW);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    rpio.write(this.reset_pin, rpio.HIGH);
    return this;
  }

  setBuzzerPin(pin) {
    // Set Alert mode and initial value.
    if (!pin) {
      throw new Error(
        "Invalid parameter! buzzer pin parameter is invalid or not provided!"
      );
    }
    this.buzzer_pin = pin;
    rpio.open(this.buzzer_pin, rpio.OUTPUT);
    rpio.write(this.buzzer_pin, rpio.LOW);
    return this;
  }

  /**
   * Initializes the MFRC522 chip.
   *
   * @memberof MFRC522
   */
  reset() {
    this.writeRegister(CMD.CommandReg, CMD.PCD_RESETPHASE); // reset chip
    this.writeRegister(CMD.TModeReg, 0x8d); // TAuto=1; timer starts automatically at the end of the transmission in all communication modes at all speeds
    this.writeRegister(CMD.TPrescalerReg, 0x3e); // TPreScaler = TModeReg[3..0]:TPrescalerReg, ie 0x0A9 = 169 => f_timer=40kHz, ie a timer period of 25μs.
    this.writeRegister(CMD.TReloadRegL, 30); // Reload timer with 0x3E8 = 1000, ie 25ms before timeout.
    this.writeRegister(CMD.TReloadRegH, 0);
    this.writeRegister(CMD.TxAutoReg, 0x40); // Default 0x00. Force a 100 % ASK modulation independent of the ModGsPReg register setting
    this.writeRegister(CMD.ModeReg, 0x3d); // Default 0x3F. Set the preset value for the CRC coprocessor for the CalcCRC command to 0x6363 (ISO 14443-3 part 6.2.4)
    this.antennaOn(); // Enable the antenna driver pins TX1 and TX2 (they were disabled by the reset)
  }

  /**
   * Writes a bit to the specified register in the MFRC522 chip.
   * The interface is described in the datasheet section 8.1.2.
   *
   * @param {any} addr
   * @param {any} val
   * @memberof MFRC522
   */
  writeRegister(addr, val) {
    const data = [(addr << 1) & 0x7e, val];
    const uint8Data = Uint8Array.from(data);
    this.spi.write(uint8Data);
  }

  /**
   * Alert card holder that the card has been read.
   */
  alert() {
    if (this.buzzer_pin) {
      setTimeout(() => {
        rpio.write(this.buzzer_pin, 1);
        setTimeout(() => {
          rpio.write(this.buzzer_pin, 0);
          BUZZERCount++;
          if (BUZZERCount == 3) {
            BUZZERCount = 1;
            isCycleEnded = true;
          } else {
            isCycleEnded = false;
            this.alert();
          }
        }, 80);
      }, 180);
    }
  }

  /**
   * Reads a bit from the specified register in the MFRC522 chip.
   * The interface is described in the datasheet section 8.1.2.
   *
   * @param {any} addr
   * @returns
   * @memberof MFRC522
   */
  readRegister(addr) {
    const data = [((addr << 1) & 0x7e) | 0x80, 0];
    const uint8Data = Uint8Array.from(data);
    const uint8DataResponse = this.spi.transfer(uint8Data);
    return uint8DataResponse[1];
  }

  /**
   * Sets the bits given in mask in register reg.
   *
   * @param {any} reg
   * @param {any} mask
   * @memberof MFRC522
   */
  setRegisterBitMask(reg, mask) {
    let response = this.readRegister(reg);
    this.writeRegister(reg, response | mask);
  }

  /**
   * Clears the bits given in mask from register reg.
   *
   * @param {any} reg
   * @param {any} mask
   * @memberof MFRC522
   */
  clearRegisterBitMask(reg, mask) {
    let response = this.readRegister(reg);
    this.writeRegister(reg, response & ~mask);
  }

  /**
   *
   *
   * @memberof MFRC522
   */
  antennaOn() {
    let response = this.readRegister(CMD.TxControlReg);
    if (~(response & 0x03) != 0) {
      this.setRegisterBitMask(CMD.TxControlReg, 0x03);
    }
  }

  /**
   *
   *
   * @memberof MFRC522
   */
  antennaOff() {
    this.clearRegisterBitMask(CMD.TxControlReg, 0x03);
  }

  /**
   *
   * RC522 and ISO14443 card communication
   * @param {any} command - command - MF522 command word
   * @param {any} bitsToSend - sent to the card through the RC522 data
   * @returns {{status: boolean, data: Array, bitSize: number}}
   * @memberof MFRC522
   */
  toCard(command, bitsToSend) {
    let data = [];
    let bitSize = 0;
    let status = ERROR;
    let irqEn = 0x00;
    let waitIRq = 0x00;

    if (command == CMD.PCD_AUTHENT) {
      irqEn = 0x12;
      waitIRq = 0x10;
    }
    if (command == CMD.PCD_TRANSCEIVE) {
      irqEn = 0x77;
      waitIRq = 0x30;
    }
    this.writeRegister(CMD.CommIEnReg, irqEn | 0x80); //Interrupt request is enabled
    this.clearRegisterBitMask(CMD.CommIrqReg, 0x80); //Clears all interrupt request bits
    this.setRegisterBitMask(CMD.FIFOLevelReg, 0x80); //FlushBuffer=1, FIFO initialization
    this.writeRegister(CMD.CommandReg, CMD.PCD_IDLE); // Stop calculating CRC for new content in the FIFO.
    //Write data to the FIFO
    for (let i = 0; i < bitsToSend.length; i++) {
      this.writeRegister(CMD.FIFODataReg, bitsToSend[i]);
    }
    //Excuting command
    this.writeRegister(CMD.CommandReg, command);
    if (command == CMD.PCD_TRANSCEIVE) {
      this.setRegisterBitMask(CMD.BitFramingReg, 0x80); //StartSend=1,transmission of data starts
    }
    //Wait for the received data to complete
    let i = 250; //According to the clock frequency adjustment, operation M1 card maximum waiting time 25ms
    let n = 0;
    do {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250 - i);
      n = this.readRegister(CMD.CommIrqReg);
      i--;
    } while (i != 0 && !(n & 0x01) && !(n & waitIRq));

    this.clearRegisterBitMask(CMD.BitFramingReg, 0x80); //StartSend=0
    if (i != 0) {
      if ((this.readRegister(CMD.ErrorReg) & 0x1b) == 0x00) {
        //BufferOvfl Collerr CRCErr ProtecolErr
        status = OK;
        if (n & irqEn & 0x01) {
          status = ERROR;
        }
        if (command == CMD.PCD_TRANSCEIVE) {
          n = this.readRegister(CMD.FIFOLevelReg);
          let lastBits = this.readRegister(CMD.ControlReg) & 0x07;
          if (lastBits) {
            bitSize = (n - 1) * 8 + lastBits;
          } else {
            bitSize = n * 8;
          }
          if (n == 0) {
            n = 1;
          }
          if (n > 16) {
            n = 16;
          }
          //Reads the data received in the FIFO
          for (let i = 0; i < n; i++) {
            data.push(this.readRegister(CMD.FIFODataReg));
          }
        }
      } else {
        status = ERROR;
      }
    }
    return { status: status, data: data, bitSize: bitSize };
  }

  /**
   * Alert card holder that the card has been read.
   */
  static alert() {
    setTimeout(() => {
      WiringPi.digitalWrite(BUZZER, 1);
      setTimeout(() => {
        WiringPi.digitalWrite(BUZZER, 0);
        BUZZERCount++;
        if (BUZZERCount == 3) {
          BUZZERCount = 1;
          isCycleEnded = true;
        } else {
          isCycleEnded = false;
          this.alert();
        }
      }, 80);
    }, 180);
  }

  /**
   * Find card, read card type
   * TagType - Returns the card type
   * 0x4400 = Mifare_UltraLight
   * 0x0400 = Mifare_One (S50)
   * 0x0200 = Mifare_One (S70)
   * 0x0800 = Mifare_Pro (X)
   * 0x4403 = Mifare_DESFire
   *
   * @returns {{status: *, bitSize: *}}
   * @memberof MFRC522
   */
  findCard() {
    if (isCycleEnded) {
      this.writeRegister(CMD.BitFramingReg, 0x07);
      const tagType = [CMD.PICC_REQIDL];
      let response = this.toCard(CMD.PCD_TRANSCEIVE, tagType);
      if (response.bitSize != 0x10) {
        response.status = ERROR;
      }
      return { status: response.status, bitSize: response.bitSize };
    }
    return { status: null, bitSize: null };
  }

  /**
   * Anti-collision detection, get uid (serial number) of found card
   * 4-bit card to return the serial number, the first five bit for the check bit
   *
   * @returns {{status: *, data: Array, bitSize: *}}
   * @memberof MFRC522
   */
  getUid() {
    this.alert();
    this.writeRegister(CMD.BitFramingReg, 0x00);
    const uid = [CMD.PICC_ANTICOLL, 0x20];
    let response = this.toCard(CMD.PCD_TRANSCEIVE, uid);
    if (response.status) {
      let uidCheck = 0;
      for (let i = 0; i < 4; i++) {
        uidCheck = uidCheck ^ response.data[i];
      }
      if (uidCheck != response.data[4]) {
        response.status = ERROR;
      }
    }
    return { status: response.status, data: response.data };
  }

  /**
   * Use the CRC coprocessor in the MFRC522 to calculate a CRC
   *
   * @param {any} data
   * @returns {array}
   * @memberof MFRC522
   */
  calculateCRC(data) {
    this.clearRegisterBitMask(CMD.DivIrqReg, 0x04); // Clear the CRCIRq interrupt request bit
    this.setRegisterBitMask(CMD.FIFOLevelReg, 0x80); // FlushBuffer = 1, FIFO initialization
    //Write data to the FIFO
    for (let i = 0; i < data.length; i++) {
      this.writeRegister(CMD.FIFODataReg, data[i]);
    }
    this.writeRegister(CMD.CommandReg, CMD.PCD_CALCCRC);
    //Wait for the CRC calculation to complete
    let i = 0xff;
    let n;
    do {
      n = this.readRegister(CMD.DivIrqReg);
      i--;
    } while (i != 0 && !(n & 0x04)); //CRCIrq = 1
    //CRC calculation result
    return [
      this.readRegister(CMD.CRCResultRegL),
      this.readRegister(CMD.CRCResultRegM)
    ];
  }

  /**
   * Select card by, returns card memory capacity
   *
   * @param {any} uid
   * @returns
   * @memberof MFRC522
   */
  selectCard(uid) {
    let buffer = [CMD.PICC_SELECTTAG, 0x70];
    for (let i = 0; i < 5; i++) {
      buffer.push(uid[i]);
    }
    buffer = buffer.concat(this.calculateCRC(buffer));
    let response = this.toCard(CMD.PCD_TRANSCEIVE, buffer);
    let memoryCapacity = 0;
    if (response.status && response.bitSize == 0x18) {
      memoryCapacity = response.data[0];
    }
    return memoryCapacity;
  }

  /**
   * Verify the card password
   * Auth at Block N+1 with Key from Block N
   * Examle: Block 7 has Credentials from Block 8, in Block 7 there are 2 Keys A and B
   * @param address - block address
   * @param key - password for block
   * @param uid - card serial number, 4 bit
   * @returns {*}
   * @memberof MFRC522
   */
  authenticate(address, key, uid) {
    /* Password authentication mode (A or B)
     * 0x60 = Verify the A key are the first 6 bit
     * 0x61 = Verify the B key are the last 6 bit
     * Second bit is the block address
     */
    let buffer = [CMD.PICC_AUTHENT1A, address];
    // Key default 6 bit of 0xFF
    for (let i = 0; i < key.length; i++) {
      buffer.push(key[i]);
    }
    // Next we append the first 4 bit of the UID
    for (let j = 0; j < 4; j++) {
      buffer.push(uid[j]);
    }
    // Now we start the authentication itself
    let response = this.toCard(CMD.PCD_AUTHENT, buffer);
    if (!(this.readRegister(CMD.Status2Reg) & 0x08)) {
      response.status = ERROR;
    }
    return response.status;
  }

  /**
   *
   *
   * @memberof MFRC522
   */
  stopCrypto() {
    this.clearRegisterBitMask(CMD.Status2Reg, 0x08);
  }

  /**
   * Get Data for Block
   *
   * @param {any} address
   * @returns
   * @memberof MFRC522
   */
  getDataForBlock(address) {
    let request = [CMD.PICC_READ, address];
    request = request.concat(this.calculateCRC(request));
    let response = this.toCard(CMD.PCD_TRANSCEIVE, request);
    if (!response.status) {
      console.log(
        "Error while reading! Status: " +
          response.status +
          " Data: " +
          response.data +
          " BitSize: " +
          response.bitSize
      );
    }
    return response.data;
  }

  /**
   *
   *
   * @param {any} buffer
   * @returns
   * @memberof MFRC522
   */
  appendCRCtoBufferAndSendToCard(buffer) {
    buffer = buffer.concat(this.calculateCRC(buffer));
    let response = this.toCard(CMD.PCD_TRANSCEIVE, buffer);
    if (
      !response.status ||
      response.bitSize != 4 ||
      (response.data[0] & 0x0f) != 0x0a
    ) {
      console.log(
        "Error while writing! Status: " +
          response.status +
          " Data: " +
          response.data +
          " BitSize: " +
          response.bitSize
      );
      response.status = ERROR;
    }
    return response;
  }

  /**
   * Write Data To Block
   *
   * @param {any} address
   * @param {any} sixteenBits
   * @memberof MFRC522
   */
  writeDataToBlock(address, sixteenBits) {
    let buffer = [];
    buffer.push(CMD.PICC_WRITE);
    buffer.push(address);
    let response = this.appendCRCtoBufferAndSendToCard(buffer);
    if (response.status) {
      buffer = [];
      // Write 16 bit of data to the FIFO
      for (let i = 0; i < 16; i++) {
        buffer.push(sixteenBits[i]);
      }
      response = this.appendCRCtoBufferAndSendToCard(buffer);
      if (response.status) {
        console.log("Data written successfully");
      }
    }
  }
}

module.exports = MFRC522;
