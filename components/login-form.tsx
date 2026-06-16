"use client";

import { FormEvent, useState } from "react";
import { Loader2, LockKeyhole, TicketCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [email, setEmail] = useState("ana@empresa.com");
  const [senha, setSenha] = useState("senha123");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setCarregando(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    setCarregando(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setErro(data?.erro ?? "Nao foi possivel entrar.");
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef7f1_42%,#fef7ed_100%)] px-4 py-8 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-800">
              <TicketCheck className="size-8 sm:size-12 " />
              <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
                Ticket Flui
              </h1>
              
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                <LockKeyhole className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Acessar painel</h2>
                <p className="text-sm text-muted-foreground">Use os dados do seed para testar.</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <label className="block space-y-1.5 text-sm font-medium">
                E-mail
                <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                Senha
                <Input value={senha} onChange={(event) => setSenha(event.target.value)} type="password" required />
              </label>

              {erro ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
              ) : null}

              <Button className="w-full" size="lg" type="submit" disabled={carregando}>
                {carregando ? <Loader2 className="animate-spin" /> : <LockKeyhole />}
                Entrar
              </Button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
