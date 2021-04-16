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
const path_1 = __importDefault(require("path"));
const Bundle_1 = __importDefault(require("../models/Bundle"));
// get all bundles
router.get("/find/all", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bundles = yield Bundle_1.default.find();
        return res.json(bundles);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// get single bundle
router.get("/find/id/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bundle = yield Bundle_1.default.findOne({ _id: req.params.id }).populate("prizes");
        if (!bundle) {
            return res.status(404).json({ err: "Не найдено" });
        }
        return res.json(bundle);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// change print status
router.put("/change/print/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bundle = yield Bundle_1.default.findOne({ _id: req.params.id });
        if (!bundle) {
            return res.status(404).json({ err: "Не найдено" });
        }
        bundle.printed = !bundle.printed;
        bundle.print_date = new Date();
        yield bundle.save();
        res.redirect(303, `/bundles/find/id/${req.params.id}`);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// download archive
router.get("/download/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const bundle = yield Bundle_1.default.findOne({ _id: req.params.id });
    if (!bundle) {
        return res.status(404).json({ err: "Не найдено" });
    }
    res.download(path_1.default.resolve(__dirname + "/../public/" + bundle.archive_path), bundle.archive_path.split("/").pop());
}));
exports.default = router;
//# sourceMappingURL=bundles.js.map