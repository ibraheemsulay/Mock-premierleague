import adminController from "../../admin/admin.controller";
import userController from "src/user/user.controller";
import { Response, Request } from "express";
import { testSignIn } from "src/utils/test-utils";
import { faker } from "@faker-js/faker";
import request from "supertest";
import teamsRoutes from "../teams.routes";
import express from "express";
import { json, urlencoded } from "body-parser";

const app = express();
app.use(json());
app.use(urlencoded({ extended: true }));
app.use("/", teamsRoutes);

export default describe("Teams test", () => {
  describe("admin functionalities", () => {
    const req = {} as unknown as Request;
    const { signIn } = adminController;

    beforeAll(async () => {
      await testSignIn({ signIn });

      req.headers = {
        Authorization: global.admin,
      };
    });

    test("admin should add a new team", async () => {
      expect.assertions(2);

      const addTeam = await request(app)
        .post("/")
        .set(req.headers)
        .send({ name: "tottenham" });

      expect(addTeam.status).toBe(200);
      expect(addTeam.body).toEqual({ message: "data created" });
    });

    test("admin should update a team using it's id", async () => {
      const getTeam = await request(app).get("/?search=tottenham");
      expect(getTeam.status).toBe(200);

      const teamId: string = getTeam.body.data._id;

      const updateTeam = await request(app)
        .patch(`/${teamId}`)
        .set(req.headers)
        .send({ name: "west ham" });

      expect(updateTeam.status).toBe(201);
      expect(updateTeam.body.data.name).toBe("west ham");
    });

    test("admin should delete a team using it's id", async () => {
      const getTeam = await request(app).get("/?search=west ham");
      const teamId: string = await getTeam.body.data._id;

      const deleteTeam = await request(app)
        .delete(`/${teamId}`)
        .set(req.headers);

      expect(deleteTeam.status).toBe(200);
      expect(deleteTeam.body.data).toMatchObject({ message: "removed data" });
    });
  });

  describe("user functionalities", () => {
    beforeAll(async () => {
      const { signIn, signUp } = userController;

      const req = {
        body: {
          name: "John Doe",
          username: "johndoe",
          email: faker.internet.email(),
          password: "johndoe88.",
        },
      } as unknown as Request;

      const res = {
        status(status: number) {
          return this;
        },
        json(result: any) {
          return this;
        },
      } as unknown as Response;

      await signUp(req, res);
      await testSignIn({ signIn, account: "user" });
    });

    test("user should get all teams", async () => {
      const authAdmin = { Authorization: global.admin },
        getAllTeams = await request(app).get("/").set(authAdmin);

      expect(getAllTeams.status).toBe(200);
    });

    test("user should not be able to add new team", async () => {
      const authUser = { Authorization: global.user },
        addTeam = await request(app)
          .post("/")
          .set(authUser)
          .send({ name: "chelsea" });

      expect(addTeam.status).toBe(401);
    });

    test("user should not be able to delete a team", async () => {
      //create a new team with admin
      const adminAuth = { Authorization: global.admin },
        addTeam = await request(app)
          .post("/")
          .set(adminAuth)
          .send({ name: "chelsea" });

      expect(addTeam.status).toBe(200);

      // get new team id
      const newTeam = await request(app).get("/?search=chelsea"),
        teamId: string = newTeam.body.data._id;

      const authUser = { Authorization: global.user },
        deleteTeam = await request(app).delete(`/${teamId}`).set(authUser);

      expect(deleteTeam.status).toBe(401);
    });

    test("user should not be able to update a team details", async () => {
      // get new team that was created in the previous test suite
      const newTeam = await request(app).get("/?search=chelsea"),
        teamId: string = newTeam.body.data._id;

      const authUser = { Authorization: global.user },
        deleteTeam = await request(app)
          .patch(`/${teamId}`)
          .set(authUser)
          .send({ name: "tottenham" });

      expect(deleteTeam.status).toBe(401);
    });
  });

  describe("non-user functionalities", () => {
    test("non users can search for a particular team by name", async () => {
      const newTeam = await request(app).get("/?search=chelsea");
      expect(newTeam.status).toBe(200);
    });
  });
});
