import app, { init } from "@/app";
import faker from "@faker-js/faker";
import supertest from "supertest";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import { TicketStatus } from "@prisma/client";

import { cleanDb, generateValidToken } from "../helpers";
import { createEnrollmentWithAddress, createHotels, createTicket, createTicketType, createUser } from "../factories";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /hotels", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/hotels");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    //Test Case 1: pegar hotel sem ticket
    it("should respond with status 400 if query param ticket is missing", async () => {
      const token = await generateValidToken();
  
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    //Test Case 2: pegar hotel sem ticket pago
    it("should reply with 404 status when given ticket unpaid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
  
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    //Test Case 3: pegar hotel com ticket pago sem hospedagem
    it("should respond with status 404 when hosting not selected", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false);
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
    
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    //Test Case 4: tudo deu certo :status
    //Test Case 5: tudo deu certo :list
    it("should respond with status 200 and hotel details", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(true);
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createHotels();

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
      
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            image: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          })
        ])
      );
    });
  });
});
