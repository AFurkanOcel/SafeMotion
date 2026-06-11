import type { Request, Response } from "express";

import { loginUser, registerUser, signupCaregiver } from "../services/auth.service.js";

export const register = async (req: Request, res: Response) => {
  const user = await registerUser(req.body);

  res.status(201).json(user);
};

export const signup = async (req: Request, res: Response) => {
  const result = await signupCaregiver(req.body);

  res.status(201).json(result);
};

export const login = async (req: Request, res: Response) => {
  const result = await loginUser(req.body);

  res.status(200).json(result);
};

export const getMe = (req: Request, res: Response) => {
  res.status(200).json(req.user);
};
