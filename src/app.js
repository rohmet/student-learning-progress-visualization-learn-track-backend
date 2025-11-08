// src/app.js
import express from "express";
import cors from "cors";
import "dotenv/config";

// Impor klien Supabase yang sudah kita buat
import { supabase } from "./config/supabase.js";

const app = express();

// Middleware
app.use(cors()); // Mengizinkan request dari domain frontend
app.use(express.json());

// === TES KONEKSI ===
app.get("/api/test", async (req, res) => {
  try {
    // ambil data dari tabel 'learning_paths'
    const { data, error } = await supabase
      .from("learning_paths")
      .select("name");

    if (error) {
      throw error;
    }

    res.status(200).json({
      message: "Connection to Supabase successful!",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to connect to Supabase",
      error: error.message,
    });
  }
});

export default app;
