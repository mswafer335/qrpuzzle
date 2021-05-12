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
const bcrypt = __importStar(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv.config({ path: __dirname + "/.env" });
const Bundle_1 = __importDefault(require("../models/Bundle"));
const Player_1 = __importDefault(require("../models/Player"));
const Admin_1 = __importDefault(require("../models/Admin"));
const auth_1 = __importDefault(require("../middleware/auth"));
const QRStat_1 = __importDefault(require("../models/QRStat"));
// new admin
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const salt = yield bcrypt.genSalt(12);
        const password = yield bcrypt.hash(req.body.password, salt);
        const admin = new Admin_1.default({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            fullname: req.body.lastname + " " + req.body.firstname,
            phone: req.body.phone,
            email: req.body.email,
            password,
        });
        yield admin.save();
        // jsonwebtoken return
        const payload = { admin: { id: admin.id } };
        jsonwebtoken_1.default.sign(payload, process.env.jwtSecret, { expiresIn: 360000000 }, (err, token) => {
            if (err)
                throw err;
            res.json({
                token,
                id: admin.id,
                msg: "Новый пользователь зарегестрирован",
            });
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// authentification
router.post("/auth", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { password } = req.body;
    try {
        const user = yield Admin_1.default.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).json({
                errors: [{ err: "Пользователь с указанным email не найден" }],
            });
        }
        const isMatch = yield bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ errors: [{ err: "Неверный пароль" }] });
        }
        // jsonwebtoken return
        const payload = {
            admin: {
                id: user.id,
            },
        };
        jsonwebtoken_1.default.sign(payload, process.env.jwtSecret, { expiresIn: 360000000 }, (err, token) => {
            if (err)
                throw err;
            res.json({ token });
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).json({ err: "server error" });
    }
}));
// get stats for 1 day
router.get("/stats/oneday", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = {
            day: Number(req.query.day),
            month: Number(req.query.month),
            year: Number(req.query.year),
        };
        const stat = yield QRStat_1.default.findOne(query);
        return res.json(stat);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// get all stats by weeks
router.get("/stats/week", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const StatQuery = yield QRStat_1.default.find();
        const StatDaily = [...StatQuery];
        const arr = [];
        const func = (stats) => {
            const fArr = [];
            while (fArr.length < 7 && stats.length > 0) {
                fArr.push(stats.pop());
            }
            const week = {
                PrizesClaimed: 0,
                PrizesActivated: 0,
                WinningsClaimed: 0,
                TotalWinnings: 0,
                newUsers: 0,
                date: fArr[fArr.length - 1].date,
            };
            for (const el of fArr) {
                week.PrizesClaimed += el.PrizesClaimed;
                week.PrizesActivated += el.PrizesActivated;
                week.WinningsClaimed += el.WinningsClaimed;
                week.TotalWinnings += el.TotalWinnings;
                week.newUsers += el.newUsers;
            }
            return week;
        };
        while (StatQuery.length >= 1) {
            arr.push(func(StatQuery));
        }
        const bundles = yield Bundle_1.default.find();
        let totalCodes = 0;
        let totalSum = 0;
        let totalNonValidated = 0;
        let totalNonValidatedSum = 0;
        for (const bundle of bundles) {
            totalCodes += bundle.amount;
            totalSum += bundle.amount * bundle.value;
            totalNonValidated += bundle.amount - bundle.amount_validated;
            totalNonValidatedSum +=
                (bundle.amount - bundle.amount_validated) * bundle.value;
        }
        res.json({
            stats: arr.reverse(),
            totalCodes,
            totalSum,
            totalNonValidated,
            totalNonValidatedSum,
            StatDaily,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// add comment
router.put("/comment/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield Player_1.default.findOne({ _id: req.params.id });
        if (!user) {
            return res
                .status(404)
                .json({ err: "Пользователь с указанным id не найден" });
        }
        user.comment = req.body.comment;
        yield user.save();
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// count fix
router.get("/kostil/fix", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield Player_1.default.find();
        for (const user of users) {
            user.prizes_activated = user.prizes.length;
            yield user.save();
            console.log(user.prizes_activated);
        }
        return res.json("uspeh");
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
exports.default = router;
//# sourceMappingURL=management.js.map