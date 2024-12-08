import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import zod from "zod";

const userSignupSchema = zod.object({
  name: zod.string().min(2),
  email: zod.string().email(),
  password: zod.string().min(8),
});

const userLoginSchema = zod.object({
  email: zod.string().email(),
  password: zod.string().min(8),
});

const prisma = new PrismaClient();

//  signup  endpoint

export const signUp = async (req: any, res: any) => {
  try {
    const { success, data, error } = userSignupSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        message: "Validation error",
      });
    }
    const { name, email, password } = data;
    const ifAlreadyExists = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (ifAlreadyExists) {
      return res.status(401).json({
        message: "user already exists",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    const accesstoken = jwt.sign(
      { id: newUser.id },
      process.env.SECRET as string,
      { expiresIn: "1h" }
    );
    return res.json({ token: accesstoken });
  } catch (e) {
    console.error("Unexpected error:", e);
    return res.status(500).send({ message: "INTERNAL SERVER ERROR" });
  }
};

//login endpoint

export const login = async (req: any, res: any) => {
  try {
    const { data, success, error } = userLoginSchema.safeParse(req.body);
    if (!success) {
      return res.status(401).json({
        message: "Validation errror",
      });
    }
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return res.status(401).json({
        message: "email is invalid",
      });
    }
    const credentials = await bcrypt.compare(data.password, user.password);
    if (!credentials) {
      return res.status(401).json({
        message: "password is incorrect",
      });
    }
    const accesstoken = jwt.sign(
      { id: user.id },
      process.env.SECRET as string,
      { expiresIn: "1h" }
    );
    return res.json({ token: accesstoken });
  } catch (e) {
    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};
