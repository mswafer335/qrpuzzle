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
    prizes: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "prize",
            default: [],
        },
    ],
    prize_sum: { type: Number, default: 0 },
});
exports.default = mongoose_1.model("player", PlayerSchema);
//# sourceMappingURL=Player.js.map