"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const QRSchema = new mongoose_1.Schema({
    validated: {
        type: Boolean,
        default: false,
    },
    prize: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "prize",
    },
    code: {
        type: String,
    },
    url: {
        type: String,
    },
});
const QR = mongoose_1.model("qr", QRSchema);
exports.default = QR;
//# sourceMappingURL=QR-urls.js.map