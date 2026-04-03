import { useEffect, useState, useCallback, useRef } from "react";
import { Trophy, TrendingUp, Crown, Medal, Award, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCountUp } from "@/hooks/useCountUp";

interface Vendedor {
  id: string;
  nome: string;
  cargo: string;
  avatar_iniciais: string | null;
  foto_url: string | null;
  vendas: number;
  receita_gerada: number;
  conversao: number;
  propostas_ativas: number;
  meta_mensal: number;
}

/* ── Confetti System ── */
interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
  opacity: number;
  shape: "rect" | "circle" | "triangle";
}

const CONFETTI_COLORS = ["#FFD700", "#FF6B6B", "#4ADE80", "#60A5FA", "#F472B6", "#A78BFA", "#FBBF24", "#34D399", "#F87171", "#818CF8"];

function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const piecesRef = useRef<ConfettiPiece[]>([]);
  const frameRef = useRef<number>();
  const spawnedRef = useRef(false);

  const spawn = useCallback(() => {
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 150; i++) {
      pieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 400,
        rotation: Math.random() * 360,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
        velocityX: (Math.random() - 0.5) * 6,
        velocityY: 2 + Math.random() * 4,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        shape: (["rect", "circle", "triangle"] as const)[Math.floor(Math.random() * 3)],
      });
    }
    piecesRef.current = pieces;
  }, []);

  useEffect(() => {
    if (!active || spawnedRef.current) return;
    spawnedRef.current = true;
    spawn();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const p of piecesRef.current) {
        p.x += p.velocityX;
        p.y += p.velocityY;
        p.rotation += p.rotationSpeed;
        p.velocityY += 0.05; // gravity
        p.opacity -= 0.003;

        if (p.opacity <= 0 || p.y > canvas.height + 50) continue;
        alive = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      if (alive) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [active, spawn]);

  // Re-spawn on subsequent activations
  useEffect(() => {
    if (!active) {
      spawnedRef.current = false;
    }
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function MetaBar({ atual, meta }: { atual: number; meta: number }) {
  const pct = meta > 0 ? Math.min((atual / meta) * 100, 100) : 0;
  return (
    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{
          width: `${pct}%`,
          background: pct >= 100
            ? "linear-gradient(90deg, #22c55e, #4ade80)"
            : pct >= 70
            ? "linear-gradient(90deg, #eab308, #facc15)"
            : "linear-gradient(90deg, #ef4444, #f87171)",
        }}
      />
    </div>
  );
}

function PodiumCard({ v, rank, delay }: { v: Vendedor; rank: number; delay: number }) {
  const vendas = useCountUp(v.vendas, 1500, delay);
  const receita = useCountUp(v.receita_gerada, 1800, delay);

  const heights: Record<number, string> = { 1: "h-64", 2: "h-52", 3: "h-44" };
  const badges: Record<number, { icon: typeof Crown; color: string; bg: string; label: string }> = {
    1: { icon: Crown, color: "text-yellow-300", bg: "from-yellow-500/30 to-yellow-600/10", label: "1º Lugar" },
    2: { icon: Medal, color: "text-gray-300", bg: "from-gray-400/20 to-gray-500/10", label: "2º Lugar" },
    3: { icon: Award, color: "text-amber-600", bg: "from-amber-600/20 to-amber-700/10", label: "3º Lugar" },
  };

  const b = badges[rank];
  const Icon = b.icon;
  const pctMeta = v.meta_mensal > 0 ? Math.round((v.receita_gerada / v.meta_mensal) * 100) : 0;

  return (
    <div
      className="flex flex-col items-center opacity-0"
      style={{ animation: `tvFadeUp 0.8s ease-out ${delay}ms forwards` }}
    >
      {/* Avatar */}
      <div className={`relative mb-3 ${rank === 1 ? "scale-110" : ""}`}>
        <div className={`rounded-full border-4 ${rank === 1 ? "border-yellow-400 w-28 h-28" : rank === 2 ? "border-gray-300 w-24 h-24" : "border-amber-600 w-20 h-20"} overflow-hidden bg-white/10 shadow-2xl`}>
          {v.foto_url ? (
            <img src={v.foto_url} alt={v.nome} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
              {v.avatar_iniciais}
            </div>
          )}
        </div>
        <div className={`absolute -top-2 -right-2 ${rank === 1 ? "w-10 h-10" : "w-8 h-8"} rounded-full bg-gradient-to-br ${b.bg} backdrop-blur-sm flex items-center justify-center border border-white/20`}>
          <Icon className={`${rank === 1 ? "w-5 h-5" : "w-4 h-4"} ${b.color}`} />
        </div>
      </div>

      {/* Info */}
      <h3 className={`font-bold text-white ${rank === 1 ? "text-xl" : "text-lg"} mb-0.5`}>{v.nome}</h3>
      <p className="text-white/50 text-xs mb-3">{v.cargo}</p>

      {/* Stats */}
      <div className={`rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 w-full ${heights[rank]} flex flex-col justify-between`}>
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-3xl font-black text-white">{vendas}</p>
            <p className="text-white/40 text-xs">vendas</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{fmt(receita)}</p>
            <p className="text-white/40 text-xs">receita gerada</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">{v.conversao}%</p>
            <p className="text-white/40 text-xs">conversão</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/40 text-[10px]">Meta mensal</span>
            <span className={`text-[10px] font-bold ${pctMeta >= 100 ? "text-green-400" : pctMeta >= 70 ? "text-yellow-400" : "text-red-400"}`}>
              {pctMeta}%
            </span>
          </div>
          <MetaBar atual={v.receita_gerada} meta={v.meta_mensal} />
        </div>
      </div>
    </div>
  );
}

function TableRow({ v, rank, delay }: { v: Vendedor; rank: number; delay: number }) {
  const pctMeta = v.meta_mensal > 0 ? Math.round((v.receita_gerada / v.meta_mensal) * 100) : 0;

  return (
    <tr
      className="border-b border-white/5 hover:bg-white/5 transition-colors opacity-0"
      style={{ animation: `tvSlideIn 0.5s ease-out ${delay}ms forwards` }}
    >
      <td className="py-3 px-4">
        <span className="text-white/50 font-bold text-lg">{rank}º</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/10 shrink-0">
            {v.foto_url ? (
              <img src={v.foto_url} alt={v.nome} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                {v.avatar_iniciais}
              </div>
            )}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{v.nome}</p>
            <p className="text-white/40 text-xs">{v.cargo}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-white font-bold text-lg">{v.vendas}</span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-white font-semibold">{fmt(v.receita_gerada)}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-white">{v.conversao}%</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <MetaBar atual={v.receita_gerada} meta={v.meta_mensal} />
          <span className={`text-xs font-bold min-w-[35px] text-right ${pctMeta >= 100 ? "text-green-400" : pctMeta >= 70 ? "text-yellow-400" : "text-red-400"}`}>
            {pctMeta}%
          </span>
        </div>
      </td>
    </tr>
  );
}

export default function RankingTV() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [clock, setClock] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevMetaAchieversRef = useRef<Set<string>>(new Set());

  // Fetch data
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("ranking_vendedores" as any)
        .select("*")
        .eq("ativo", true)
        .order("vendas", { ascending: false });
      if (data) setVendedores(data as any);
    }
    load();

    // Realtime subscription
    const channel = supabase
      .channel("ranking-tv")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ranking_vendedores" },
        () => {
          load();
          setRefreshKey((k) => k + 1);
        }
      )
      .subscribe();

    // Auto-refresh every 60s
    const interval = setInterval(() => {
      load();
      setRefreshKey((k) => k + 1);
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Detect new meta achievers → trigger confetti
  useEffect(() => {
    const currentAchievers = new Set(
      vendedores
        .filter((v) => v.meta_mensal > 0 && v.receita_gerada >= v.meta_mensal)
        .map((v) => v.id)
    );
    const prev = prevMetaAchieversRef.current;
    const hasNew = [...currentAchievers].some((id) => !prev.has(id));

    if (hasNew && prev.size > 0) {
      // Only trigger after initial load (prev.size > 0 means we already loaded once)
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 6000);
    }
    // Also trigger on first load if anyone is at 100%
    if (prev.size === 0 && currentAchievers.size > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 6000);
    }
    prevMetaAchieversRef.current = currentAchievers;
  }, [vendedores]);

  const top3 = vendedores.slice(0, 3);
  const rest = vendedores.slice(3);

  // Reorder for podium: 2nd, 1st, 3rd
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumRanks = top3.length === 3 ? [2, 1, 3] : [1, 2, 3];

  const totalVendas = vendedores.reduce((s, v) => s + v.vendas, 0);
  const totalReceita = vendedores.reduce((s, v) => s + v.receita_gerada, 0);

  return (
    <div className="fixed inset-0 bg-[#0f0f13] text-white overflow-hidden" key={refreshKey}>
      <ConfettiCanvas active={showConfetti} />
      <style>{`
        @keyframes tvFadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tvSlideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(149,82,81,0.3); }
          50% { box-shadow: 0 0 40px rgba(149,82,81,0.6); }
        }
      `}</style>

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1018] via-[#0f0f13] to-[#0d1117]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,rgba(149,82,81,0.15),transparent_70%)]" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#955251] to-[#7a3e3d] flex items-center justify-center shadow-lg" style={{ animation: "pulse-glow 3s ease-in-out infinite" }}>
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                RANKING DE VENDAS
              </h1>
              <p className="text-white/40 text-sm">
                {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(/^\w/, (c) => c.toUpperCase())}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Summary cards */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center">
                <p className="text-2xl font-black text-white">{totalVendas}</p>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Vendas</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center">
                <p className="text-2xl font-black text-white">{fmt(totalReceita)}</p>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Receita</p>
              </div>
            </div>

            {/* Clock */}
            <div className="text-right">
              <p className="text-3xl font-mono font-bold text-white/80 tabular-nums">
                {clock.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
              <p className="text-white/30 text-xs">
                {clock.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
              </p>
            </div>
          </div>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-6 lg:gap-10 mb-8">
          {podiumOrder.map((v, i) =>
            v ? (
              <PodiumCard
                key={v.id}
                v={v}
                rank={podiumRanks[i]}
                delay={i === 1 ? 0 : i === 0 ? 200 : 400}
              />
            ) : null
          )}
        </div>

        {/* Table */}
        {rest.length > 0 && (
          <div className="flex-1 min-h-0 overflow-auto rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 text-left text-white/30 text-xs uppercase tracking-wider font-medium w-16">#</th>
                  <th className="py-3 px-4 text-left text-white/30 text-xs uppercase tracking-wider font-medium">Vendedor</th>
                  <th className="py-3 px-4 text-center text-white/30 text-xs uppercase tracking-wider font-medium">Vendas</th>
                  <th className="py-3 px-4 text-right text-white/30 text-xs uppercase tracking-wider font-medium">Receita</th>
                  <th className="py-3 px-4 text-center text-white/30 text-xs uppercase tracking-wider font-medium">Conv.</th>
                  <th className="py-3 px-4 text-left text-white/30 text-xs uppercase tracking-wider font-medium w-48">Meta</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((v, i) => (
                  <TableRow key={v.id} v={v} rank={i + 4} delay={600 + i * 100} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#955251]" />
            <span className="text-white/30 text-xs">CORA — Plataforma Inteligente para Corretoras</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-white/30 text-xs">Atualização em tempo real</span>
          </div>
        </div>
      </div>
    </div>
  );
}
