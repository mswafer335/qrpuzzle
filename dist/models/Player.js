"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PlayerSchema = new mongoose_1.Schema({
    firstname: {
        type: String,
    },
    lastname: {
        type: String,
    },
    fullname: {
        type: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    comment: { type: String },
    prizes: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "prize",
            default: [],
        },
    ],
    prizes_activated: { type: Number, default: 0 },
    prize_sum: { type: Number, default: 0 },
    tax_sum: { type: Number, default: 0 },
    sum_ndfl: { type: Number },
    change_date: { type: Date },
});
exports.default = mongoose_1.model("player", PlayerSchema);
//# sourceMappingURL=Player.js.map