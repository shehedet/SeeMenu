import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "SeeMenu API is running"
    });
});

app.listen(PORT, () => {
    console.log(`SeeMenu server running on http://localhost:${PORT}`);
});