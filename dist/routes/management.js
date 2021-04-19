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
const Admin_1 = __importDefault(require("../models/Admin"));
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
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield Admin_1.default.findOne({ email });
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
exports.default = router;
//# sourceMappingURL=management.js.map