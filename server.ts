import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from "./src/data";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google Gen AI lazily
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API: Products List
app.get("/api/products", (req, res) => {
  res.json(PRODUCTS);
});

// Mock order tracker database
const INITIAL_ORDERS: Record<string, any> = {
  "OM-9821": {
    orderId: "OM-9821",
    customerName: "Ahmed Al Balushi",
    status: "Shipped",
    location: "Sohar Logistic Hub",
    updatedAt: "Today, 11:30 AM",
    steps: [
      { title: "Order Placed", description: "Payment approved successfully via Bank Muscat Credit Card", time: "Yesterday, 02:15 PM", done: true },
      { title: "Processing", description: "Product selected and packed carefully in Muscat Central Warehouse", time: "Yesterday, 06:40 PM", done: true },
      { title: "Shipped", description: "Handed over to Omani Express Fleet (In Transit to Sohar Hub)", time: "Today, 09:00 AM", done: true },
      { title: "Out for Delivery", description: "Local driver Salim preparing dispatch route", time: "Tomorrow", done: false },
      { title: "Delivered", description: "Recipient validation & warranty certificate signature", time: "Pending", done: false }
    ]
  },
  "OM-4701": {
    orderId: "OM-4701",
    customerName: "Fatma Al Hinai",
    status: "processing",
    location: "Muscat Packing Center",
    updatedAt: "Today, 08:15 AM",
    steps: [
      { title: "Order Placed", description: "Payment verified successfully via Apple Pay", time: "Today, 08:00 AM", done: true },
      { title: "Processing", description: "Technician conducting multi-point pre-delivery check on dual inverter Split AC unit", time: "Today, 09:30 AM", done: true },
      { title: "Shipped", description: "Loading onto technical crew dispatch van", time: "Scheduled for Tomorrow", done: false },
      { title: "Out for Delivery", description: "Complementary installation crew transit", time: "Scheduled for Monday", done: false },
      { title: "Delivered", description: "System mounting, commissioning & standard 1-year product checkoff", time: "Pending", done: false }
    ]
  }
};

// API: Order Tracking
app.post("/api/orders/track", (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: "Order ID is required" });
  }
  const normalizedId = orderId.toUpperCase().trim();
  const order = INITIAL_ORDERS[normalizedId];

  if (order) {
    return res.json(order);
  } else {
    // Generate a temporary procedural order for customized order tracking searches
    const statuses = ["processing", "Shipped"];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const generatedOrder = {
      orderId: normalizedId,
      customerName: "Guest Customer",
      status: status,
      location: status === "Shipped" ? "Nizwa Logistic Wing" : "Muscat Sorting Yard",
      updatedAt: "Just now",
      steps: [
        { title: "Order Placed", description: "Payment verified successfully", time: "Today, 10:00 AM", done: true },
        { title: "Processing", description: "Allocating active serial stock in warehouse", time: "Today, 11:30 AM", done: status !== "Pending" },
        { title: "Shipped", description: "Parcel processed at Omani Air-Land logistics desk", time: "Today, 02:00 PM", done: status === "Shipped" },
        { title: "Out for Delivery", description: "Dispatched with local courier team", time: "Pending", done: false },
        { title: "Delivered", description: "Deliver and stamp receipt", time: "Pending", done: false }
      ]
    };
    return res.json(generatedOrder);
  }
});

// API: Server-side Gemini AI Chat
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Create the products catalog to insert into the system instruction
  const catalogText = PRODUCTS.map(p => {
    const originalPrice = p.oldPrice ? ` (was OMR ${p.oldPrice})` : "";
    const specsStr = Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join(", ");
    return `- [${p.brand} ${p.name}] Price: OMR ${p.price}${originalPrice}. Category: ${p.category}. Status: ${p.stock > 0 ? "In Stock" : "Out of Stock"} (${p.stock} units left). specs: ${specsStr}. Description: ${p.description}`;
  }).join("\n");

  const systemInstruction = `You are "BuyOman Assistant", the helpful, polite, and expert AI Shopping Consultant for BuyOman, Omani citizens and residents' trusted electronics & home appliances retail destination.

Our store features and policies:
1. DELIVERY: We offer FREE home delivery across the Sultanate of Oman for all orders above OMR 50 (e.g. Muscat, Seeb, Sohar, Salalah, Nizwa, Sur, Al Buraimi, Ibri). For smaller orders below OMR 50, a small flat delivery fee of OMR 5 is added at checkout.
2. WARRANTY: Every product comes with standard 1-year brand warranty. Customers can upgrade to the "BuyOman Safeguard Plus" 5-year extended warranty plan for an additional 10% of the item's purchase price.
3. SUPPORT: Office hours are 9:00 AM - 10:00 PM. Hotlines are (+968 2455 1234) and instant WhatsApp service.
4. PAYMENT METHODS: Bank Muscat online transfers, Visa, MasterCard, and Apple Pay.
5. ORDER TRACKING: Users can check tracking codes. Let them know codes "OM-9821" (Shipped status in Sohar) or "OM-4701" (Processing in Muscat) are existing sample orders they can try inputting inside our "Track Order" interface.

HERE IS OUR ACCURATE PRODUCT CATALOG:
${catalogText}

Instructions for your responses:
- Speak as a friendly, expert concierge. Keep formatting beautifully structured with clear markdown bullet points.
- Respond with accurate pricing (in Omani Rials, OMR) and genuine specs based on our catalog database.
- Assist users in comparing features (e.g., Samsung Galaxy A55 5G vs iPhone 15 specs).
- If they ask for an item that is not in our inventory, tell them we don't have it right now, and suggest our best match from the catalog list above.
- Encourage them to click "Add to Cart" directly next to their favorite product in the main catalog view.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "MOCK") {
      // Offline high-fidelity helpful mock response for secure local/preview testing when secret is unset
      const lower = message.toLowerCase();
      let reply = "";
      if (lower.includes("ac") || lower.includes("air") || lower.includes("cool")) {
        reply = `**BuyOman Assistant (Offline Demo Mode)**:\n\nWe have exceptional air conditioners built for Oman's summer heat:\n- **LG 1.5 Ton Inverter AC**: **OMR 159** (Eco Dual-Inverter, 10-year compressor warranty)\n- **Panasonic 2.0 Ton Inverter AC**: **OMR 249** (Nanoe-G air purification, heavy cooling coverage)\n\nBoth items qualify for **FREE delivery and technical installation**! Would you like me to guide you on how to add them to your cart?`;
      } else if (lower.includes("phone") || lower.includes("mobile") || lower.includes("samsung") || lower.includes("iphone")) {
        reply = `**BuyOman Assistant (Offline Demo Mode)**:\n\nHere are our top active smartphones available today:\n- **Samsung Galaxy A55 5G (256GB)**: **OMR 119** (was OMR 139) - includes water resistance & 8GB RAM.\n- **Apple iPhone 15 (128GB)**: **OMR 349** - features the A16 Bionic chip and brand new Dynamic Island.\n- **Xiaomi Redmi Note 13 Pro (256GB)**: **OMR 89** - featuring an incredible 200MP camera!\n\nDelivery is absolutely **free** for all mobiles!`;
      } else if (lower.includes("fridge") || lower.includes("refrigerator") || lower.includes("freeze")) {
        reply = `**BuyOman Assistant (Offline Demo Mode)**:\n\nTo lock in freshness, we offer:\n- **Hitachi 500L Double Door Refrigerator**: **OMR 229** with dual-fan frostless cooling.\n- **Toshiba Deep Freezer (300L)**: **OMR 119** (was OMR 139) for bulk frozen storage.\n\nAll massive kitchen appliances are shipped free to doors in Muscat, Seeb, Sohar, and Salalah!`;
      } else if (lower.includes("track") || lower.includes("order") || lower.includes("om-")) {
        reply = `**BuyOman Assistant (Offline Demo Mode)**:\n\nTo track any shipment instantly, please type that tracking ID directly into the **Track Order** panel at the top right header! You can use **OM-9821** to view an active shipment heading to Sohar, or **OM-4701** to view an LG Split AC currently being prepared!`;
      } else {
        reply = `**Hello there! Welcome to BuyOman Support.** 👋\n\nI am your AI assistant. Here is what you can ask me:\n- 📦 **Delivery questions** (Oman wide, free over OMR 50)\n- 📱 **Mobile & Smart Gadgets pricing** (Samsung, Apple, Xiaomi options)\n- ❄️ **Large appliance details** (ACs, Fridges, Washers)\n- ⇄ **Product Comparisons** (e.g. Inverter dual vs standard tonnage)\n\nHow can I help you customize your Omani home today?`;
      }
      return res.json({ reply });
    }

    const ai = getAiClient();
    const contents: any[] = [];

    if (history && Array.isArray(history)) {
      for (const item of history) {
        if (item.text && item.role) {
          contents.push({
            role: item.role === "user" ? "user" : "model",
            parts: [{ text: item.text }]
          });
        }
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.75,
      }
    });

    const reply = response.text || "I was unable to retrieve a response. Please let me search again.";
    res.json({ reply });
  } catch (error: any) {
    console.error("Gemini model execution error:", error);
    res.status(500).json({ error: "Gemini server query failed: " + (error.message || error) });
  }
});

// Start integration server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started, listening on port ${PORT}`);
  });
}

startServer();
