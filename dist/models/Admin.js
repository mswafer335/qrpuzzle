"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AdminSchema = new mongoose_1.Schema({
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
    password: {
        type: String,
    },
});
exports.default = mongoose_1.model("admin", AdminSchema);
//# sourceMappingURL=Admin.js.map