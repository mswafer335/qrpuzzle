"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BundleSchema = new mongoose_1.Schema({
    amount: {
        type: Number,
    },
    date: {
        type: Date,
    },
    print_date: {
        type: Date,
    },
    value: {
        type: Number,
    },
    printed: {
        type: Boolean,
        default: false,
    },
    amount_validated: {
        type: Number,
        default: 0,
    },
    archive_path: {
        type: String,
    },
    prizes: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "prize",
            default: [],
        },
    ],
});
exports.default = mongoose_1.model("bundle", BundleSchema);
//# sourceMappingURL=Bundle.js.map