const express = require("express");
const app = express();

// app.use(cors)
const PORT = process.env.PORT || 8080

app.get('/', (req, res) => {
    res.send("server ready");
})

app.get('/api/phones', (req, res) => {
    const phone = [
        { "id": 1, "brand": "Apple", "phone": "iPhone 15 Pro Max" },
        { "id": 2, "brand": "Samsung", "phone": "Galaxy S24 Ultra" },
        { "id": 3, "brand": "OnePlus", "phone": "OnePlus 12R" },
        { "id": 4, "brand": "Xiaomi", "phone": "Redmi Note 13 Pro+" },
        { "id": 5, "brand": "Realme", "phone": "Realme GT 6" },
        { "id": 6, "brand": "Google", "phone": "Pixel 8 Pro" },
        { "id": 7, "brand": "Vivo", "phone": "Vivo X100 Pro" },
        { "id": 8, "brand": "Oppo", "phone": "Oppo Reno 12 Pro" },
        { "id": 9, "brand": "Nothing", "phone": "Nothing Phone (2a)" },
        { "id": 10, "brand": "Motorola", "phone": "Moto Edge 50 Pro" }
    ]

    res.send(phone)
})

app.listen(PORT, () => {
    console.log(`server is running at the port http://localhost:${PORT}`);
})