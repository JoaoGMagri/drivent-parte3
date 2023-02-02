import { BadRequestError, notFoundError, requestError } from "@/errors";
import enrollmentRepository from "@/repositories/enrollment-repository";
import hotelsRepository from "@/repositories/hotels-repository";
import ticketRepository from "@/repositories/ticket-repository";

export async function getHotelsService(userId: number) {
  await getHotelVerification(userId);

  return await hotelsRepository.findAll();
}

export async function getHotelsIdService(idHotel: number, userId: number) {
  await getHotelVerification(userId);
  const hotel = await hotelsRepository.findById(idHotel);
  if (!hotel) {
    throw notFoundError();
  }
  
  return hotel;
}

async function getHotelVerification(userId: number) {
  const enrollment = await enrollmentRepository.findByUserId(userId);
  if (!enrollment) {
    throw notFoundError();
  }

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) {
    throw notFoundError();
  }

  if (ticket.status !== "PAID") {
    throw requestError(402, "payment required");
  }

  if (!ticket.TicketType.includesHotel || ticket.TicketType.isRemote) {
    throw BadRequestError();
  }
}
