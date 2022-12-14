import mongoose from "mongoose";
import { Fixtures } from "../fixtures/fixtures.model";

const teamsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxLength: 20,
      unique: true,
      lowercase: true,
    },
    // fixtures: {
    //   type: [{ type: mongoose.Schema.Types.ObjectId }],
    //   ref: "fixture",
    // },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
      required: true,
    },
  },
  { timestamps: true }
);

teamsSchema.pre("findOneAndUpdate", async function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

teamsSchema.post("findOneAndRemove", async function (doc) {
  await Fixtures.deleteMany({
    $or: [{ homeTeam: doc._id }, { awayTeam: doc._id }],
  });
});

export const Teams = mongoose.model("team", teamsSchema);
