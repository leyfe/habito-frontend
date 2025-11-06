// src/pages/LoginPage.jsx
import React, { useState, useContext } from "react";
import { Input, Button, Card } from "@nextui-org/react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import Background from "../components/ui/Background.jsx";

export default function LoginPage() {
  const { login, register } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Background></Background>

    
      <Card className="p-8 dark:bg-neutral-900 max-w-[90%] w-full sm:max-w-md shadow-xl">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          {mode === "login" ? "Anmelden" : "Registrieren"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="E-Mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            label="Passwort"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            color="primary"
            size="lg"
            isLoading={loading}
            fullWidth
            className="mt-4"
          >
            {mode === "login" ? "Login" : "Registrieren"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-center text-slate-500 dark:text-neutral-500">
          {mode === "login" ? (
            <>
              Noch kein Konto?{" "}
              <button
                className="text-primary"
                onClick={() => setMode("register")}
              >
                Registrieren
              </button>
            </>
          ) : (
            <>
              Schon registriert?{" "}
              <button className="text-primary" onClick={() => setMode("login")}>
                Anmelden
              </button>
            </>
          )}
        </p>
      </Card>
    </div>
  );
}