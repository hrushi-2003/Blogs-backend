import express from "express";
import {
  createPost,
  getAllBlogs,
  getBlogById,
  getBlogsByUser,
  updateBlog,
} from "../controllers/Post";
import { isAuthenticated } from "../middlewares/isAuthenticated";
const router = express.Router();

router.route("/publish").post(isAuthenticated, createPost);
router.route("/update").post(isAuthenticated, updateBlog);
router.route("/getall").get(isAuthenticated, getAllBlogs);
router.route("/getuserblogs").get(isAuthenticated, getBlogsByUser);
router.route("/get/:id").get(isAuthenticated, getBlogById);

export default router;
