module.exports = {
    NRSTPD: 25, /// GPIO 25
    MAX_LEN: 16,

    PCD_IDLE: 0x00,
    PCD_AUTHENT: 0x0E,
    PCD_RECEIVE: 0x08,
    PCD_TRANSMIT: 0x04,
    PCD_TRANSCEIVE: 0x0C,
    PCD_RESETPHASE: 0x0F,
    PCD_CALCCRC: 0x03,

    PICC_REQIDL: 0x26,
    PICC_REQALL: 0x52,
    PICC_ANTICOLL: 0x93,
    PICC_SELECTTAG: 0x93,
    PICC_AUTHENT1A: 0x60,
    PICC_AUTHENT1B: 0x61,
    PICC_READ: 0x30,
    PICC_WRITE: 0xA0,
    PICC_DECREMENT: 0xC0,
    PICC_INCREMENT: 0xC1,
    PICC_RESTORE: 0xC2,
    PICC_TRANSFER: 0xB0,
    PICC_HALT: 0x50,

    MI_OK: 0,
    MI_NOTAGERR: 1,
    MI_ERR: 2,

    Reserved00: 0x00,
    CommandReg: 0x01,
    CommIEnReg: 0x02,
    DivlEnReg: 0x03,
    CommIrqReg: 0x04,
    DivIrqReg: 0x05,
    ErrorReg: 0x06,
    Status1Reg: 0x07,
    Status2Reg: 0x08,
    FIFODataReg: 0x09,
    FIFOLevelReg: 0x0A,
    WaterLevelReg: 0x0B,
    ControlReg: 0x0C,
    BitFramingReg: 0x0D,
    CollReg: 0x0E,
    Reserved01: 0x0F,

    Reserved10: 0x10,
    ModeReg: 0x11,
    TxModeReg: 0x12,
    RxModeReg: 0x13,
    TxControlReg: 0x14,
    TxAutoReg: 0x15,
    TxSelReg: 0x16,
    RxSelReg: 0x17,
    RxThresholdReg: 0x18,
    DemodReg: 0x19,
    Reserved11: 0x1A,
    Reserved12: 0x1B,
    MifareReg: 0x1C,
    Reserved13: 0x1D,
    Reserved14: 0x1E,
    SerialSpeedReg: 0x1F,

    Reserved20: 0x20,
    CRCResultRegM: 0x21,
    CRCResultRegL: 0x22,
    Reserved21: 0x23,
    ModWidthReg: 0x24,
    Reserved22: 0x25,
    RFCfgReg: 0x26,
    GsNReg: 0x27,
    CWGsPReg: 0x28,
    ModGsPReg: 0x29,
    TModeReg: 0x2A,
    TPrescalerReg: 0x2B,
    TReloadRegH: 0x2C,
    TReloadRegL: 0x2D,
    TCounterValueRegH: 0x2E,
    TCounterValueRegL: 0x2F,

    Reserved30: 0x30,
    TestSel1Reg: 0x31,
    TestSel2Reg: 0x32,
    TestPinEnReg: 0x33,
    TestPinValueReg: 0x34,
    TestBusReg: 0x35,
    AutoTestReg: 0x36,
    VersionReg: 0x37,
    AnalogTestReg: 0x38,
    TestDAC1Reg: 0x39,
    TestDAC2Reg: 0x3A,
    TestADCReg: 0x3B,
    Reserved31: 0x3C,
    Reserved32: 0x3D,
    Reserved33: 0x3E,
    Reserved34: 0x3F,

    init: function () {
        this.wpi = require("wiring-pi");
        this.wpi.wiringPiSPISetup(0, 1000000);
        this.wpi.setup("gpio");
        this.wpi.pinMode(this.NRSTPD, this.wpi.OUTPUT);
        this.wpi.digitalWrite(this.NRSTPD, this.wpi.HIGH);
        this.reset();
        this.writeRegister(this.TModeReg, 0x8D); // TAuto=1; timer starts automatically at the end of the transmission in all communication modes at all speeds
        this.writeRegister(this.TPrescalerReg, 0x3E); // TPreScaler = TModeReg[3..0]:TPrescalerReg, ie 0x0A9 = 169 => f_timer=40kHz, ie a timer period of 25μs.
        this.writeRegister(this.TReloadRegL, 30); // Reload timer with 0x3E8 = 1000, ie 25ms before timeout.
        this.writeRegister(this.TReloadRegH, 0);
        this.writeRegister(this.TxAutoReg, 0x40); // Default 0x00. Force a 100 % ASK modulation independent of the ModGsPReg register setting
        this.writeRegister(this.ModeReg, 0x3D); // Default 0x3F. Set the preset value for the CRC coprocessor for the CalcCRC command to 0x6363 (ISO 14443-3 part 6.2.4)
        this.antennaOn(); // Enable the antenna driver pins TX1 and TX2 (they were disabled by the reset)
    },

    reset: function () {
        this.writeRegister(this.CommandReg, this.PCD_RESETPHASE);
    },

    writeRegister: function (addr, val) {
        var data = [(addr << 1) & 0x7E, val];
        var uint8Data = Uint8Array.from(data);
        this.wpi.wiringPiSPIDataRW(0, uint8Data);
    },

    readRegister: function (addr) {
        var data = [((addr << 1) & 0x7E) | 0x80, 0];
        var uint8Data = Uint8Array.from(data);
        this.wpi.wiringPiSPIDataRW(0, uint8Data);
        return uint8Data[1]
    },

    setBitMask: function (reg, mask) {
        var response = this.readRegister(reg);
        this.writeRegister(reg, response | mask);
    },

    clearBitMask: function (reg, mask) {
        var response = this.readRegister(reg);
        this.writeRegister(reg, response & (~mask));
    },

    antennaOn: function () {
        var response = this.readRegister(this.TxControlReg);
        if (~(response & 0x03) != 0) {
            this.setBitMask(this.TxControlReg, 0x03);
        }
    },

    antennaOff: function () {
        this.clearBitMask(this.TxControlReg, 0x03);
    },

    toCard: function (command, bitsToSend) {
        var data = [];
        var bitSize = 0;
        var status = this.MI_ERR;
        var irqEn = 0x00;
        var waitIRq = 0x00;
        var lastBits = null;
        var n = 0;
        if (command == this.PCD_AUTHENT) {
            irqEn = 0x12;
            waitIRq = 0x10;
        }
        if (command == this.PCD_TRANSCEIVE) {
            irqEn = 0x77;
            waitIRq = 0x30;
        }
        this.writeRegister(this.CommIEnReg, irqEn | 0x80); //Interrupt request is enabled
        this.clearBitMask(this.CommIrqReg, 0x80); //Clears all interrupt request bits
        this.setBitMask(this.FIFOLevelReg, 0x80); //FlushBuffer=1, FIFO initialization
        this.writeRegister(this.CommandReg, this.PCD_IDLE); // Stop calculating CRC for new content in the FIFO.
        //Write data to the FIFO
        for (var i = 0; i < bitsToSend.length; i++) {
            this.writeRegister(this.FIFODataReg, bitsToSend[i]);
        }
        //Excuting command
        this.writeRegister(this.CommandReg, command);
        if (command == this.PCD_TRANSCEIVE) {
            this.setBitMask(this.BitFramingReg, 0x80); //StartSend=1,transmission of data starts
        }
        //Wait for the received data to complete
        i = 2000; //According to the clock frequency adjustment, operation M1 card maximum waiting time 25ms
        do
        {
            n = this.readRegister(this.CommIrqReg);
            i--;
        }
        while ((i != 0) && !(n & 0x01) && !(n & waitIRq));

        this.clearBitMask(this.BitFramingReg, 0x80); //StartSend=0
        if (i != 0) {
            if ((this.readRegister(this.ErrorReg) & 0x1B) == 0x00) { //BufferOvfl Collerr CRCErr ProtecolErr
                status = this.MI_OK;
                if (n & irqEn & 0x01) {
                    status = this.MI_NOTAGERR;
                }
                if (command == this.PCD_TRANSCEIVE) {
                    n = this.readRegister(this.FIFOLevelReg);
                    lastBits = this.readRegister(this.ControlReg) & 0x07;
                    if (lastBits) {
                        bitSize = (n - 1) * 8 + lastBits;
                    }
                    else {
                        bitSize = n * 8;
                    }
                    if (n == 0) {
                        n = 1;
                    }
                    if (n > this.MAX_LEN) {
                        n = this.MAX_LEN;
                    }
                    //Reads the data received in the FIFO
                    for (i = 0; i < n; i++) {
                        data.push(this.readRegister(this.FIFODataReg));
                    }
                }
            }
            else {
                status = this.MI_ERR;
            }
        }
        return {status: status, data: data, bitSize: bitSize};
    },

    request: function (reqMode) {
        this.writeRegister(this.BitFramingReg, 0x07);
        var TagType = [];
        TagType.push(reqMode);
        var response = this.toCard(this.PCD_TRANSCEIVE, TagType);
        if ((response.status != this.MI_OK) || (response.bitSize != 0x10)) {
            status = this.MI_ERR;
        }
        return {status: response.status, data: response.data, bitSize: response.bitSize};
    },

    anticoll: function () {
        this.writeRegister(this.BitFramingReg, 0x00);
        var uid = [];
        uid.push(this.PICC_ANTICOLL);
        uid.push(0x20);
        var response = this.toCard(this.PCD_TRANSCEIVE, uid);
        var status = response.status;
        var data = response.data;
        var bitSize = response.bitSize;
        if (status == this.MI_OK) {
            var uidCheck = 0;
            for (var i = 0; i < 4; i++) {
                uidCheck = uidCheck ^ data[i];
            }
            if (uidCheck != data[i]) {
                status = this.MI_ERR;
            }
        }
        return {status: status, data: data, bitSize: bitSize};
    },

    calculateCRC: function (data) {
        this.clearBitMask(this.DivIrqReg, 0x04); // Clear the CRCIRq interrupt request bit
        this.setBitMask(this.FIFOLevelReg, 0x80); // FlushBuffer = 1, FIFO initialization
        //Write data to the FIFO
        for (var i = 0; i < data.length; i++) {
            this.writeRegister(this.FIFODataReg, data[i]);
        }
        this.writeRegister(this.CommandReg, this.PCD_CALCCRC);
        //Wait for the CRC calculation to complete
        i = 0xFF;
        while (true) {
            var n = this.readRegister(this.DivIrqReg);
            if (n & 0x04) { // CRCIRq bit set - calculation done
                break;
            }
            if (--i == 0) { // The emergency break. We will eventually terminate on this one after 89ms. Communication with the MFRC522 might be down.
                console.log("CRC Timeout in communication.")
                break;
            }
        }
        var crcBits = [];
        //CRC calculation result
        crcBits.push(this.readRegister(this.CRCResultRegL));
        crcBits.push(this.readRegister(this.CRCResultRegM));
        return crcBits;
    },

    selectTag: function (uid) {
        var buffer = [];
        buffer.push(this.PICC_SELECTTAG);
        buffer.push(0x70);
        for (var i = 0; i < 5; i++) {
            buffer.push(uid[i]);
        }
        var crcBits = this.calculateCRC(buffer);
        buffer.push(crcBits[0]);
        buffer.push(crcBits[1]);
        var response = this.toCard(this.PCD_TRANSCEIVE, buffer);
        var status = response.status;
        var data = response.data;
        var bitSize = response.bitSize;
        if (status == this.MI_OK && bitSize == 0x18) {
            return data[0];
        }
        else {
            return 0;
        }
    },

    auth: function (authMode, address, sectorKey, uid) {
        var buffer = [];
        //# First byte should be the authMode (A or B)
        buffer.push(authMode);
        //# Second byte is the trailerBlock (usually 7)
        buffer.push(address);
        //# Now we need to append the authKey which usually is 6 bytes of 0xFF
        for (var i = 0; i < sectorKey.length; i++) {
            buffer.push(sectorKey[i]);
        }
        // Next we append the first 4 bytes of the UID
        for (var j = 0; j < 4; j++) {
            buffer.push(uid[j]);
        }
        // Now we start the authentication itself
        var response = this.toCard(this.PCD_AUTHENT, buffer);
        var status = response.status;
        if ((status != this.MI_OK) || (!(this.readRegister(this.Status2Reg) & 0x08))) {
            status = this.MI_ERR;
        }
        return status;
    },

    stopCrypto1: function () {
        this.clearBitMask(this.Status2Reg, 0x08);
    },

    readDataFromSector: function (address) {
        var request = [];
        request.push(this.PICC_READ);
        request.push(address);
        var crcBits = this.calculateCRC(request);
        request.push(crcBits[0]);
        request.push(crcBits[1]);
        var response = this.toCard(this.PCD_TRANSCEIVE, request);
        var status = response.status;
        var data = response.data;
        var bitSize = response.bitSize;
        if ((status != this.MI_OK)) {
            console.log("Error while reading! Status: " + status + " Data: " + data + " BitSize: " + bitSize);
        }
        var i = 0;
        if (data.length == 16) {
            console.log("SectorAddress: " + address + " Data: " + data);
        }
    },

    writeDataToSector: function (address, sixteenBits) {
        var buffer = [];
        buffer.push(this.PICC_WRITE);
        buffer.push(address);
        var crc = this.calculateCRC(buffer);
        buffer.push(crc[0]);
        buffer.push(crc[1]);
        var response = this.toCard(this.PCD_TRANSCEIVE, buffer);
        var status = response.status;
        var data = response.data;
        var bitSize = response.bitSize;
        if ((status != this.MI_OK) || (bitSize != 4) || ((data[0] & 0x0F) != 0x0A)) {
            console.log("Error while writing! Status: " + status + " Data: " + data + " BitSize: " + bitSize);
            status = this.MI_ERR;
        }
        if (status == this.MI_OK) {
            buffer = [];
            // Write 16 bytes of data to the FIFO
            for (var i = 0; i < 16; i++) {
                buffer.push(sixteenBits[i]);
            }
            crc = this.calculateCRC(buffer);
            buffer.push(crc[0]);
            buffer.push(crc[1]);
            response = this.toCard(this.PCD_TRANSCEIVE, buffer);
            status = response.status;
            data = response.data;
            bitSize = response.bitSize;
            if ((status != this.MI_OK) || (bitSize != 4) || ((data[0] & 0x0F) != 0x0A)) {
                console.log("Error while writing! Status: " + status + " Data: " + data + " BitSize: " + bitSize);
                status = this.MI_ERR;
            }
            if (status == this.MI_OK) {
                console.log("Data written successfully");
            }
        }
    },

    dumpClassic1K: function (key, uid) {
        var i = 0;
        while (i < 64) {
            var status = this.auth(this.PICC_AUTHENT1A, i, key, uid);
            if (status == this.MI_OK) {
                this.readDataFromSector(i);
            }
            else {
                console.log("Authentication Error");
            }
            i++;
        }
    }
};