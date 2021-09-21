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
const shipment_1 = __importDefault(require("./routes/shipment"));
const dotenv = __importStar(require("dotenv"));
const newStat_1 = __importDefault(require("./middleware/newStat"));
const expiration_check_1 = __importDefault(require("./middleware/expiration_check"));
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
app.use("/ship", shipment_1.default);
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
//# sourceMappingURL=index.js.map