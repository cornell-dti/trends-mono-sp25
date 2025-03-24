import express, { Express } from "express";
import axios from "axios";
import cors from "cors";

const app: Express = express();
const port = 8080;

app.use(cors());
app.use(express.json());

app.get("/api/", (req, res) => {
  res.send("hello world!");
});

app.post("/api/", async (req, res) => {
  const key = req.body.key;
  console.log(key);
  // Do something with the key
  res.json({ message: "Hello, world!" });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
