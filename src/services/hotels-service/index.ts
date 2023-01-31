import { notFoundError, requestError } from "@/errors";
import enrollmentRepository from "@/repositories/enrollment-repository";
import hotelsRepository from "@/repositories/hotels-repository";
import ticketRepository from "@/repositories/ticket-repository";

export async function getHotelsService(userId: number) {
  const enrollment = await enrollmentRepository.findByUserId(userId);
  if (!enrollment) {
    throw requestError(400, "Invalid");
  }

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) {
    throw requestError(400, "Invalid");
  }

  const restraints = (ticket.status !== "PAID" || !ticket.TicketType.includesHotel);
  if (restraints) {
    throw notFoundError();
  }

  return await hotelsRepository.findAll();
}
