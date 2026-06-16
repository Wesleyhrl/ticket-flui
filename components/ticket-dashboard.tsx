"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CircleDot,
  Clock3,
  Pencil,
  Filter,
  Loader2,
  LogOut,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  Ticket,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Prioridade = "BAIXA" | "MEDIA" | "ALTA";
type Status = "ABERTO" | "EM_ANDAMENTO" | "RESOLVIDO" | "FECHADO";

type Usuario = {
  id: number;
  nome: string;
  email: string;
  role: "ADMIN" | "SUPORTE";
};

type Chamado = {
  id: number;
  titulo: string;
  descricao: string | null;
  prioridade: Prioridade;
  status: Status;
  solicitante_nome: string | null;
  id_responsavel: number;
  data_abertura: string;
  data_solucao: string | null;
  responsavel?: Pick<Usuario, "id" | "nome" | "email">;
};

const STATUS_LABEL: Record<Status, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDO: "Resolvido",
  FECHADO: "Fechado",
};

const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  BAIXA: "Baixa",
  MEDIA: "Media",
  ALTA: "Alta",
};

const statusOptions: Status[] = ["ABERTO", "EM_ANDAMENTO", "RESOLVIDO", "FECHADO"];
const prioridadeOptions: Prioridade[] = ["BAIXA", "MEDIA", "ALTA"];

const statusStyle: Record<Status, string> = {
  ABERTO: "border-sky-200 bg-sky-50 text-sky-700",
  EM_ANDAMENTO: "border-amber-200 bg-amber-50 text-amber-800",
  RESOLVIDO: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FECHADO: "border-slate-200 bg-slate-100 text-slate-600",
};

const prioridadeStyle: Record<Prioridade, string> = {
  BAIXA: "border-slate-200 bg-slate-50 text-slate-600",
  MEDIA: "border-violet-200 bg-violet-50 text-violet-700",
  ALTA: "border-red-200 bg-red-50 text-red-700",
};

const initialForm = {
  titulo: "",
  descricao: "",
  prioridade: "MEDIA" as Prioridade,
  solicitante_nome: "",
  id_responsavel: "",
};

type ChamadoForm = typeof initialForm;

function formatarData(data: string | null) {
  if (!data) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data));
}

async function lerErro(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  return data?.error ?? data?.erro ?? fallback;
}

export function TicketDashboard() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [responsaveis, setResponsaveis] = useState<Usuario[]>([]);
  const [statusFiltro, setStatusFiltro] = useState<Status | "TODOS">("TODOS");
  const [prioridadeFiltro, setPrioridadeFiltro] = useState<Prioridade | "TODAS">("TODAS");
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState(initialForm);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ChamadoForm>(initialForm);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  const ehAdmin = usuario?.role === "ADMIN";

  async function carregarDados() {
    setErro("");
    setCarregando(true);

    const params = new URLSearchParams();
    if (statusFiltro !== "TODOS") params.set("status", statusFiltro);
    if (prioridadeFiltro !== "TODAS") params.set("prioridade", prioridadeFiltro);

    const [meResponse, chamadosResponse, responsaveisResponse] = await Promise.all([
      fetch("/api/auth/me"),
      fetch(`/api/chamados?${params.toString()}`),
      fetch("/api/responsaveis"),
    ]);

    setCarregando(false);

    if (!meResponse.ok) {
      window.location.href = "/login";
      return;
    }

    if (!chamadosResponse.ok) {
      setErro(await lerErro(chamadosResponse, "Nao foi possivel carregar os chamados."));
      return;
    }

    if (!responsaveisResponse.ok) {
      setErro(await lerErro(responsaveisResponse, "Nao foi possivel carregar os responsaveis."));
      return;
    }

    const meData = await meResponse.json();
    setUsuario(meData.usuario);
    setChamados(await chamadosResponse.json());
    setResponsaveis(await responsaveisResponse.json());
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void carregarDados();
    }, 0);

    return () => window.clearTimeout(timer);

  }, [statusFiltro, prioridadeFiltro]);

  const chamadosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return chamados;

    return chamados.filter((chamado) => {
      return [
        chamado.titulo,
        chamado.descricao,
        chamado.solicitante_nome,
        chamado.responsavel?.nome,
      ]
        .filter(Boolean)
        .some((campo) => campo?.toLowerCase().includes(termo));
    });
  }, [busca, chamados]);

  const resumo = useMemo(() => {
    return {
      total: chamados.length,
      abertos: chamados.filter((chamado) => chamado.status === "ABERTO").length,
      andamento: chamados.filter((chamado) => chamado.status === "EM_ANDAMENTO").length,
      resolvidos: chamados.filter((chamado) => chamado.status === "RESOLVIDO").length,
    };
  }, [chamados]);

  async function criarChamado(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSalvando(true);

    const response = await fetch("/api/chamados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: form.titulo,
        descricao: form.descricao || undefined,
        prioridade: form.prioridade,
        solicitante_nome: form.solicitante_nome || undefined,
        id_responsavel: form.id_responsavel || undefined,
      }),
    });

    setSalvando(false);

    if (!response.ok) {
      setErro(await lerErro(response, "Nao foi possivel criar o chamado."));
      return;
    }

    setForm(initialForm);
    await carregarDados();
  }

  async function atualizarStatus(id: number, status: Status) {
    setErro("");
    setProcessandoId(id);

    const response = await fetch(`/api/chamados/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setProcessandoId(null);

    if (!response.ok) {
      setErro(await lerErro(response, "Nao foi possivel atualizar o status."));
      return;
    }

    await carregarDados();
  }

  function iniciarEdicao(chamado: Chamado) {
    setErro("");
    setEditandoId(chamado.id);
    setEditForm({
      titulo: chamado.titulo,
      descricao: chamado.descricao ?? "",
      prioridade: chamado.prioridade,
      solicitante_nome: chamado.solicitante_nome ?? "",
      id_responsavel: String(chamado.id_responsavel),
    });
  }

  async function salvarEdicao(id: number) {
    setErro("");
    setProcessandoId(id);

    const response = await fetch(`/api/chamados/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: editForm.titulo,
        descricao: editForm.descricao || undefined,
        prioridade: editForm.prioridade,
        solicitante_nome: editForm.solicitante_nome || undefined,
        id_responsavel: editForm.id_responsavel,
      }),
    });

    setProcessandoId(null);

    if (!response.ok) {
      setErro(await lerErro(response, "Nao foi possivel editar o chamado."));
      return;
    }

    setEditandoId(null);
    await carregarDados();
  }

  async function excluirChamado(id: number) {
    const confirmado = window.confirm("Excluir este chamado definitivamente?");
    if (!confirmado) return;

    setErro("");
    setProcessandoId(id);

    const response = await fetch(`/api/chamados/${id}`, { method: "DELETE" });

    setProcessandoId(null);

    if (!response.ok) {
      setErro(await lerErro(response, "Nao foi possivel excluir o chamado."));
      return;
    }

    await carregarDados();
  }

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-slate-950">
      <header className="border-b border-slate-200 bg-white/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Ticket className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-700">Ticket Flui</p>
              <h1 className="text-2xl font-semibold tracking-normal">Painel de chamados</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {usuario ? (
              <div className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
                <ShieldCheck className="size-4 text-emerald-700" />
                {usuario.role}
              </div>
            ) : null}
            <Button variant="outline" onClick={() => void carregarDados()}>
              <RefreshCcw />
              Atualizar
            </Button>
            <Button variant="ghost" onClick={() => void sair()}>
              <LogOut />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        <aside className="space-y-4">
          {ehAdmin ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Novo chamado</h2>
              <Plus className="size-4 text-emerald-700" />
            </div>
            <form className="space-y-3" onSubmit={criarChamado}>
              <label className="block space-y-1.5 text-sm font-medium">
                Titulo
                <Input
                  value={form.titulo}
                  onChange={(event) => setForm((atual) => ({ ...atual, titulo: event.target.value }))}
                  placeholder="Ex.: Notebook sem rede"
                  required
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                Solicitante
                <Input
                  value={form.solicitante_nome}
                  onChange={(event) => setForm((atual) => ({ ...atual, solicitante_nome: event.target.value }))}
                  placeholder="Nome ou setor"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5 text-sm font-medium">
                  Prioridade
                  <Select
                    value={form.prioridade}
                    onChange={(event) => setForm((atual) => ({ ...atual, prioridade: event.target.value as Prioridade }))}
                  >
                    {prioridadeOptions.map((prioridade) => (
                      <option key={prioridade} value={prioridade}>
                        {PRIORIDADE_LABEL[prioridade]}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="block space-y-1.5 text-sm font-medium">
                  Responsavel
                  <Select
                    value={form.id_responsavel}
                    onChange={(event) => setForm((atual) => ({ ...atual, id_responsavel: event.target.value }))}
                  >
                    <option value="">Auto</option>
                    {responsaveis.map((responsavel) => (
                      <option key={responsavel.id} value={responsavel.id}>
                        {responsavel.nome}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
              <label className="block space-y-1.5 text-sm font-medium">
                Descricao
                <Textarea
                  value={form.descricao}
                  onChange={(event) => setForm((atual) => ({ ...atual, descricao: event.target.value }))}
                  placeholder="Descreva o problema com contexto suficiente."
                />
              </label>
              <Button className="w-full" type="submit" disabled={salvando}>
                {salvando ? <Loader2 className="animate-spin" /> : <Plus />}
                Criar chamado
              </Button>
            </form>
          </section>
          ) : (
            <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-xs">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <ShieldCheck className="size-4" />
                Acesso de suporte
              </div>
              Voce visualiza toda a fila, mas so pode alterar o status dos chamados atribuidos a voce.
            </section>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="size-4 text-slate-500" />
              <h2 className="text-base font-semibold">Filtros</h2>
            </div>
            <div className="space-y-3">
              <label className="block space-y-1.5 text-sm font-medium">
                Status
                <Select value={statusFiltro} onChange={(event) => setStatusFiltro(event.target.value as Status | "TODOS")}>
                  <option value="TODOS">Todos</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABEL[status]}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                Prioridade
                <Select
                  value={prioridadeFiltro}
                  onChange={(event) => setPrioridadeFiltro(event.target.value as Prioridade | "TODAS")}
                >
                  <option value="TODAS">Todas</option>
                  {prioridadeOptions.map((prioridade) => (
                    <option key={prioridade} value={prioridade}>
                      {PRIORIDADE_LABEL[prioridade]}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          </section>
        </aside>

        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ResumoCard icon={Ticket} label="Total" value={resumo.total} />
            <ResumoCard icon={CircleDot} label="Abertos" value={resumo.abertos} tone="sky" />
            <ResumoCard icon={Clock3} label="Em andamento" value={resumo.andamento} tone="amber" />
            <ResumoCard icon={CheckCircle2} label="Resolvidos" value={resumo.resolvidos} tone="emerald" />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Fila de atendimento</h2>
              <p className="text-sm text-muted-foreground">{chamadosFiltrados.length} chamado(s) encontrado(s)</p>
            </div>
            <label className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar chamado"
              />
            </label>
          </div>

          {erro ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {erro}
            </div>
          ) : null}

          {carregando ? (
            <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Carregando chamados
            </div>
          ) : chamadosFiltrados.length === 0 ? (
            <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-muted-foreground">
              Nenhum chamado para os filtros atuais.
            </div>
          ) : (
            <div className="grid gap-3">
              {chamadosFiltrados.map((chamado) => (
                <article key={chamado.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                  {editandoId === chamado.id ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                        <label className="block space-y-1.5 text-sm font-medium">
                          Titulo
                          <Input
                            value={editForm.titulo}
                            onChange={(event) => setEditForm((atual) => ({ ...atual, titulo: event.target.value }))}
                          />
                        </label>
                        <label className="block space-y-1.5 text-sm font-medium">
                          Prioridade
                          <Select
                            value={editForm.prioridade}
                            onChange={(event) => setEditForm((atual) => ({ ...atual, prioridade: event.target.value as Prioridade }))}
                          >
                            {prioridadeOptions.map((prioridade) => (
                              <option key={prioridade} value={prioridade}>
                                {PRIORIDADE_LABEL[prioridade]}
                              </option>
                            ))}
                          </Select>
                        </label>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="block space-y-1.5 text-sm font-medium">
                          Solicitante
                          <Input
                            value={editForm.solicitante_nome}
                            onChange={(event) => setEditForm((atual) => ({ ...atual, solicitante_nome: event.target.value }))}
                          />
                        </label>
                        <label className="block space-y-1.5 text-sm font-medium">
                          Responsavel
                          <Select
                            value={editForm.id_responsavel}
                            onChange={(event) => setEditForm((atual) => ({ ...atual, id_responsavel: event.target.value }))}
                          >
                            {responsaveis.map((responsavel) => (
                              <option key={responsavel.id} value={responsavel.id}>
                                {responsavel.nome}
                              </option>
                            ))}
                          </Select>
                        </label>
                      </div>
                      <label className="block space-y-1.5 text-sm font-medium">
                        Descricao
                        <Textarea
                          value={editForm.descricao}
                          onChange={(event) => setEditForm((atual) => ({ ...atual, descricao: event.target.value }))}
                        />
                      </label>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" type="button" onClick={() => setEditandoId(null)}>
                          <X />
                          Cancelar
                        </Button>
                        <Button type="button" onClick={() => void salvarEdicao(chamado.id)} disabled={processandoId === chamado.id}>
                          {processandoId === chamado.id ? <Loader2 className="animate-spin" /> : <Pencil />}
                          Salvar alteracoes
                        </Button>
                      </div>
                    </div>
                  ) : (
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-lg border px-2 py-1 text-xs font-medium", prioridadeStyle[chamado.prioridade])}>
                          {PRIORIDADE_LABEL[chamado.prioridade]}
                        </span>
                        <span className={cn("rounded-lg border px-2 py-1 text-xs font-medium", statusStyle[chamado.status])}>
                          {STATUS_LABEL[chamado.status]}
                        </span>
                        <span className="text-xs text-muted-foreground">#{chamado.id}</span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-950">{chamado.titulo}</h3>
                      {chamado.descricao ? (
                        <p className="line-clamp-2 text-sm leading-6 text-slate-600">{chamado.descricao}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound className="size-4" />
                          {chamado.responsavel?.nome ?? "Sem responsavel"}
                        </span>
                        <span>Solicitante: {chamado.solicitante_nome ?? "Nao informado"}</span>
                        <span>Aberto em {formatarData(chamado.data_abertura)}</span>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-56">
                      {ehAdmin ? (
                        <div className="flex gap-2">
                          <Button className="flex-1" variant="outline" type="button" onClick={() => iniciarEdicao(chamado)}>
                            <Pencil />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            type="button"
                            onClick={() => void excluirChamado(chamado.id)}
                            disabled={processandoId === chamado.id}
                            title="Excluir chamado"
                          >
                            {processandoId === chamado.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                          </Button>
                        </div>
                      ) : null}
                      <Select
                        value={chamado.status}
                        disabled={
                          chamado.status === "FECHADO" ||
                          processandoId === chamado.id ||
                          (!ehAdmin && chamado.id_responsavel !== usuario?.id)
                        }
                        onChange={(event) => void atualizarStatus(chamado.id, event.target.value as Status)}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABEL[status]}
                          </option>
                        ))}
                      </Select>
                      {chamado.data_solucao ? (
                        <span className="text-xs text-muted-foreground">Solucao em {formatarData(chamado.data_solucao)}</span>
                      ) : null}
                      {!ehAdmin && chamado.id_responsavel !== usuario?.id ? (
                        <span className="text-xs text-muted-foreground">Somente o responsavel pode mudar o status.</span>
                      ) : null}
                    </div>
                  </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ResumoCard({
  icon: Icon,
  label,
  value,
  tone = "slate",
}: {
  icon: typeof Ticket;
  label: string;
  value: number;
  tone?: "slate" | "sky" | "amber" | "emerald";
}) {
  const toneClass = {
    slate: "bg-slate-950 text-white",
    sky: "bg-sky-600 text-white",
    amber: "bg-amber-500 text-slate-950",
    emerald: "bg-emerald-600 text-white",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold">{value}</p>
        </div>
        <div className={cn("flex size-10 items-center justify-center rounded-lg", toneClass)}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
