import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import { Client, Environment } from "square";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
});

const PRODUCTS = {
  "Buysexual": 32,
  "Lights Off": 32,
  "Get Er Done": 32,
  "Canada Eh": 32,
  "One Dance": 18,
  "After Hours": 18,
  "Everyday": 38,
  "Sexyback": 38,
  "Wildflower": 38,
};

app.get("/", (req, res) => {
  res.send("Playwick bundle server is live.");
});

app.post("/create-bundle-checkout", async (req, res) => {
  try {
    const { bundle } = req.body;

    let subtotal = 0;

    for (const item of bundle) {
      subtotal += PRODUCTS[item.name];
    }

    let discount = 0;

    if (bundle.length === 2) discount = subtotal * 0.2;
    if (bundle.length === 3) discount = subtotal * 0.3;
    if (bundle.length === 4) discount = 40;

    const total = subtotal - discount;

    const response = await client.checkoutApi.createPaymentLink({
      idempotencyKey: crypto.randomUUID(),
      quickPay: {
        name: "Playwick Bundle",
        priceMoney: {
          amount: Math.round(total * 100),
          currency: "CAD",
        },
        locationId: process.env.SQUARE_LOCATION_ID,
      },
    });

    res.json({ url: response.result.paymentLink.url });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "checkout failed" });
  }
});

app.listen(3000, () => console.log("running"));
