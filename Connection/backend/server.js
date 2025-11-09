const express = require("express");
const app = express();

const PORT = process.env.PORT

app.get('/', (req, res) => {
    res.send("server ready");
})

app.listen(PORT, () => {
    console.log(`server is running at the port http://localhost:${PORT}`);
})