"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PrizeSchema = new mongoose_1.Schema({
    code: {
        type: String,
    },
    date: {
        type: Date,
    },
    value: {
        type: Number,
    },
    printed: {
        type: Boolean,
        default: false,
    },
    validated: {
        type: Boolean,
        default: false,
    },
    qr: { type: mongoose_1.Schema.Types.ObjectId, ref: "qr", default: undefined },
    player: { type: mongoose_1.Schema.Types.ObjectId, ref: "player", default: undefined },
    payed: {
        type: Boolean,
        default: false,
    },
});
exports.default = mongoose_1.model("prize", PrizeSchema);
//# sourceMappingURL=Prize.js.map