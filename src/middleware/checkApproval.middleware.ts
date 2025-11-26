import { Request, Response, NextFunction } from "express";
import User from "../models/user.model"; 

export const checkApproval = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;  

    if (!userId) return res.status(401).json({ message: "Unauthorized user" });

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found.Create a new account" });

    
    if (!user.approved) {
      return res.status(403).json({ message: "You are not approved yet. Please wait..." });
    }

    next(); 
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
