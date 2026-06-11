import type { Request, Response } from "express";

import { createMonitoredPerson, getMonitoredPerson, listMonitoredPersons } from "../services/monitored-person.service.js";

export const create = async (req: Request, res: Response) => {
  const monitoredPerson = await createMonitoredPerson(req.user!, req.body);

  res.status(201).json(monitoredPerson);
};

export const list = async (req: Request, res: Response) => {
  const result = await listMonitoredPersons(req.user!);

  res.status(200).json(result);
};

export const getById = async (req: Request, res: Response) => {
  const monitoredPerson = await getMonitoredPerson(req.user!, {
    params: {
      id: req.params.id
    }
  });

  res.status(200).json(monitoredPerson);
};
