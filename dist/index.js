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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./middleware/db");
const codes_1 = __importDefault(require("./routes/codes"));
const bundles_1 = __importDefault(require("./routes/bundles"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const app = express_1.default();
db_1.connectDB();
app.use(express_1.default.json());
app.use(cors_1.default());
app.use(express_1.default.static("public"));
app.use("/archive", express_1.default.static(__dirname + "/archive"));
app.get("/", (req, res) => res.send("no hack plz"));
app.use("/codes", codes_1.default);
app.use("/bundles", bundles_1.default);
const PORT = process.env.PORT || 1370;
app.listen(PORT, () => console.log(`Server started on ${PORT}`));
//# sourceMappingURL=index.js.map