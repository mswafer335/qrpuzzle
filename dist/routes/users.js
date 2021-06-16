"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = express_1.Router();
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: __dirname + "/.env" });
const Player_1 = __importDefault(require("../models/Player"));
const auth_1 = __importDefault(require("../middleware/auth"));
function regexEscape(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}
// get all users
router.get("/find/all", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const keys = Object.keys(req.query);
        const QUERY_OBJ = {};
        for (const key of keys) {
            QUERY_OBJ[key] = req.query[key];
        }
        const users = yield Player_1.default.find(QUERY_OBJ)
            .populate("prizes")
            .sort({ change_date: -1 });
        res.json(users);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// regex query
router.get("/find/query", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const a = req.query;
        console.log(req.query);
        const query = {};
        const keys = Object.keys(req.query);
        if (keys.length > 0) {
            for (const key of keys) {
                if (key !== "phone") {
                    query[key] = { $regex: regexEscape(a[key]), $options: "i" };
                }
            }
            // query[a.field] = { $regex: regexEscape(a.value), $options: "i" };
            if (req.query.phone) {
                query.phone = Number(req.query.phone);
            }
        }
        const user = yield Player_1.default.find(query)
            .populate("prizes")
            .sort({ change_date: -1 });
        res.json(user);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// get all users with >4k winnings
router.get("/find/all/ndfl", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const keys = Object.keys(req.query);
        const QUERY_OBJ = {
            prize_sum: { $gt: Number(req.query.gt ? req.query.gt : 4000) },
        };
        for (const key of keys) {
            if (key !== "gt" && key !== "payed") {
                QUERY_OBJ[key] = req.query[key];
            }
        }
        let users = yield Player_1.default.find(QUERY_OBJ)
            .populate("prizes")
            .sort({ change_date: -1 });
        if (req.query.payed === "true") {
            users = users.filter((user) => {
                return user.prizes.every((prize) => {
                    return prize.payed;
                });
            });
        }
        if (req.query.payed === "false") {
            users = users.filter((user) => {
                return user.prizes.some((prize) => {
                    return !prize.payed;
                });
            });
        }
        res.json(users);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
exports.default = router;
//# sourceMappingURL=users.js.map