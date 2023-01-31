import { AuthenticatedRequest } from "@/middlewares";
import { getHotelsService } from "@/services/hotels-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getHotels(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const response = await getHotelsService(userId);
    return res.status(httpStatus.OK).send(response);
  } catch (error) {
    if (error.name === "RequestError") {
      return res.sendStatus(httpStatus.BAD_REQUEST);
    }
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}
