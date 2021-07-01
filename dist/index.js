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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./middleware/db");
const codes_1 = __importDefault(require("./routes/codes"));
const bundles_1 = __importDefault(require("./routes/bundles"));
const users_1 = __importDefault(require("./routes/users"));
const management_1 = __importDefault(require("./routes/management"));
const payment_1 = __importDefault(require("./routes/payment"));
const dotenv = __importStar(require("dotenv"));
const newStat_1 = __importDefault(require("./middleware/newStat"));
const expiration_check_1 = __importDefault(require("./middleware/expiration_check"));
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
dotenv.config();
const app = express_1.default();
db_1.connectDB();
app.use(cors_1.default());
app.use(express_1.default.json());
app.use(express_1.default.static("public"));
app.use("/archive", express_1.default.static(__dirname + "/archive"));
app.get("/", (req, res) => res.send("no hack plz"));
app.use("/codes", codes_1.default);
app.use("/bundles", bundles_1.default);
app.use("/users", users_1.default);
app.use("/admin", management_1.default);
app.use("/pay", payment_1.default);
const PORT = process.env.PORT || 1370;
app.listen(PORT, () => console.log(`Server started on ${PORT}`));
const StatChecker = () => __awaiter(void 0, void 0, void 0, function* () {
    yield newStat_1.default();
    setTimeout(StatChecker, 1000 * 60 * 60 * 3);
});
const ExpireCheck = () => __awaiter(void 0, void 0, void 0, function* () {
    yield expiration_check_1.default();
    setTimeout(ExpireCheck, 1000 * 60 * 60 * 1);
});
StatChecker();
ExpireCheck();
const testFunc = () => __awaiter(void 0, void 0, void 0, function* () {
    const sign = crypto_1.default
        .createHmac("sha256", process.env.zingSecret)
        .update(process.env.zingAcc)
        .digest("hex");
    yield axios_1.default({
        method: "post",
        url: `${process.env.zingUrl}/withdrawal/balance/get`,
        data: {
            account: process.env.zingAcc,
        },
        headers: {
            MerchantKey: process.env.merchantKey,
            Sign: sign,
        },
    }).then((response) => console.log(response.data));
});
// testFunc();
const testFunc2 = () => __awaiter(void 0, void 0, void 0, function* () {
    const body = {
        account: process.env.zingAcc,
        amount: 1000,
        customer_card_number: "1111222233334444",
    };
    const signValue = `${body.account}|${body.amount}|${body.customer_card_number}`;
    const sign = crypto_1.default
        .createHmac("sha256", process.env.zingSecret)
        .update(signValue)
        .digest("hex");
    yield axios_1.default({
        method: "post",
        url: `${process.env.zingUrl}/withdrawal/init`,
        data: body,
        headers: {
            MerchantKey: process.env.merchantKey,
            Sign: sign,
        },
    }).then((response) => console.log(response.data));
});
testFunc2();
//# sourceMappingURL=index.js.map