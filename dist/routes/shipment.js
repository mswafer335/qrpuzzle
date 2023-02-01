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
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
const router = express_1.Router();
dotenv.config({ path: __dirname + "/.env" });
// sber
router.post("/shipment/new", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield axios_1.default({
        method: "post",
        url: "https://lk.sblogistica.ru/api/ext/v1/shipments",
        headers: {
            "X-Api-Key": process.env.SberApiKey,
        },
        data: {
            additionalOrganizationName: "ИП Подзигун Виктория Константиновна",
            brandName: "ИП Подзигун Виктория Константиновна",
            cashOnDelivery: 127000,
            // "comment": "Оставить под дверью",
            contractNumber: "",
            // "costCenter": "Отдел продаж",
            courierAddress: "",
            deliveryPointAddress: "",
            deliveryPointId: 1,
            dimensions: {
                height: 20,
                length: 20,
                width: 20,
            },
            individualTariff: "",
            insuranceSum: 127000,
            items: [
                {
                    costPerUnit: 127000,
                    markingCode: "",
                    name: "Million puzzle",
                    quantity: req.body.amount,
                    vatRate: 6,
                },
            ],
            mailType: "SBER_COURIER",
            orderNumber: "",
            recipientAddress: req.body.address,
            recipientName: req.body.name,
            recipientNumber: req.body.number,
            senderNumber: process.env.number,
            useAdditionalOrganization: false,
            weight: 1488,
        },
    })
        .then((huy) => {
        console.log(huy);
        res.json(huy);
    })
        .catch((err) => {
        console.log(err);
        res.json(err);
    });
}));
// shittor
router.post("/shipment/shit", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield axios_1.default({
        method: "post",
        url: "https://api.shiptor.ru/shipping/v1",
        headers: {
            "x-authorization-token": process.env.SberApiKey,
        },
        data: {
            id: "JsonRpcClient.js",
            jsonrpc: "2.0",
            method: "addPackage",
            params: {
                // stock: 6,
                length: 20,
                width: 20,
                height: 3,
                weight: 0.5,
                cod: 0,
                declared_cost: 1270,
                // "external_id": "ASD123",
                // photos: ["base64string...", "base64string..."],
                // attachment: "base64string...",
                departure: {
                    shipping_method: 1,
                    delivery_point: null,
                    //   delivery_time: 1,
                    //   delivery_time_string: "с 10:00 до 13:00",
                    //   delayed_delivery_at: "2019-11-29",
                    cashless_payment: true,
                    address: {
                        country: "RU",
                        receiver: "Имя Фамилия Отчество",
                        name: "Имя",
                        surname: "Фамилия",
                        patronymic: "Отчество",
                        email: "test@example.com",
                        phone: "+78005553535",
                        postal_code: "101000",
                        administrative_area: "Московская обл",
                        settlement: "Москва",
                        street: "Красная пл.",
                        house: "1",
                        apartment: "1",
                        address_line_1: "Московская обл, Москва, Красная пл., 1, 1",
                        kladr_id: "01000001000",
                    },
                },
                products: [
                    {
                        shopArticle: "CSV48",
                        count: 1,
                        price: 1270,
                        vat: 0,
                        // mark_code: "010290000001078921YRaPn3;:VQGXXd",
                        // subject_id: "7175285219463",
                        // doc_num: "АБV492&781",
                        // doc_date: "2018-11-10",
                        // sold_part: "1/2",
                    },
                ],
                services: [
                    {
                        shopArticle: "Доставка",
                        count: 1,
                        price: 1270,
                        vat: 0,
                    },
                ],
                // additional_service: ["express-gathering", "unpacking-before-payment"],
            },
        },
    })
        .then((huy) => {
        console.log(huy.data);
        res.json(huy.data);
    })
        .catch((err) => {
        console.log(err.data);
        res.json(err.data);
    });
}));
exports.default = router;
//# sourceMappingURL=shipment.js.map