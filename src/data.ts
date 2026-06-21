import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Galaxy A55 5G",
    brand: "Samsung",
    category: "Mobiles",
    price: 119,
    oldPrice: 139,
    imageEmoji: "📱",
    description: "Vibrant AMOLED display, ultimate durability with water resistance, and state-of-the-art camera for Omani sunsets.",
    specs: {
      "Storage": "256 GB",
      "RAM": "8 GB",
      "Screen": "6.6 inch Super AMOLED",
      "Battery": "5000 mAh"
    },
    stock: 14
  },
  {
    id: "p2",
    name: "1.5 Ton Inverter Split AC",
    brand: "LG",
    category: "Air Conditioners",
    price: 159,
    imageEmoji: "❄️",
    description: "Keep your home cool during Omani summer peaks with this high-efficiency split air conditioner showing energy efficiency rating.",
    specs: {
      "Capacity": "1.5 Ton",
      "Compressor type": "Dual Inverter",
      "Warranty": "10 years on compressor",
      "Power consumption": "Low Energy"
    },
    stock: 8
  },
  {
    id: "p3",
    name: "500L Double Door Refrigerator",
    brand: "Hitachi",
    category: "Fridges",
    price: 229,
    imageEmoji: "🧊",
    description: "Spacious interior compartments, advanced moisture-guard, and perfect dual-fan cooling to keep fresh groceries fresh longer.",
    specs: {
      "Capacity": "500 Liters",
      "Cooling style": "No Frost",
      "Color": "Elegant silver",
      "Inverter Tech": "Yes"
    },
    stock: 5
  },
  {
    id: "p4",
    name: "8kg Front Load Washing Machine",
    brand: "Samsung",
    category: "Washing Machines",
    price: 139,
    oldPrice: 159,
    imageEmoji: "🧺",
    description: "EcoBubble technology cleans textiles with bubbles for deeper dirt removal, protecting your whites and colors.",
    specs: {
      "Washing capacity": "8 Kilograms",
      "Max spin speed": "1400 RPM",
      "Motor type": "Digital Inverter",
      "Special features": "Steam wash"
    },
    stock: 11
  },
  {
    id: "p5",
    name: "iPhone 15",
    brand: "Apple",
    category: "Mobiles",
    price: 349,
    imageEmoji: "📱",
    description: "Dynamic Island screen cutout, high-resolution 48MP main camera, textured back-glass design, and USB-C connectivity.",
    specs: {
      "Storage": "128 GB",
      "Screen": "6.1 inch Super Retina XDR",
      "Processor": "A16 Bionic chip",
      "Camera": "Dual lens, ultra wide"
    },
    stock: 9
  },
  {
    id: "p6",
    name: "Built-in 5 Burner Gas Cooker",
    brand: "Bosch",
    category: "Cookers & Ovens",
    price: 99,
    imageEmoji: "🍳",
    description: "Professional grade multi-burner gas cooker with cast-iron support, automatic ignition, and elegant glass finish.",
    specs: {
      "Burners": "5 high-efficiency",
      "Material": "Tempered safety glass",
      "Safety lock": "Thermoelectric safety device",
      "Gas type": "LPG / Natural gas"
    },
    stock: 4
  },
  {
    id: "p7",
    name: "Air Fryer XL, 6.2L",
    brand: "Philips",
    category: "Small Appliances",
    price: 35,
    oldPrice: 39,
    imageEmoji: "🔌",
    description: "Healthy cooking with up to 90% less fat. Features preset menus, touchscreen display, and dishwasher-safe elements.",
    specs: {
      "Capacity": "6.2 Liters (up to 5 portions)",
      "Power": "2000 Watts",
      "Presets": "7 pre-programmed modes",
      "App connection": "HomeID app recipes"
    },
    stock: 25
  },
  {
    id: "p8",
    name: "Deep Freezer, 300L",
    brand: "Toshiba",
    category: "Fridges",
    price: 119,
    oldPrice: 139,
    imageEmoji: "🧊",
    description: "Highly spacious temperature-tunable freezer chest with basket organizer, quick-freeze features, and heavy lid seal.",
    specs: {
      "Capacity": "300 Liters",
      "Energy star": "4 Star rating",
      "Defrosting": "Manual",
      "Mobility": "Built-in rolling wheels"
    },
    stock: 6
  },
  {
    id: "p9",
    name: "Xiaomi Redmi Note 13 Pro",
    brand: "Xiaomi",
    category: "Mobiles",
    price: 89,
    imageEmoji: "📱",
    description: "Unbeatable value for money featuring a massive 200MP camera with OIS, fast 67W charging, and extremely thin screen bezels.",
    specs: {
      "Storage": "256 GB",
      "RAM": "8 GB",
      "Camera": "200 Megapixel with OIS",
      "Battery": "5000 mAh + 67W Turbo"
    },
    stock: 18
  },
  {
    id: "p10",
    name: "2.0 Ton Inverter Split AC",
    brand: "Panasonic",
    category: "Air Conditioners",
    price: 249,
    imageEmoji: "❄️",
    description: "Heavy-duty smart cooling for larger dining rooms and halls. Uses nanoe air purification for cleaner atmosphere.",
    specs: {
      "Capacity": "2.0 Ton",
      "Cooling tech": "nanoe-G Air purification",
      "Inverter": "Yes, Econavi sensors",
      "Airflow": "Four-way horizontal & vertical"
    },
    stock: 3
  }
];
