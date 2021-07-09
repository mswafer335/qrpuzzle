import { Response, Request, Router } from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

import Prize, { IPrize } from "../models/Prize";
import QR, { IQR } from "../models/QR-urls";
import Bundle from "../models/Bundle";
import Player from "../models/Player";
import Admin from "../models/Admin";
import auth from "../middleware/auth";
import QRStat from "../models/QRStat";

const router = Router();
dotenv.config({ path: __dirname + "/.env" });

// sber
router.post("/shipment/new", async (req: Request, res: Response) => {
  await axios({
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
    .then((huy: any) => {
      console.log(huy);
      res.json(huy);
    })
    .catch((err) => {
      console.log(err);
      res.json(err);
    });
});

// shittor
router.post("/shipment/shit", async (req: Request, res: Response) => {
  await axios({
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
});

export default router;
