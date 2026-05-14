import mongoose from "mongoose";
import { goalSchema } from "./goalSchema.js";

const Saving = mongoose.model("Saving", goalSchema, "metas");

export default Saving;
