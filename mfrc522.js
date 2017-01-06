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
        this.write(this.TModeReg, 0x8D);
        this.write(this.TPrescalerReg, 0x3E);
        this.write(this.TReloadRegL, 30);
        this.write(this.TReloadRegH, 0);
        this.write(this.TxAutoReg, 0x40);
        this.write(this.ModeReg, 0x3D);
        this.antennaOn();
    },

    reset: function () {
        this.write(this.CommandReg, this.PCD_RESETPHASE);
    },

    write: function (addr, val) {
        var data = [(addr << 1) & 0x7E, val];
        var uint8Data = Uint8Array.from(data);
        this.wpi.wiringPiSPIDataRW(0, uint8Data);
    },

    read: function (addr) {
        var data = [((addr << 1) & 0x7E) | 0x80, 0];
        var uint8Data = Uint8Array.from(data);
        this.wpi.wiringPiSPIDataRW(0, uint8Data);
        return uint8Data[1]
    },

    setBitMask: function (reg, mask) {
        var response = this.read(reg);
        this.write(reg, response | mask);
    },

    clearBitMask: function (reg, mask) {
        var response = this.read(reg);
        this.write(reg, response & (~mask));
    },

    antennaOn: function () {
        var response = this.read(this.TxControlReg);
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
        var i = 0;
        if (command == this.PCD_AUTHENT) {
            irqEn = 0x12;
            waitIRq = 0x10;
        }
        if (command == this.PCD_TRANSCEIVE) {
            irqEn = 0x77;
            waitIRq = 0x30;
        }
        this.write(this.CommIEnReg, irqEn | 0x80); //Interrupt request is enabled
        this.clearBitMask(this.CommIrqReg, 0x80); //Clears all interrupt request bits
        this.setBitMask(this.FIFOLevelReg, 0x80); //FlushBuffer=1, FIFO initialization
        this.write(this.CommandReg, this.PCD_IDLE); //NO action;Cancel the current command	???
        //Write data to the FIFO
        while (i < bitsToSend.length) {
            this.write(this.FIFODataReg, bitsToSend[i]);
            i++;
        }
        //Excuting command
        this.write(this.CommandReg, command);
        if (command == this.PCD_TRANSCEIVE) {
            this.setBitMask(this.BitFramingReg, 0x80); //StartSend=1,transmission of data starts
        }
        //Wait for the received data to complete
        i = 2000; //According to the clock frequency adjustment, operation M1 card maximum waiting time 25ms
        while (true) {
            n = this.read(this.CommIrqReg);
            i--;
            if (~((i != 0) && ~(n & 0x01) && ~(n & waitIRq)) != 0) {
                break;
            }
        }
        this.clearBitMask(this.BitFramingReg, 0x80); //StartSend=0
        if (i != 0) {
            if ((this.read(this.ErrorReg) & 0x1B) == 0x00) { //BufferOvfl Collerr CRCErr ProtecolErr
                status = this.MI_OK;
                if ((n & irqEn & 0x01) != 0) {
                    status = this.MI_NOTAGERR;
                }
                if (command == this.PCD_TRANSCEIVE) {
                    n = this.read(this.FIFOLevelReg);
                    lastBits = this.read(this.ControlReg) & 0x07;
                    if (lastBits != 0) {
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
                    i = 0;
                    //Reads the data received in the FIFO
                    while (i < n) {
                        data.push(this.read(this.FIFODataReg));
                        i++;
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
        this.write(this.BitFramingReg, 0x07);
        var TagType = [];
        TagType.push(reqMode);
        var response = this.toCard(this.PCD_TRANSCEIVE, TagType);
        if ((response.status != this.MI_OK) || (response.bitSize != 0x10)) {
            status = this.MI_ERR;
        }
        return {status: response.status, data: response.data, bitSize: response.bitSize};
    },

    anticoll: function () {
        this.write(this.BitFramingReg, 0x00);
        var uid = [];
        uid.push(this.PICC_ANTICOLL);
        uid.push(0x20);
        var response = this.toCard(this.PCD_TRANSCEIVE, uid);
        var status = response.status;
        var data = response.data;
        var bitSize = response.bitSize;
        if (status == this.MI_OK) {
            var i = 0;
            var uidCheck = 0;
            if (data.length == 5) {
                while (i < 4) {
                    uidCheck = uidCheck ^ data[i];
                    i++;
                }
                if (uidCheck != data[i]) {
                    status = this.MI_ERR;
                }
            }
            else {
                status = this.MI_ERR;
            }
        }
        return {status: status, data: data, bitSize: bitSize};
    },

    calculateCRC: function (data) {
        this.clearBitMask(this.DivIrqReg, 0x04); //CRCIrq = 0
        this.setBitMask(this.FIFOLevelReg, 0x80); //Clear FIFO pointer
        var i = 0;
        //Write data to the FIFO
        while (i < data.length) {
            this.write(this.FIFODataReg, data[i]);
            i++;
        }
        this.write(this.CommandReg, this.PCD_CALCCRC);
        //Wait for the CRC calculation to complete
        i = 0xFF;
        while (true) {
            var n = this.read(this.DivIrqReg);
            i--;
            if (!((i != 0) && !((n & 0x04) != 0))) {
                break
            }
        }
        var crcBits = [];
        //CRC calculation result
        crcBits.push(this.read(this.CRCResultRegL));
        crcBits.push(this.read(this.CRCResultRegM));
        return crcBits;
    },

    selectTag: function (uid) {
        var buffer = [];
        buffer.push(this.PICC_SELECTTAG);
        buffer.push(0x70);
        var i = 0;
        while (i < 5) {
            buffer.push(uid[i]);
            i++;
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

    auth: function (authMode, SectorAddress, SectorKey, uid) {
        var buffer = [];
        //# First byte should be the authMode (A or B)
        buffer.push(authMode);
        //# Second byte is the trailerBlock (usually 7)
        buffer.push(SectorAddress);
        //# Now we need to append the authKey which usually is 6 bytes of 0xFF
        var i = 0;
        while (i < SectorKey.length) {
            buffer.push(SectorKey[i]);
            i++;
        }
        i = 0;
        // Next we append the first 4 bytes of the UID
        while (i < 4) {
            buffer.push(uid[i]);
            i++;
        }
        // Now we start the authentication itself
        var response = this.toCard(this.PCD_AUTHENT, buffer);
        var status = response.status;
        if (!(status == this.MI_OK)) {
            console.log("Authentication Error");
        }
        if (!(this.read(this.Status2Reg) & 0x08) != 0) {
            console.log("Authentication Error Status 2");
        }
        return status;
    },

    stopCrypto1: function () {
        this.clearBitMask(this.Status2Reg, 0x08);
    },

    readDataFromSector: function (SectorAddress) {
        var request = [];
        request.push(this.PICC_READ);
        request.push(SectorAddress);
        var crcBits = this.calculateCRC(request);
        request.push(crcBits[0]);
        request.push(crcBits[1]);
        var response = this.toCard(this.PCD_TRANSCEIVE, request);
        var status = response.status;
        var data = response.data;
        var bitSize = response.bitSize;
        if (!(status == this.MI_OK)) {
            console.log("Error while reading! Status: " + status + " Data: " + data + " BitSize: " + bitSize);
        }
        var i = 0;
        if (data.length == 16) {
            console.log("SectorAddress: " + SectorAddress + " Data: " + data);
        }
    },

    writeDataToSector: function (SectorAddress, sixteenBits) {
        var buffer = [];
        buffer.push(this.PICC_WRITE);
        buffer.push(SectorAddress);
        var crc = this.calculateCRC(buffer);
        buffer.push(crc[0]);
        buffer.push(crc[1]);
        var response = this.toCard(this.PCD_TRANSCEIVE, buffer);
        var status = response.status;
        var data = response.data;
        var bitSize = response.bitSize;
        if (!(status == this.MI_OK) || !(bitSize == 4) || !((data[0] & 0x0F) == 0x0A)) {
            console.log("Error while writing! Status: " + status + " Data: " + data + " BitSize: " + bitSize);
        }
        if (status == this.MI_OK) {
            var i = 0;
            buffer = [];
            // Write 16 bytes of data to the FIFO
            while (i < 16) {
                buffer.push(sixteenBits[i]);
                i++;
            }
            crc = this.calculateCRC(buffer);
            buffer.push(crc[0]);
            buffer.push(crc[1]);
            response = this.toCard(this.PCD_TRANSCEIVE, buffer);
            status = response.status;
            data = response.data;
            bitSize = response.bitSize;
            if (!(status == this.MI_OK) || !(bitSize == 4) || !((data[0] & 0x0F) == 0x0A)) {
                console.log("Error while writing! Status: " + status + " Data: " + data + " BitSize: " + bitSize);
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
                console.log("Authentication error");
            }
            i++;
        }
    }
};