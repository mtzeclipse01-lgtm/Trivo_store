require("dotenv").config();
const express = require("express");
const path = require("path");
const crypto = require("crypto");
const Database = require("better-sqlite3");

const app = express();
const db = new Database("trivo-store.sqlite");
const PORT = Number(process.env.PORT || 3000);
const BASE_URL = process.env.BASE_URL;
const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
const BRIDGE_TOKEN = process.env.STORE_BRIDGE_TOKEN;

db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS orders (
 id TEXT PRIMARY KEY, player TEXT NOT NULL, product_id TEXT NOT NULL,
 amount REAL NOT NULL, status TEXT NOT NULL, mp_preference_id TEXT,
 mp_payment_id TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS deliveries (
 id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL UNIQUE,
 player TEXT NOT NULL, product_id TEXT NOT NULL, command TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL
);
`);

const PRODUCTS = {
  kit_dima: { id:"kit_dima", name:"Kit Dima", description:"Equipamento para começar sua aventura.", price:15.00, command:"give {player} diamond 16" },
  kit_dima_op: { id:"kit_dima_op", name:"Kit Dima OP", description:"Um kit especial para sua jornada.", price:25.00, command:"give {player} diamond_sword 1" },
  vip: { id:"vip", name:"Rank VIP", description:"Benefícios VIP no Trivo SMP. Configure os benefícios antes de vender.", price:30.00, command:"say Entrega VIP pendente de configuração para {player}" }
};

function safePlayer(value) {
  return typeof value === "string" && /^[A-Za-z0-9_]{3,16}$/.test(value);
}
function publicProducts() {
  return Object.values(PRODUCTS).map(({id,name,description,price}) => ({id,name,description,price}));
}
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({ limit: "32kb" }));

app.get("/api/products", (_req,res) => res.json(publicProducts()));

app.post("/api/checkout", async (req,res) => {
  try {
    if (!MP_TOKEN || !BASE_URL || !BRIDGE_TOKEN) return res.status(503).json({error:"Loja ainda não configurada pelo administrador."});
    const { player, productId } = req.body || {};
    const product = PRODUCTS[productId];
    if (!safePlayer(player) || !product) return res.status(400).json({error:"Nick ou produto inválido."});

    const id = crypto.randomUUID();
    db.prepare(`INSERT INTO orders (id,player,product_id,amount,status,created_at)
      VALUES (?,?,?,?,?,?)`).run(id, player, product.id, product.price, "pending", new Date().toISOString());

    const preference = {
      items: [{ title: `Trivo SMP - ${product.name}`, quantity: 1, currency_id: "BRL", unit_price: product.price }],
      external_reference: id,
      notification_url: `${BASE_URL}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${BASE_URL}/?payment=success`,
        failure: `${BASE_URL}/?payment=failure`,
        pending: `${BASE_URL}/?payment=pending`
      },
      auto_return: "approved"
    };
    const mp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method:"POST",
      headers:{ "Authorization":`Bearer ${MP_TOKEN}`, "Content-Type":"application/json" },
      body:JSON.stringify(preference)
    });
    const data = await mp.json();
    if (!mp.ok || !data.init_point) throw new Error(data.message || "Não foi possível criar o checkout.");
    db.prepare("UPDATE orders SET mp_preference_id=? WHERE id=?").run(data.id, id);
    res.json({ checkoutUrl:data.init_point });
  } catch (err) {
    console.error("Checkout:", err.message);
    res.status(500).json({error:"Não foi possível iniciar o pagamento. Tente novamente."});
  }
});

// Nunca confie apenas no conteúdo recebido no webhook: consulte o pagamento na API do Mercado Pago.
app.post("/api/webhooks/mercadopago", async (req,res) => {
  try {
    const paymentId = req.body?.data?.id || req.query?.["data.id"];
    if (!paymentId || !MP_TOKEN) return res.sendStatus(200);
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers:{ "Authorization":`Bearer ${MP_TOKEN}` }
    });
    const payment = await response.json();
    if (!response.ok) return res.sendStatus(200);
    if (payment.status !== "approved") return res.sendStatus(200);

    const orderId = payment.external_reference;
    const order = db.prepare("SELECT * FROM orders WHERE id=?").get(orderId);
    if (!order || order.status === "approved") return res.sendStatus(200);
    if (Number(payment.transaction_amount) !== Number(order.amount)) return res.sendStatus(200);

    const product = PRODUCTS[order.product_id];
    if (!product) return res.sendStatus(200);
    const command = product.command.replaceAll("{player}", order.player);
    const tx = db.transaction(() => {
      db.prepare("UPDATE orders SET status='approved', mp_payment_id=? WHERE id=?").run(String(payment.id), order.id);
      db.prepare(`INSERT OR IGNORE INTO deliveries (order_id,player,product_id,command,created_at)
        VALUES (?,?,?,?,?)`).run(order.id, order.player, order.product_id, command, new Date().toISOString());
    });
    tx();
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook:", err.message);
    res.sendStatus(200);
  }
});

// O addon BDS consulta esta fila. Protegido por token compartilhado.
app.get("/api/bridge/next", (req,res) => {
  if (!BRIDGE_TOKEN || req.get("x-trivo-token") !== BRIDGE_TOKEN) return res.sendStatus(401);
  const delivery = db.prepare("SELECT id,command FROM deliveries WHERE status='pending' ORDER BY id LIMIT 1").get();
  res.json(delivery || null);
});
app.post("/api/bridge/ack", (req,res) => {
  if (!BRIDGE_TOKEN || req.get("x-trivo-token") !== BRIDGE_TOKEN) return res.sendStatus(401);
  const id = Number(req.body?.id);
  if (!Number.isInteger(id)) return res.sendStatus(400);
  db.prepare("UPDATE deliveries SET status='delivered' WHERE id=? AND status='pending'").run(id);
  res.json({ok:true});
});

app.listen(PORT, () => console.log(`Trivo SMP Store rodando na porta ${PORT}`));
