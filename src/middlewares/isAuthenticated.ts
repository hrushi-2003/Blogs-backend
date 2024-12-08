import jwt from "jsonwebtoken";
export const isAuthenticated = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization; // Correct spelling
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access token is required" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(400).json({ message: "access token is required " });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET as string);
    //@ts-ignore
    req.id = decoded.id;
    next();
  } catch (e) {
    return res.status(400).json({
      message: "jwt token expired",
    });
  }
};
