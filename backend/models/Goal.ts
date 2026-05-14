import mongoose from "mongoose";
import { goalSchema } from "./goalSchema.js";

// Coleção legada "goals" — usada apenas para migração dos dados existentes
const Goal = mongoose.model("Goal", goalSchema, "goals");

export default Goal;
