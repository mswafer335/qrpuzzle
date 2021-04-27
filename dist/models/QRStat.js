"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const QRStatSchema = new mongoose_1.Schema({
    date: { type: Date },
    day: {
        type: Number,
    },
    month: {
        type: Number,
    },
    year: {
        type: Number,
    },
    PrizesActivated: {
        type: Number,
        default: 0,
    },
    PrizesClaimed: { type: Number, default: 0 },
    WinningsClaimed: { type: Number, default: 0 },
    TotalWinnings: {
        type: Number,
        default: 0,
    },
    newUsers: {
        type: Number,
    },
});
const QRStat = mongoose_1.model("qrstat", QRStatSchema);
exports.default = QRStat;
//# sourceMappingURL=QRStat.js.map