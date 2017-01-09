"use strict";
const CMD = require("./commands");
const WiringPi = require("wiring-pi");

class MFRC522 {

    constructor () {
        this.NRSTPD = 25; /// GPIO 25
        this.OK = true;
        this.ERROR = false;
        this.wpi = WiringPi;
        this.wpi.wiringPiSPISetup(0, 1000000);
        this.wpi.setup("gpio");
        this.wpi.pinMode(this.NRSTPD, this.wpi.OUTPUT);
        this.wpi.digitalWrite(this.NRSTPD, this.wpi.HIGH);
        this.init();
    }

    /**
     * Initializes the MFRC522 chip.
     */
    init () {
        this.reset();
        this.writeRegister(CMD.TModeReg, 0x8D); // TAuto=1; timer starts automatically at the end of the transmission in all communication modes at all speeds
        this.writeRegister(CMD.TPrescalerReg, 0x3E); // TPreScaler = TModeReg[3..0]:TPrescalerReg, ie 0x0A9 = 169 => f_timer=40kHz, ie a timer period of 25μs.
        this.writeRegister(CMD.TReloadRegL, 30); // Reload timer with 0x3E8 = 1000, ie 25ms before timeout.
        this.writeRegister(CMD.TReloadRegH, 0);
        this.writeRegister(CMD.TxAutoReg, 0x40); // Default 0x00. Force a 100 % ASK modulation independent of the ModGsPReg register setting
        this.writeRegister(CMD.ModeReg, 0x3D); // Default 0x3F. Set the preset value for the CRC coprocessor for the CalcCRC command to 0x6363 (ISO 14443-3 part 6.2.4)
        this.antennaOn(); // Enable the antenna driver pins TX1 and TX2 (they were disabled by the reset)
    }

    reset () {
        this.writeRegister(CMD.CommandReg, CMD.PCD_RESETPHASE);
    }

    /**
     * Writes a byte to the specified register in the MFRC522 chip.
     * The interface is described in the datasheet section 8.1.2.
     * @param addr
     * @param val
     */
    writeRegister (addr, val) {
        const data = [(addr << 1) & 0x7E, val];
        const uint8Data = Uint8Array.from(data);
        this.wpi.wiringPiSPIDataRW(0, uint8Data);
    }

    /**
     * Reads a byte from the specified register in the MFRC522 chip.
     * The interface is described in the datasheet section 8.1.2.
     * @param addr
     * @returns {*}
     */
    readRegister (addr) {
        const data = [((addr << 1) & 0x7E) | 0x80, 0];
        const uint8Data = Uint8Array.from(data);
        this.wpi.wiringPiSPIDataRW(0, uint8Data);
        return uint8Data[1]
    }

    /**
     * Sets the bits given in mask in register reg.
     * @param reg
     * @param mask
     */
    setRegisterBitMask (reg, mask) {
        let response = this.readRegister(reg);
        this.writeRegister(reg, response | mask);
    }

    /**
     * Clears the bits given in mask from register reg.
     * @param reg
     * @param mask
     */
    clearRegisterBitMask (reg, mask) {
        let response = this.readRegister(reg);
        this.writeRegister(reg, response & (~mask));
    }

    antennaOn () {
        let response = this.readRegister(CMD.TxControlReg);
        if (~(response & 0x03) != 0) {
            this.setRegisterBitMask(CMD.TxControlReg, 0x03);
        }
    }

    antennaOff () {
        this.clearRegisterBitMask(CMD.TxControlReg, 0x03);
    }

    /**
     * RC522 and ISO14443 card communication
     * @param command - command - MF522 command word
     * @param bitsToSend - sent to the card through the RC522 data
     * @returns {{status: boolean, data: Array, bitSize: number}}
     */
    toCard (command, bitsToSend) {
        let data = [];
        let bitSize = 0;
        let status = this.ERROR;
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
        let i = 2000; //According to the clock frequency adjustment, operation M1 card maximum waiting time 25ms
        let n = 0;
        do
        {
            n = this.readRegister(CMD.CommIrqReg);
            i--;
        }
        while ((i != 0) && !(n & 0x01) && !(n & waitIRq));

        this.clearRegisterBitMask(CMD.BitFramingReg, 0x80); //StartSend=0
        if (i != 0) {
            if ((this.readRegister(CMD.ErrorReg) & 0x1B) == 0x00) { //BufferOvfl Collerr CRCErr ProtecolErr
                status = this.OK;
                if (n & irqEn & 0x01) {
                    status = this.ERROR;
                }
                if (command == CMD.PCD_TRANSCEIVE) {
                    n = this.readRegister(CMD.FIFOLevelReg);
                    let lastBits = this.readRegister(CMD.ControlReg) & 0x07;
                    if (lastBits) {
                        bitSize = (n - 1) * 8 + lastBits;
                    }
                    else {
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
            }
            else {
                status = this.ERROR;
            }
        }
        return {status: status, data: data, bitSize: bitSize};
    }

    /**
     *
     * Find card, read card type
     * TagType - Returns the card type
     * 0x4400 = Mifare_UltraLight
     * 0x0400 = Mifare_One (S50)
     * 0x0200 = Mifare_One (S70)
     * 0x0800 = Mifare_Pro (X)
     * 0x4403 = Mifare_DESFire
     * @returns {{status: *, bitSize: *}}
     */
    findCard () {
        this.writeRegister(CMD.BitFramingReg, 0x07);
        const tagType = [CMD.PICC_REQIDL];
        let response = this.toCard(CMD.PCD_TRANSCEIVE, tagType);
        if (response.bitSize != 0x10) {
            response.status = this.ERROR;
        }
        return {status: response.status, bitSize: response.bitSize};
    }

    /**
     * Anti-collision detection, get uid (serial number) of found card
     * 4-byte card to return the serial number, the first five bytes for the check byte
     * @returns {{status: *, data: Array, bitSize: *}}
     */
    getUid () {
        this.writeRegister(CMD.BitFramingReg, 0x00);
        const uid = [CMD.PICC_ANTICOLL, 0x20];
        let response = this.toCard(CMD.PCD_TRANSCEIVE, uid);
        if (response.status) {
            let uidCheck = 0;
            for (let i = 0; i < 4; i++) {
                uidCheck = uidCheck ^ response.data[i];
            }
            if (uidCheck != response.data[4]) {
                response.status = this.ERROR;
            }
        }
        return {status: response.status, data: response.data};
    }

    /**
     * Use the CRC coprocessor in the MFRC522 to calculate a CRC
     * @param data
     * @returns {Array}
     */
    calculateCRC (data) {
        this.clearRegisterBitMask(CMD.DivIrqReg, 0x04); // Clear the CRCIRq interrupt request bit
        this.setRegisterBitMask(CMD.FIFOLevelReg, 0x80); // FlushBuffer = 1, FIFO initialization
        //Write data to the FIFO
        for (let i = 0; i < data.length; i++) {
            this.writeRegister(CMD.FIFODataReg, data[i]);
        }
        this.writeRegister(CMD.CommandReg, CMD.PCD_CALCCRC);
        //Wait for the CRC calculation to complete
        let i = 0xFF;
        let n;
        do
        {
            n = this.readRegister(CMD.DivIrqReg);
            i--;
        }
        while ((i != 0) && !(n & 0x04)); //CRCIrq = 1
        //CRC calculation result
        return [this.readRegister(CMD.CRCResultRegL), this.readRegister(CMD.CRCResultRegM)];
    }

    /**
     * Select card by, returns card memory capacity
     * @param uid
     * @returns {*}
     */
    selectCard (uid) {
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
     * @param address - block address
     * @param key - password for block
     * @param uid - card serial number, 4 bytes
     * @returns {*}
     */
    authenticate (address, key, uid) {
        /* first byte is password authentication mode (A or B)
         * 0x60 = Verify the A key
         * 0x61 = Verify the B key
         * Second byte is the block address
         */
        let buffer = [CMD.PICC_AUTHENT1A, address];
        // Now we append the authKey which is by default 6 bytes of 0xFF
        for (let i = 0; i < key.length; i++) {
            buffer.push(key[i]);
        }
        // Next we append the first 4 bytes of the UID
        for (let j = 0; j < 4; j++) {
            buffer.push(uid[j]);
        }
        // Now we start the authentication itself
        let response = this.toCard(CMD.PCD_AUTHENT, buffer);
        if (!(this.readRegister(CMD.Status2Reg) & 0x08)) {
            response.status = this.ERROR;
        }
        return response.status;
    }

    stopCrypto () {
        this.clearRegisterBitMask(CMD.Status2Reg, 0x08);
    }

    getDataForBlock (address) {
        let request = [CMD.PICC_READ, address];
        request = request.concat(this.calculateCRC(request));
        let response = this.toCard(CMD.PCD_TRANSCEIVE, request);
        if (!response.status) {
            console.log("Error while reading! Status: " + response.status + " Data: " + response.data + " BitSize: " + response.bitSize);
        }
        return response.data;
    }

    appendCRCtoBufferAndSendToCard (buffer) {
        buffer = buffer.concat(this.calculateCRC(buffer));
        let response = this.toCard(CMD.PCD_TRANSCEIVE, buffer);
        if ((!response.status) || (response.bitSize != 4) || ((response.data[0] & 0x0F) != 0x0A)) {
            console.log("Error while writing! Status: " + response.status + " Data: " + response.data + " BitSize: " + response.bitSize);
            response.status = this.ERROR;
        }
        return response;
    }

    writeDataToBlock (address, sixteenBits) {
        let buffer = [];
        buffer.push(CMD.PICC_WRITE);
        buffer.push(address);
        let response = this.appendCRCtoBufferAndSendToCard(buffer);
        if (response.status) {
            buffer = [];
            // Write 16 bytes of data to the FIFO
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