import mongoose from "mongoose";
import { goalSchema } from "./goalSchema.js";

const Loan = mongoose.model("Loan", goalSchema, "emprestimos");

export default Loan;
