import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.router";
import postRoutes from "./routes/post.router";
dotenv.config({});
const port = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use("/api/v1/user", authRoutes);
app.use("/api/v1/post", postRoutes);
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
