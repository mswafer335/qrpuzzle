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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Prize_1 = __importDefault(require("../models/Prize"));
const QR_urls_1 = __importDefault(require("../models/QR-urls"));
const Bundle_1 = __importDefault(require("../models/Bundle"));
const auth_1 = __importDefault(require("../middleware/auth"));
// get all bundles
router.get("/find/all", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const QUERY_OBJ = {};
        const keys = Object.keys(req.query);
        for (const key of keys) {
            QUERY_OBJ[key] = req.query[key];
        }
        const bundles = yield Bundle_1.default.find(QUERY_OBJ);
        return res.json(bundles);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// get single bundle
router.get("/find/id", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bundle = yield Bundle_1.default.findOne({ _id: req.query.id }).populate({
            path: "prizes",
            populate: { path: "player" },
        });
        if (!bundle) {
            return res.status(404).json({ err: "Не найдено" });
        }
        delete req.query.id;
        if (req.query.fullname) {
            bundle.prizes = bundle.prizes.filter((el) => {
                const regex = new RegExp(req.query.fullname.toString());
                return el.player && regex.test(el.player.fullname);
            });
            delete req.query.fullname;
        }
        if (req.query.phone) {
            bundle.prizes = bundle.prizes.filter((el) => {
                const regex = new RegExp(req.query.phone.toString());
                return el.player && regex.test(el.player.phone);
            });
            delete req.query.phone;
        }
        const keys = Object.keys(req.query);
        for (const key of keys) {
            if (req.query[key] === "true") {
                // @ts-ignore:
                req.query[key] = true;
            }
            if (req.query[key] === "false") {
                // @ts-ignore:
                req.query[key] = false;
            }
        }
        if (keys.length > 0) {
            for (const key of keys) {
                bundle.prizes = bundle.prizes.filter((prize) => {
                    return prize[key] === req.query[key];
                });
            }
        }
        bundle.prizes.sort((a, b) => {
            if (a.ActivationDate && b.ActivationDate) {
                return b.ActivationDate - a.ActivationDate;
            }
            else if (!a.ActivationDate && a.validated) {
                return -1;
            }
            else if (!b.ActivationDate && b.validated) {
                return 1;
            }
            else if (!a.ActivationDate) {
                return 1;
            }
            else if (!b.ActivationDate) {
                return -1;
            }
            else {
                return 0;
            }
        });
        return res.json(bundle);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// change print status
router.put("/change/print/:id", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bundle = yield Bundle_1.default.findOne({ _id: req.params.id });
        if (!bundle) {
            return res.status(404).json({ err: "Не найдено" });
        }
        bundle.printed = !bundle.printed;
        bundle.print_date = new Date();
        yield bundle.save();
        res.redirect(303, `/bundles/find/all`);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// download archive
router.get("/download/:id", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const bundle = yield Bundle_1.default.findOne({ _id: req.params.id });
    if (!bundle) {
        return res.status(404).json({ err: "Не найдено" });
    }
    bundle.download_date = new Date();
    bundle.download_num += 1;
    yield bundle.save();
    res.download(path_1.default.resolve(__dirname + "/../public/" + bundle.archive_path), bundle.archive_path.split("/").pop());
}));
// delete bundle
router.delete("/delete/:id", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bundle = yield Bundle_1.default.findOne({ _id: req.params.id });
        fs_1.default.unlinkSync(__dirname + "/../public/" + bundle.archive_path);
        if (!bundle.printed) {
            yield Prize_1.default.deleteMany({ _id: { $in: bundle.prizes } });
            yield QR_urls_1.default.deleteMany({ _id: { $in: bundle.qrs } });
        }
        yield bundle.remove();
        res.redirect(303, "/bundles/find/all");
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
exports.default = router;
//# sourceMappingURL=bundles.js.map