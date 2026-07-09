require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");
const contactRouter = require("./routes/contact");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/contact", contactRouter);

// Serve the frontend (single Node app powers both site + API)
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// Fallback: any unknown non-API route serves index.html (nice for direct links)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Velira server ${PORT}-portda ishga tushdi: http://localhost:${PORT}`);
});
