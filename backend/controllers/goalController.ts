import { Request, Response } from "express";
import Saving from "../models/Saving.js";
import Loan from "../models/Loan.js";

/** Retorna o model correto com base na categoria */
function getModel(category: string) {
  return category === "loan" ? Loan : Saving;
}

/** Busca um documento por ID nas duas coleções */
async function findByIdInBoth(id: string) {
  const inLoans = await Loan.findById(id);
  if (inLoans) return inLoans;
  return Saving.findById(id);
}

export const getGoals = async (req: Request, res: Response) => {
  try {
    const [savings, loans] = await Promise.all([
      Saving.find().sort({ _id: -1 }),
      Loan.find().sort({ _id: -1 }),
    ]);
    res.json([...loans, ...savings]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getGoalById = async (req: Request, res: Response) => {
  try {
    const doc = await findByIdInBoth(req.params.id);
    if (!doc) return res.status(404).json({ error: "Não encontrado" });
    res.json(doc);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const createGoal = async (req: Request, res: Response) => {
  try {
    const category = req.body.category || "saving";
    const prefix = category === "loan" ? "loan" : "meta";
    const Model = getModel(category);
    const newDoc = await Model.create({
      _id: `${prefix}_${Date.now()}`,
      ...req.body,
      payments: [],
    });
    res.json(newDoc);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const updateGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Tenta atualizar em ambas as coleções; retorna o que for encontrado
    let updated = await Loan.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      updated = await Saving.findByIdAndUpdate(id, req.body, { new: true });
    }
    if (!updated) return res.status(404).json({ error: "Não encontrado" });
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const inLoan = await Loan.findByIdAndDelete(id);
    if (!inLoan) await Saving.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  try {
    const { id, paymentId } = req.params;
    const update = { $pull: { payments: { paymentId } } };

    let doc = await Loan.findByIdAndUpdate(id, update, { new: true });
    if (!doc) doc = await Saving.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ error: "Não encontrado" });

    res.json(doc);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};
