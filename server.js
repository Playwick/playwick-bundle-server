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

const productCatalog = {
  "Face Card": 32,
  "Lights Off": 32,
  "Uhauling": 32,
  "Canada Eh": 32,
  "Lions Lookout": 32,
  "Bala Baby": 32,
  "Softcore Vanilla": 32,
  "North Facing": 32,
  "Rosé": 32
};

app.get("/", (req, res) => {
  res.send("Playwick bundle server is live.");
});

app.post("/create-bundle-checkout", async (req, res) => {
  try {
    const { bundle } = req.body;

    if (!Array.isArray(bundle) || bundle.length === 0) {
      return res.status(400).json({ error: "No bundle items received." });
    }

    let subtotal = 0;

    for (const item of bundle) {
      const price = productCatalog[item.name];

      if (!price) {
        return res.status(400).json({
          error: `Unknown product: ${item.name}`
        });
      }

      subtotal += price;
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
    console.error("Checkout error:", error);
    res.status(500).json({ error: "checkout failed" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`running on port ${PORT}`));
