import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || "mongodb+srv://MetaEmprestimo:metaemprestimo1182@meta0.kvsvlem.mongodb.net/test?appName=Meta0";
  if (!mongoURI) {
    console.error("MONGODB_URI não definida. Verifique as variáveis de ambiente.");
    return;
  }

  try {
    await mongoose.connect(mongoURI);
    console.log("Conectado ao MongoDB Atlas com sucesso!");
  } catch (err) {
    console.error("Erro ao conectar ao MongoDB:", err);
    // Tenta reconectar após 5 segundos sem matar o processo
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
