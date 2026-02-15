import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lock, Users, MessageSquare, CreditCard, Loader2, RefreshCw, BarChart3, Eye, TrendingUp, DollarSign, Activity, ArrowUpRight, Zap, Globe, Link2, Megaphone, MousePointerClick, Target, CheckCircle, XCircle, Upload, Trash2, Image, FolderOpen, Star, Crown, UserX, Plus, ExternalLink, Power, Copy, Code, MailCheck, Mail, Send } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend } from "recharts";
import { models } from "@/data/models";
import { toast } from "sonner";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data`;

interface Profile { id: string; user_id: string; display_name: string; created_at: string; }
interface Conversation { id: string; user_id: string; model_slug: string; created_at: string; }
interface CheckoutAttempt { id: string; customer_name: string; customer_email: string; model_name: string; plan_name: string; plan_price: number; payment_status: string; payment_id: string; created_at: string; user_id: string | null; }
interface DashboardData {
  totalUsers: number; totalConversations: number; totalCheckouts: number;
  approvedCheckouts: number; totalRevenue: number; totalPageViews: number;
  recentViews24h: number; recentCheckouts24h: number;
  modelViews: Record<string, number>; modelCheckouts: Record<string, number>;
  pageTypeBreakdown: Record<string, number>; conversionRate: string;
}
interface TrackingData {
  totalClicks: number; totalCheckouts: number; totalApproved: number;
  totalRevenue: number; totalPixValue: number; conversionRate: string;
  bySource: { name: string; clicks: number; checkouts: number; approved: number; revenue: number }[];
  byMedium: { name: string; clicks: number; checkouts: number; approved: number; revenue: number }[];
  byCampaign: { name: string; clicks: number; checkouts: number; approved: number; revenue: number }[];
  dailyTrend: { date: string; views: number; pixGerados: number; aprovados: number; revenue: number }[];
  utmCombos: { name: string; clicks: number }[];
  referrers: { name: string; clicks: number }[];
}
interface ContentFile { name: string; path: string; publicUrl: string; created_at: string; metadata: any; }
interface MemberEntry { id: string; customer_name: string; customer_email: string; model_name: string; plan_name: string; plan_price: number; payment_status: string; created_at: string; user_id: string | null; display_name: string; }
interface MonitoredDomain { id: string; domain: string; label: string; notes: string; is_active: boolean; created_at: string; }

const CHART_COLORS = ["hsl(24, 95%, 53%)", "hsl(280, 70%, 50%)", "hsl(340, 80%, 55%)", "hsl(150, 70%, 40%)", "hsl(270, 65%, 55%)", "hsl(40, 90%, 50%)", "hsl(0, 85%, 55%)", "hsl(200, 80%, 50%)", "hsl(60, 80%, 45%)", "hsl(320, 75%, 50%)"];

const Admin = () => {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("tracking");

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [checkouts, setCheckouts] = useState<CheckoutAttempt[]>([]);
  const [contentFiles, setContentFiles] = useState<ContentFile[]>([]);
  const [contentFolder, setContentFolder] = useState("");
  const [uploading, setUploading] = useState(false);
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [membersFilter, setMembersFilter] = useState("");
  const [domains, setDomains] = useState<MonitoredDomain[]>([]);
  const [newDomain, setNewDomain] = useState({ domain: "", label: "", notes: "" });
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [recovery, setRecovery] = useState<{ totalPending: number; emailSent: number; emailNotSent: number; pending: CheckoutAttempt[] } | null>(null);
  const [triggeringRecovery, setTriggeringRecovery] = useState(false);
  const [previewSlug, setPreviewSlug] = useState("");
  const [previewContent, setPreviewContent] = useState<{ name: string; url: string; type: string; created_at: string }[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async (table: string, extra?: Record<string, any>) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, table, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data || [];
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const data = await fetchData("tracking");
    if (data && !error) {
      setAuthenticated(true);
      setTracking(data);
    }
  };

  const loadTab = async (tab: string) => {
    setActiveTab(tab);
    if (tab === "tracking") {
      const d = await fetchData("tracking");
      if (d) setTracking(d);
    } else if (tab === "dashboard") {
      const d = await fetchData("dashboard");
      if (d) setDashboard(d);
    } else if (tab === "cadastros") {
      setProfiles(await fetchData("profiles") || []);
    } else if (tab === "conversas") {
      setConversations(await fetchData("conversations") || []);
    } else if (tab === "checkouts") {
      setCheckouts(await fetchData("checkouts") || []);
    } else if (tab === "modelos") {
      // Models are local, no fetch needed
    } else if (tab === "membros") {
      const d = await fetchData("members");
      if (d) setMembers(d);
    } else if (tab === "dominios") {
      const d = await fetchData("domains");
      if (d) setDomains(d);
    } else if (tab === "conteudo") {
      await loadContent(contentFolder);
    } else if (tab === "recuperacao") {
      const d = await fetchData("recovery");
      if (d) setRecovery(d);
    } else if (tab === "preview") {
      // Don't auto-load, user picks a model
    }
  };

  const loadContent = async (folder: string) => {
    const d = await fetchData("list_content", { folder });
    if (d) setContentFiles(d.filter((f: any) => f.name !== ".emptyFolderPlaceholder"));
  };

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const filePath = contentFolder ? `${contentFolder}/${file.name}` : file.name;
        const formData = new FormData();
        formData.append("password", password);
        formData.append("table", "upload_content");
        formData.append("file", file);
        formData.append("file_path", filePath);

        const res = await fetch(FUNCTION_URL, { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        if (!res.ok) throw new Error(json.error);
      }
      toast.success("Upload concluído!");
      await loadContent(contentFolder);
    } catch (err: any) {
      toast.error(err.message || "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteContent = async (paths: string[]) => {
    if (!confirm(`Deletar ${paths.length} arquivo(s)?`)) return;
    await fetchData("delete_content", { file_paths: paths });
    toast.success("Arquivo(s) deletado(s)!");
    await loadContent(contentFolder);
  };

  const updateCheckoutStatus = async (checkoutId: string, newStatus: string) => {
    if (!confirm(`Alterar status para "${newStatus}"?`)) return;
    const result = await fetchData("update_checkout_status", { checkout_id: checkoutId, new_status: newStatus });
    if (result) {
      toast.success("Status atualizado!");
      setCheckouts(prev => prev.map(c => c.id === checkoutId ? { ...c, payment_status: newStatus } : c));
    }
  };

  const revokeAccess = async (checkoutId: string, memberName: string) => {
    if (!confirm(`Revogar acesso de "${memberName}"?`)) return;
    const result = await fetchData("revoke_access", { checkout_id: checkoutId });
    if (result) {
      toast.success("Acesso revogado!");
      setMembers(prev => prev.filter(m => m.id !== checkoutId));
    }
  };

  const addDomain = async () => {
    if (!newDomain.domain.trim()) return toast.error("Domínio é obrigatório");
    const result = await fetchData("add_domain", newDomain);
    if (result) {
      toast.success("Domínio adicionado!");
      setDomains(prev => [result[0] || result, ...prev]);
      setNewDomain({ domain: "", label: "", notes: "" });
      setShowAddDomain(false);
    }
  };

  const toggleDomainActive = async (domainId: string, currentActive: boolean) => {
    const result = await fetchData("update_domain", { domain_id: domainId, is_active: !currentActive });
    if (result) {
      toast.success(!currentActive ? "Domínio ativado!" : "Domínio desativado!");
      setDomains(prev => prev.map(d => d.id === domainId ? { ...d, is_active: !currentActive } : d));
    }
  };

  const deleteDomain = async (domainId: string, domainName: string) => {
    if (!confirm(`Deletar domínio "${domainName}"?`)) return;
    const result = await fetchData("delete_domain", { domain_id: domainId });
    if (result) {
      toast.success("Domínio removido!");
      setDomains(prev => prev.filter(d => d.id !== domainId));
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

  const statusColor = (s: string) => {
    if (s === "approved") return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (s === "rejected") return "text-red-700 bg-red-50 border-red-200";
    return "text-amber-700 bg-amber-50 border-amber-200";
  };

  const statusLabel = (s: string) => {
    if (s === "approved") return "✅ Aprovado";
    if (s === "rejected") return "❌ Rejeitado";
    return "⏳ Pendente";
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-slate-700 bg-slate-800/80 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-white text-xl">Painel Administrativo</CardTitle>
            <p className="text-slate-400 text-sm">Acesso restrito</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <Input
              type="password"
              placeholder="Senha de administrador"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 h-12"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button
              onClick={handleLogin}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-orange-500/20"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Acessar Painel"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const modelViewsChart = dashboard
    ? Object.entries(dashboard.modelViews).sort(([, a], [, b]) => b - a).map(([name, views], i) => ({ name, views, fill: CHART_COLORS[i % CHART_COLORS.length] }))
    : [];

  const pageTypePie = dashboard
    ? Object.entries(dashboard.pageTypeBreakdown).map(([name, value], i) => ({
        name: name === "home" ? "Home" : name === "modelo" ? "Perfil Modelo" : name === "checkout" ? "Checkout" : name,
        value, fill: CHART_COLORS[i % CHART_COLORS.length],
      }))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shrink-0">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-white truncate">Painel Admin</h1>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Gerenciamento completo</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => loadTab(activeTab)} className="text-slate-400 hover:text-white shrink-0">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="ml-2 hidden sm:inline">Atualizar</span>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <Tabs value={activeTab} onValueChange={loadTab}>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-6 scrollbar-hide">
            <TabsList className="bg-slate-800/50 border border-slate-700/50 inline-flex w-max md:w-auto md:flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="tracking" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-1.5 text-xs whitespace-nowrap">
                <Target className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Rastreamento</span><span className="sm:hidden">Track</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-1.5 text-xs whitespace-nowrap">
                <BarChart3 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Dashboard</span><span className="sm:hidden">Dash</span>
              </TabsTrigger>
              <TabsTrigger value="modelos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-1.5 text-xs whitespace-nowrap">
                <Star className="h-3.5 w-3.5" /> Modelos
              </TabsTrigger>
              <TabsTrigger value="cadastros" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-1.5 text-xs whitespace-nowrap">
                <Users className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Usuários</span><span className="sm:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger value="checkouts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-1.5 text-xs whitespace-nowrap">
                <CreditCard className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Pagamentos</span><span className="sm:hidden">Pgtos</span>
              </TabsTrigger>
              <TabsTrigger value="conversas" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-1.5 text-xs whitespace-nowrap">
                <MessageSquare className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Conversas</span><span className="sm:hidden">Chat</span>
              </TabsTrigger>
              <TabsTrigger value="conteudo" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-1.5 text-xs whitespace-nowrap">
                <Image className="h-3.5 w-3.5" /> Conteúdo
              </TabsTrigger>
              <TabsTrigger value="membros" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-1.5 text-xs whitespace-nowrap">
                <Crown className="h-3.5 w-3.5" /> Membros
              </TabsTrigger>
              <TabsTrigger value="dominios" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-1.5 text-xs whitespace-nowrap">
                <Globe className="h-3.5 w-3.5" /> Domínios
              </TabsTrigger>
              <TabsTrigger value="recuperacao" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-1.5 text-xs whitespace-nowrap">
                <Mail className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Recuperação</span><span className="sm:hidden">Recup</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-1.5 text-xs whitespace-nowrap">
                <Eye className="h-3.5 w-3.5" /> Preview
              </TabsTrigger>
            </TabsList>
          </div>

          {/* =================== TRACKING TAB =================== */}
          <TabsContent value="tracking">
            {loading && !tracking ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
            ) : tracking ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                  <KpiCard icon={<MousePointerClick className="h-5 w-5" />} label="Cliques" value={tracking.totalClicks} sub="Total de visitas" color="from-blue-500 to-cyan-500" />
                  <KpiCard icon={<CreditCard className="h-5 w-5" />} label="PIX Gerados" value={tracking.totalCheckouts} sub={`${tracking.totalApproved} aprovados`} color="from-orange-500 to-pink-500" />
                  <KpiCard icon={<DollarSign className="h-5 w-5" />} label="Receita" value={`R$ ${tracking.totalRevenue.toFixed(2).replace(".", ",")}`} sub="Total faturado" color="from-emerald-500 to-green-500" />
                  <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="Conversão" value={`${tracking.conversionRate}%`} sub="Cliques → Checkout" color="from-violet-500 to-purple-500" />
                  <KpiCard icon={<Zap className="h-5 w-5" />} label="Ticket Médio" value={`R$ ${tracking.totalApproved > 0 ? (tracking.totalRevenue / tracking.totalApproved).toFixed(2).replace(".", ",") : "0,00"}`} sub="Por aprovado" color="from-amber-500 to-orange-500" />
                  <KpiCard icon={<Target className="h-5 w-5" />} label="PIX Gerados (R$)" value={`R$ ${(tracking.totalPixValue || 0).toFixed(2).replace(".", ",")}`} sub={`${tracking.totalCheckouts} transações`} color="from-teal-500 to-emerald-500" />
                </div>

                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-400" /> Tendência Diária (30 dias)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tracking.dailyTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={tracking.dailyTrend}>
                          <defs>
                            <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(200, 80%, 50%)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(200, 80%, 50%)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="pixGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="aprovadosGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false}
                            tickFormatter={(v) => { const [,m,d] = v.split("-"); return `${d}/${m}`; }} />
                          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }}
                            labelFormatter={(v) => { const [y,m,d] = v.split("-"); return `${d}/${m}/${y}`; }} />
                          <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                          <Area type="monotone" dataKey="views" name="Visitas" stroke="hsl(200, 80%, 50%)" fill="url(#viewsGrad)" strokeWidth={2} />
                          <Area type="monotone" dataKey="pixGerados" name="PIX Gerados" stroke="hsl(24, 95%, 53%)" fill="url(#pixGrad)" strokeWidth={2} />
                          <Area type="monotone" dataKey="aprovados" name="Aprovados" stroke="hsl(142, 71%, 45%)" fill="url(#aprovadosGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : <p className="text-center text-slate-500 py-12">Sem dados ainda</p>}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><Globe className="h-4 w-4 text-cyan-400" />Por Fonte (utm_source)</CardTitle></CardHeader>
                    <CardContent>
                      {tracking.bySource.length > 0 ? (
                        <div className="space-y-3">
                          {tracking.bySource.slice(0, 10).map((s, i) => {
                            const max = tracking.bySource[0]?.clicks || 1;
                            const pct = (s.clicks / max) * 100;
                            return (
                              <div key={s.name} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-white font-medium truncate max-w-[60%]">{s.name}</span>
                                  <span className="text-xs text-slate-400 font-mono">{s.clicks} cliques</span>
                                </div>
                                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : <p className="text-center text-slate-500 py-8">Sem dados UTM ainda</p>}
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><Link2 className="h-4 w-4 text-violet-400" />Por Mídia (utm_medium)</CardTitle></CardHeader>
                    <CardContent>
                      {tracking.byMedium.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie data={tracking.byMedium.slice(0, 7).map((m, i) => ({ ...m, fill: CHART_COLORS[i % CHART_COLORS.length] }))}
                              dataKey="clicks" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} strokeWidth={2} stroke="#1e293b">
                              {tracking.byMedium.slice(0, 7).map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                            </Pie>
                            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }} />
                            <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 11 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : <p className="text-center text-slate-500 py-8">Sem dados UTM ainda</p>}
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><Megaphone className="h-4 w-4 text-pink-400" />Campanhas — Cliques, Compras, CPC e CTR</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    {tracking.byCampaign.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-700/50 hover:bg-transparent">
                              <TableHead className="text-slate-400 text-xs font-semibold uppercase">Campanha</TableHead>
                              <TableHead className="text-slate-400 text-xs font-semibold uppercase text-right">Cliques</TableHead>
                              <TableHead className="text-slate-400 text-xs font-semibold uppercase text-right">Checkouts</TableHead>
                              <TableHead className="text-slate-400 text-xs font-semibold uppercase text-right">Aprovados</TableHead>
                              <TableHead className="text-slate-400 text-xs font-semibold uppercase text-right">Receita</TableHead>
                              <TableHead className="text-slate-400 text-xs font-semibold uppercase text-right">CTR</TableHead>
                              <TableHead className="text-slate-400 text-xs font-semibold uppercase text-right">CPC</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tracking.byCampaign.slice(0, 15).map((c, i) => {
                              const ctr = c.clicks > 0 ? ((c.checkouts / c.clicks) * 100).toFixed(1) : "0.0";
                              const cpc = c.clicks > 0 ? (c.revenue / c.clicks).toFixed(2).replace(".", ",") : "0,00";
                              return (
                                <TableRow key={i} className="border-slate-700/30 hover:bg-slate-700/20">
                                  <TableCell className="text-slate-300 text-sm font-medium max-w-[200px] truncate">{c.name}</TableCell>
                                  <TableCell className="text-white text-sm font-bold text-right">{c.clicks}</TableCell>
                                  <TableCell className="text-right">
                                    <span className={`text-sm font-bold ${c.checkouts > 0 ? "text-orange-400" : "text-slate-500"}`}>{c.checkouts}</span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className={`text-sm font-bold ${c.approved > 0 ? "text-emerald-400" : "text-slate-500"}`}>{c.approved}</span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className={`text-sm font-bold ${c.revenue > 0 ? "text-emerald-400" : "text-slate-500"}`}>R$ {c.revenue.toFixed(2).replace(".", ",")}</span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${Number(ctr) >= 5 ? "bg-emerald-500/10 text-emerald-400" : Number(ctr) > 0 ? "bg-amber-500/10 text-amber-400" : "bg-slate-700/50 text-slate-500"}`}>
                                      {ctr}%
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-slate-300 text-sm text-right font-mono">R$ {cpc}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : <p className="text-center text-slate-500 py-8">Sem campanhas rastreadas</p>}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-orange-400" />Combinações UTM</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-700/50 hover:bg-transparent">
                              <TableHead className="text-slate-400 text-xs font-semibold uppercase">Combinação</TableHead>
                              <TableHead className="text-slate-400 text-xs font-semibold uppercase text-right">Cliques</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tracking.utmCombos.length > 0 ? tracking.utmCombos.map((c, i) => (
                              <TableRow key={i} className="border-slate-700/30 hover:bg-slate-700/20">
                                <TableCell className="text-slate-300 text-sm font-mono">{c.name}</TableCell>
                                <TableCell className="text-white text-sm font-bold text-right">{c.clicks}</TableCell>
                              </TableRow>
                            )) : (
                              <TableRow><TableCell colSpan={2} className="text-center text-slate-500 py-8">Nenhum UTM rastreado</TableCell></TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><Globe className="h-4 w-4 text-emerald-400" />Referrers</CardTitle></CardHeader>
                    <CardContent>
                      {tracking.referrers.length > 0 ? (
                        <div className="space-y-3">
                          {tracking.referrers.map((r, i) => {
                            const max = tracking.referrers[0]?.clicks || 1;
                            const pct = (r.clicks / max) * 100;
                            return (
                              <div key={r.name} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-white truncate max-w-[65%]">{r.name}</span>
                                  <span className="text-xs text-slate-400 font-mono">{r.clicks}</span>
                                </div>
                                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : <p className="text-center text-slate-500 py-8">Sem referrers registrados</p>}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : null}
          </TabsContent>

          {/* =================== DASHBOARD TAB =================== */}
          <TabsContent value="dashboard">
            {loading && !dashboard ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
            ) : dashboard ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard icon={<Eye className="h-5 w-5" />} label="Visualizações" value={dashboard.totalPageViews} sub={`${dashboard.recentViews24h} nas últimas 24h`} color="from-blue-500 to-cyan-500" />
                  <KpiCard icon={<Users className="h-5 w-5" />} label="Cadastros" value={dashboard.totalUsers} sub={`${dashboard.totalConversations} conversas`} color="from-violet-500 to-purple-500" />
                  <KpiCard icon={<CreditCard className="h-5 w-5" />} label="Checkouts" value={dashboard.totalCheckouts} sub={`${dashboard.approvedCheckouts} aprovados`} color="from-orange-500 to-pink-500" />
                  <KpiCard icon={<DollarSign className="h-5 w-5" />} label="Receita" value={`R$ ${dashboard.totalRevenue.toFixed(2).replace(".", ",")}`} sub={`${dashboard.conversionRate}% conversão`} color="from-emerald-500 to-green-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><Activity className="h-5 w-5 text-blue-400" /></div>
                      <div>
                        <p className="text-sm text-slate-400">Últimas 24h</p>
                        <p className="text-lg font-bold text-white">{dashboard.recentViews24h} views · {dashboard.recentCheckouts24h} checkouts</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-emerald-400" /></div>
                      <div>
                        <p className="text-sm text-slate-400">Taxa de Aprovação</p>
                        <p className="text-lg font-bold text-white">{dashboard.totalCheckouts > 0 ? ((dashboard.approvedCheckouts / dashboard.totalCheckouts) * 100).toFixed(0) : 0}%</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center"><Zap className="h-5 w-5 text-orange-400" /></div>
                      <div>
                        <p className="text-sm text-slate-400">Ticket Médio</p>
                        <p className="text-lg font-bold text-white">R$ {dashboard.approvedCheckouts > 0 ? (dashboard.totalRevenue / dashboard.approvedCheckouts).toFixed(2).replace(".", ",") : "0,00"}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-orange-400" />Interesse por Modelo</CardTitle></CardHeader>
                    <CardContent>
                      {modelViewsChart.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={modelViewsChart}>
                            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }} />
                            <Bar dataKey="views" radius={[6, 6, 0, 0]}>{modelViewsChart.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : <p className="text-center text-slate-500 py-12">Sem dados ainda</p>}
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><Eye className="h-4 w-4 text-blue-400" />Distribuição de Páginas</CardTitle></CardHeader>
                    <CardContent>
                      {pageTypePie.length > 0 ? (
                        <div className="flex items-center gap-4">
                          <ResponsiveContainer width="60%" height={200}>
                            <PieChart><Pie data={pageTypePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} strokeWidth={2} stroke="#1e293b">{pageTypePie.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }} /></PieChart>
                          </ResponsiveContainer>
                          <div className="flex-1 space-y-2">
                            {pageTypePie.map((e, i) => (
                              <div key={i} className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: e.fill }} /><span className="text-xs text-slate-300">{e.name}</span><span className="text-xs text-slate-500 ml-auto">{e.value}</span></div>
                            ))}
                          </div>
                        </div>
                      ) : <p className="text-center text-slate-500 py-12">Sem dados ainda</p>}
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-400" />Ranking de Checkout por Modelo</CardTitle></CardHeader>
                  <CardContent>
                    {Object.keys(dashboard.modelCheckouts).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(dashboard.modelCheckouts).sort(([, a], [, b]) => b - a).map(([name, count], i) => {
                          const max = Math.max(...Object.values(dashboard.modelCheckouts));
                          const pct = max > 0 ? (count / max) * 100 : 0;
                          return (
                            <div key={name} className="flex items-center gap-3">
                              <span className="text-sm font-bold text-slate-400 w-6">#{i + 1}</span>
                              <span className="text-sm text-white w-40 truncate">{name}</span>
                              <div className="flex-1 h-3 bg-slate-700/50 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} /></div>
                              <span className="text-sm font-bold text-white w-8 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="text-center text-slate-500 py-8">Sem checkouts ainda</p>}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>

          {/* =================== MODELOS TAB =================== */}
          <TabsContent value="modelos">
            <div className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" /> Modelos Cadastradas ({models.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700/50 hover:bg-transparent">
                          <TableHead className="text-slate-400 text-xs font-semibold uppercase">Modelo</TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold uppercase">Slug</TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold uppercase">Fotos</TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold uppercase">Vídeos</TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold uppercase">Curtidas</TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold uppercase">Plano Principal</TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold uppercase">Verificada</TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold uppercase">Previews</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {models.map((m) => (
                          <TableRow key={m.slug} className="border-slate-700/30 hover:bg-slate-700/20">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <img src={m.avatar} alt={m.name} className="h-8 w-8 rounded-full object-cover" />
                                <div>
                                  <p className="text-sm font-semibold text-white">{m.name}</p>
                                  <p className="text-xs text-slate-400">{m.username}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300 text-sm font-mono">{m.slug}</TableCell>
                            <TableCell className="text-white text-sm">{m.stats.photos}</TableCell>
                            <TableCell className="text-white text-sm">{m.stats.videos}</TableCell>
                            <TableCell className="text-white text-sm">{m.stats.likes}</TableCell>
                            <TableCell className="text-white text-sm">R$ {m.mainPlan.price}</TableCell>
                            <TableCell>
                              {m.verified ? (
                                <span className="text-emerald-400 text-xs font-semibold">✅ Sim</span>
                              ) : (
                                <span className="text-slate-500 text-xs">Não</span>
                              )}
                            </TableCell>
                            <TableCell className="text-white text-sm">{m.previews?.length || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* =================== USUARIOS TAB =================== */}
          <TabsContent value="cadastros">
            <DataTable title="Usuários cadastrados" count={profiles.length} loading={loading} onRefresh={() => loadTab("cadastros")} headers={["Nome", "User ID", "Data"]}
              rows={profiles.map((p) => [p.display_name || "—", <span className="font-mono text-xs text-slate-400">{p.user_id.slice(0, 8)}...</span>, formatDate(p.created_at)])} emptyMsg="Nenhum cadastro encontrado" />
          </TabsContent>

          {/* =================== PAGAMENTOS TAB =================== */}
          <TabsContent value="checkouts">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700/50">
                <CardTitle className="text-white text-base">Pagamentos ({checkouts.length})</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => loadTab("checkouts")} className="text-slate-400 hover:text-white">
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700/50 hover:bg-transparent">
                          <TableHead className="text-slate-400 text-xs font-semibold uppercase">Cliente</TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold uppercase">Email</TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold uppercase">Modelo</TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold uppercase">Plano</TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold uppercase">Preço</TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold uppercase">Status</TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold uppercase">Data</TableHead>
                          <TableHead className="text-slate-400 text-xs font-semibold uppercase">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {checkouts.length > 0 ? checkouts.map((c) => (
                          <TableRow key={c.id} className="border-slate-700/30 hover:bg-slate-700/20">
                            <TableCell className="text-slate-300 text-sm">{c.customer_name}</TableCell>
                            <TableCell className="text-slate-300 text-sm">{c.customer_email}</TableCell>
                            <TableCell className="text-slate-300 text-sm">{c.model_name}</TableCell>
                            <TableCell className="text-slate-300 text-sm">{c.plan_name}</TableCell>
                            <TableCell className="text-white text-sm font-semibold">R$ {Number(c.plan_price).toFixed(2).replace(".", ",")}</TableCell>
                            <TableCell>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor(c.payment_status)}`}>
                                {statusLabel(c.payment_status)}
                              </span>
                            </TableCell>
                            <TableCell className="text-slate-300 text-sm">{formatDate(c.created_at)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {c.payment_status !== "approved" && (
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                    onClick={() => updateCheckoutStatus(c.id, "approved")}>
                                    <CheckCircle className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {c.payment_status !== "rejected" && (
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    onClick={() => updateCheckoutStatus(c.id, "rejected")}>
                                    <XCircle className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell colSpan={8} className="text-center text-slate-500 py-12">Nenhum checkout encontrado</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =================== CONVERSAS TAB =================== */}
          <TabsContent value="conversas">
            <DataTable title="Conversas" count={conversations.length} loading={loading} onRefresh={() => loadTab("conversas")} headers={["Modelo", "User ID", "Data"]}
              rows={conversations.map((c) => [c.model_slug, <span className="font-mono text-xs text-slate-400">{c.user_id.slice(0, 8)}...</span>, formatDate(c.created_at)])} emptyMsg="Nenhuma conversa encontrada" />
          </TabsContent>

          {/* =================== CONTEÚDO TAB =================== */}
          <TabsContent value="conteudo">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Image className="h-4 w-4 text-blue-400" /> Gerenciar Conteúdo
                </CardTitle>
                <p className="text-xs text-slate-400 mt-1">Selecione a modelo para ver/enviar conteúdo</p>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Model folder selector */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {models.map((m) => (
                    <button
                      key={m.slug}
                      onClick={() => {
                        setContentFolder(m.slug);
                        loadContent(m.slug);
                      }}
                      className={`rounded-xl border p-3 flex items-center gap-3 transition-all text-left ${
                        contentFolder === m.slug
                          ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30"
                          : "border-slate-700/50 bg-slate-700/20 hover:border-slate-600"
                      }`}
                    >
                      <img src={m.avatar} alt={m.name} className="h-10 w-10 rounded-full object-cover border-2 border-slate-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-white block truncate">{m.name}</span>
                        <span className="text-[10px] text-slate-500">/{m.slug}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Upload bar when folder selected */}
                {contentFolder && (
                  <div className="flex items-center justify-between bg-slate-700/30 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-orange-400" />
                      <span className="text-sm text-white font-semibold">{contentFolder}/</span>
                      <span className="text-xs text-slate-400">({contentFiles.length} arquivos)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => loadContent(contentFolder)} className="text-slate-400 hover:text-white">
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                      </Button>
                      <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                        className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs gap-1.5">
                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        Upload
                      </Button>
                      <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden"
                        onChange={(e) => e.target.files && handleUpload(e.target.files)} />
                    </div>
                  </div>
                )}

                {/* Files grid */}
                {contentFolder && (
                  loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
                  ) : contentFiles.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {contentFiles.map((f) => (
                        <div key={f.path} className="group relative rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/50">
                          {f.name.match(/\.(mp4|mov|avi|webm)$/i) ? (
                            <div className="aspect-square flex items-center justify-center bg-slate-800">
                              <span className="text-slate-400 text-xs">🎬 {f.name}</span>
                            </div>
                          ) : (
                            <img src={f.publicUrl} alt={f.name} className="aspect-square object-cover w-full" />
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              onClick={() => handleDeleteContent([f.path])}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="p-1.5">
                            <p className="text-[10px] text-slate-400 truncate">{f.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Upload className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">Nenhum arquivo em <code className="bg-slate-700/50 px-1.5 py-0.5 rounded text-orange-400">{contentFolder}/</code></p>
                      <p className="text-slate-600 text-xs mt-1">Clique em "Upload" para adicionar fotos e vídeos</p>
                    </div>
                  )
                )}

                {!contentFolder && (
                  <div className="text-center py-6">
                    <p className="text-slate-500 text-sm">👆 Selecione uma modelo acima para gerenciar o conteúdo</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =================== MEMBROS TAB =================== */}
          <TabsContent value="membros">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700/50">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-400" /> Membros Ativos ({members.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Filtrar por modelo..."
                    value={membersFilter}
                    onChange={(e) => setMembersFilter(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white text-xs h-8 w-44 placeholder:text-slate-500"
                  />
                  <Button variant="ghost" size="icon" onClick={() => loadTab("membros")} className="text-slate-400 hover:text-white">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading && members.length === 0 ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
                ) : (() => {
                  // Group members by model
                  const filtered = membersFilter
                    ? members.filter(m => m.model_name.toLowerCase().includes(membersFilter.toLowerCase()))
                    : members;
                  const grouped = filtered.reduce<Record<string, MemberEntry[]>>((acc, m) => {
                    const key = m.model_name || "Sem modelo";
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(m);
                    return acc;
                  }, {});
                  const modelEntries = Object.entries(grouped).sort(([, a], [, b]) => b.length - a.length);

                  if (modelEntries.length === 0) {
                    return <p className="text-center text-slate-500 py-12">Nenhum membro ativo encontrado</p>;
                  }

                  return (
                    <div className="divide-y divide-slate-700/30">
                      {modelEntries.map(([modelName, modelMembers]) => {
                        const modelData = models.find(m => m.name === modelName);
                        return (
                          <div key={modelName} className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              {modelData && (
                                <img src={modelData.avatar} alt={modelName} className="h-8 w-8 rounded-full object-cover" />
                              )}
                              <div>
                                <h3 className="text-sm font-bold text-white">{modelName}</h3>
                                <p className="text-xs text-slate-400">{modelMembers.length} membro{modelMembers.length !== 1 ? "s" : ""}</p>
                              </div>
                            </div>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-slate-700/50 hover:bg-transparent">
                                    <TableHead className="text-slate-400 text-xs font-semibold uppercase">Nome</TableHead>
                                    <TableHead className="text-slate-400 text-xs font-semibold uppercase">Email</TableHead>
                                    <TableHead className="text-slate-400 text-xs font-semibold uppercase">Plano</TableHead>
                                    <TableHead className="text-slate-400 text-xs font-semibold uppercase">Preço</TableHead>
                                    <TableHead className="text-slate-400 text-xs font-semibold uppercase">Data</TableHead>
                                    <TableHead className="text-slate-400 text-xs font-semibold uppercase">Ações</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {modelMembers.map((m) => (
                                    <TableRow key={m.id} className="border-slate-700/30 hover:bg-slate-700/20">
                                      <TableCell className="text-slate-300 text-sm">{m.display_name}</TableCell>
                                      <TableCell className="text-slate-300 text-sm">{m.customer_email}</TableCell>
                                      <TableCell className="text-slate-300 text-sm">{m.plan_name}</TableCell>
                                      <TableCell className="text-white text-sm font-semibold">R$ {Number(m.plan_price).toFixed(2).replace(".", ",")}</TableCell>
                                      <TableCell className="text-slate-300 text-sm">{formatDate(m.created_at)}</TableCell>
                                      <TableCell>
                                        <Button size="sm" variant="ghost" className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1"
                                          onClick={() => revokeAccess(m.id, m.display_name)}>
                                          <UserX className="h-3.5 w-3.5" />
                                          <span className="text-xs">Revogar</span>
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =================== DOMÍNIOS TAB =================== */}
          <TabsContent value="dominios">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700/50">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-400" /> Domínios Monitorados ({domains.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setShowAddDomain(!showAddDomain)}
                    className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => loadTab("dominios")} className="text-slate-400 hover:text-white">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Tracking Script Install Code */}
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Code className="h-4 w-4 text-cyan-400" /> Código de Tracking
                    </h4>
                    <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 text-xs gap-1.5"
                      onClick={() => {
                        const scriptTag = `<script src="${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tracking-script" defer></script>`;
                        navigator.clipboard.writeText(scriptTag);
                        toast.success("Código copiado!");
                      }}>
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">Cole este script no HTML do site externo (antes do &lt;/body&gt;) para rastrear page views e UTMs:</p>
                  <code className="block bg-slate-900/80 text-cyan-300 text-[11px] p-3 rounded-lg font-mono break-all select-all">
                    {`<script src="${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tracking-script" defer></script>`}
                  </code>
                  <p className="text-[10px] text-slate-500 mt-2">Os dados aparecerão nas abas Rastreamento e Dashboard com page_type "external".</p>
                </div>
                {showAddDomain && (
                  <div className="bg-slate-700/30 rounded-xl p-4 space-y-3 border border-slate-600/50">
                    <h4 className="text-sm font-semibold text-white">Novo Domínio</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        placeholder="dominio.com"
                        value={newDomain.domain}
                        onChange={(e) => setNewDomain(prev => ({ ...prev, domain: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 text-white text-sm placeholder:text-slate-500"
                      />
                      <Input
                        placeholder="Nome/Label (opcional)"
                        value={newDomain.label}
                        onChange={(e) => setNewDomain(prev => ({ ...prev, label: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 text-white text-sm placeholder:text-slate-500"
                      />
                      <Input
                        placeholder="Notas (opcional)"
                        value={newDomain.notes}
                        onChange={(e) => setNewDomain(prev => ({ ...prev, notes: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 text-white text-sm placeholder:text-slate-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addDomain} disabled={loading}
                        className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs">
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddDomain(false)} className="text-slate-400 text-xs">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {loading && domains.length === 0 ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
                ) : domains.length > 0 ? (
                  <div className="space-y-3">
                    {domains.map((d) => (
                      <div key={d.id} className={`rounded-xl border p-4 flex items-center gap-4 transition-colors ${d.is_active ? "bg-slate-700/20 border-slate-600/50" : "bg-slate-800/30 border-slate-700/30 opacity-60"}`}>
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${d.is_active ? "bg-emerald-500/10" : "bg-slate-700/50"}`}>
                          <Globe className={`h-5 w-5 ${d.is_active ? "text-emerald-400" : "text-slate-500"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white truncate">{d.domain}</p>
                            {d.label && <span className="text-xs bg-slate-600/50 text-slate-300 px-2 py-0.5 rounded-full">{d.label}</span>}
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${d.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-600/50 text-slate-500"}`}>
                              {d.is_active ? "● Ativo" : "○ Inativo"}
                            </span>
                          </div>
                          {d.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{d.notes}</p>}
                          <p className="text-[10px] text-slate-500 mt-1">Adicionado em {new Date(d.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                            onClick={() => window.open(`https://${d.domain}`, "_blank")}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost"
                            className={`h-8 w-8 p-0 ${d.is_active ? "text-emerald-400 hover:text-emerald-300" : "text-slate-500 hover:text-slate-300"}`}
                            onClick={() => toggleDomainActive(d.id, d.is_active)}>
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => deleteDomain(d.id, d.domain)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Globe className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Nenhum domínio cadastrado</p>
                    <p className="text-slate-600 text-xs mt-1">Adicione domínios para monitorar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =================== RECUPERAÇÃO TAB =================== */}
          <TabsContent value="recuperacao">
            {loading && !recovery ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
            ) : recovery ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard icon={<CreditCard className="h-5 w-5" />} label="Pendentes" value={recovery.totalPending} sub="Checkouts sem pagamento" color="from-amber-500 to-orange-500" />
                  <KpiCard icon={<MailCheck className="h-5 w-5" />} label="Email Enviado" value={recovery.emailSent} sub="Recuperação enviada" color="from-emerald-500 to-green-500" />
                  <KpiCard icon={<Mail className="h-5 w-5" />} label="Aguardando" value={recovery.emailNotSent} sub="Email ainda não enviado" color="from-blue-500 to-cyan-500" />
                  <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
                    <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                      <Button
                        onClick={async () => {
                          setTriggeringRecovery(true);
                          const result = await fetchData("trigger_recovery");
                          setTriggeringRecovery(false);
                          if (result) {
                            toast.success(`${result.sent || 0} email(s) enviado(s)!`);
                            loadTab("recuperacao");
                          }
                        }}
                        disabled={triggeringRecovery || loading}
                        className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold gap-2"
                      >
                        {triggeringRecovery ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Disparar Agora
                      </Button>
                      <p className="text-[10px] text-slate-500 mt-2 text-center">Enviar emails manualmente</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700/50">
                    <CardTitle className="text-white text-base">Checkouts Pendentes ({recovery.totalPending})</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => loadTab("recuperacao")} className="text-slate-400 hover:text-white">
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700/50 hover:bg-transparent">
                            <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Cliente</TableHead>
                            <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Email</TableHead>
                            <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Modelo</TableHead>
                            <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Plano</TableHead>
                            <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Valor</TableHead>
                            <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Recup.</TableHead>
                            <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recovery.pending.map((c) => (
                            <TableRow key={c.id} className="border-slate-700/30 hover:bg-slate-700/20">
                              <TableCell className="text-slate-300 text-sm font-medium">{c.customer_name || "—"}</TableCell>
                              <TableCell className="text-slate-300 text-sm">{c.customer_email || "—"}</TableCell>
                              <TableCell className="text-slate-300 text-sm">{c.model_name}</TableCell>
                              <TableCell className="text-slate-300 text-sm">{c.plan_name}</TableCell>
                              <TableCell className="text-slate-300 text-sm font-medium">R$ {Number(c.plan_price).toFixed(2).replace(".", ",")}</TableCell>
                              <TableCell>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${(c as any).recovery_email_sent ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                                  {(c as any).recovery_email_sent ? "✅ Enviado" : "⏳ Pendente"}
                                </span>
                              </TableCell>
                              <TableCell className="text-slate-400 text-xs">{formatDate(c.created_at)}</TableCell>
                            </TableRow>
                          ))}
                          {recovery.pending.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-slate-500 py-12">
                                <MailCheck className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                                Nenhum checkout pendente 🎉
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-400" /> Como funciona
                  </h4>
                  <ul className="text-xs text-slate-400 space-y-1.5">
                    <li>• O cron verifica checkouts pendentes há +5min automaticamente (a cada minuto)</li>
                    <li>• Email personalizado é enviado via Resend incentivando o pagamento</li>
                    <li>• Cada cliente recebe no máximo 1 email de recuperação</li>
                    <li>• Use "Disparar Agora" para enviar manualmente</li>
                  </ul>
                </div>
              </div>
            ) : null}
          </TabsContent>

          {/* =================== PREVIEW MEMBROS TAB =================== */}
          <TabsContent value="preview">
            <div className="space-y-6">
              {/* Model selector */}
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="border-b border-slate-700/50 pb-4">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Eye className="h-5 w-5 text-orange-400" /> Pré-visualizar Área de Membros
                  </CardTitle>
                  <p className="text-xs text-slate-400 mt-1">Selecione uma modelo para ver o conteúdo que os assinantes veem</p>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {models.map((m) => (
                      <button
                        key={m.slug}
                        onClick={async () => {
                          setPreviewSlug(m.slug);
                          setPreviewLoading(true);
                          setPreviewContent([]);
                          const d = await fetchData("preview_members", { slug: m.slug });
                          if (d) setPreviewContent(d);
                          setPreviewLoading(false);
                        }}
                        className={`rounded-xl border p-3 flex flex-col items-center gap-2 transition-all ${
                          previewSlug === m.slug
                            ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30"
                            : "border-slate-700/50 bg-slate-700/20 hover:border-slate-600"
                        }`}
                      >
                        <img src={m.avatar} alt={m.name} className="h-12 w-12 rounded-full object-cover border-2 border-slate-600" />
                        <span className="text-xs font-semibold text-white truncate w-full text-center">{m.name}</span>
                        <span className="text-[10px] text-slate-500">{m.username}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Preview content — renders like the real members area */}
              {previewSlug && (() => {
                const pm = models.find(m => m.slug === previewSlug);
                if (!pm) return null;
                const pt = pm.theme;
                const pGradient = `linear-gradient(135deg, hsl(${pt.accentColor}) 0%, hsl(${pt.accentColorEnd}) 100%)`;
                const pVideos = previewContent.filter(c => c.type === "video");
                const pImages = previewContent.filter(c => c.type === "image");
                const pFallback = previewContent.length === 0 ? (pm.previews || []) : [];

                return (
                  <div className="max-w-lg mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50">
                    {/* Header */}
                    <header className="flex items-center justify-between px-4 py-3" style={{ background: pGradient }}>
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-white" />
                        <span className="text-sm font-bold text-white">Área VIP</span>
                      </div>
                      <span className="text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-full">✅ Ativo</span>
                    </header>

                    <div className="bg-[hsl(30,20%,96%)]">
                      {/* Model header card */}
                      <div className="bg-white border-b border-slate-200/60">
                        <div className="flex items-center gap-3 p-4">
                          <div className="h-16 w-16 rounded-full p-[2px] shrink-0" style={{ background: pGradient }}>
                            <img src={pm.avatar} alt={pm.name} className="h-full w-full rounded-full object-cover border-2 border-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 flex items-center gap-1.5 text-base">
                              {pm.name}
                              {pm.verified && <CheckCircle className="h-4 w-4" style={{ color: `hsl(${pt.accentColor})` }} />}
                            </p>
                            <p className="text-xs text-slate-500">{pm.username}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-[10px] text-green-600 font-semibold">Online agora</span>
                            </div>
                          </div>
                          <span className="px-3 py-2 rounded-xl text-xs font-bold text-white shrink-0" style={{ background: pGradient }}>
                            💬 Chat
                          </span>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 border-t border-slate-100">
                          <div className="flex flex-col items-center py-3">
                            <div className="flex items-center gap-1">
                              <Image className="h-3.5 w-3.5" style={{ color: `hsl(${pt.accentColor})` }} />
                              <span className="text-sm font-bold text-slate-900">{pImages.length || pm.stats.photos}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">Fotos</span>
                          </div>
                          <div className="flex flex-col items-center py-3 border-x border-slate-100">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" style={{ color: `hsl(${pt.accentColor})` }} />
                              <span className="text-sm font-bold text-slate-900">{pVideos.length || pm.stats.videos}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">Vídeos</span>
                          </div>
                          <div className="flex flex-col items-center py-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5" style={{ color: `hsl(${pt.accentColor})` }} />
                              <span className="text-sm font-bold text-slate-900">{previewContent.length || pm.stats.posts}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">Posts</span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="px-4 py-4">
                        {previewLoading ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" style={{ color: `hsl(${pt.accentColor})` }} />
                          </div>
                        ) : (
                          <>
                            {/* Videos */}
                            {pVideos.length > 0 && (
                              <div className="mb-6">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                  <Zap className="h-3.5 w-3.5" style={{ color: `hsl(${pt.accentColor})` }} />
                                  Vídeos Exclusivos
                                </h2>
                                <div className="space-y-3">
                                  {pVideos.map((v, i) => (
                                    <div key={i} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                                      <video src={v.url} controls preload="metadata" className="w-full aspect-video object-cover" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Photos */}
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Zap className="h-3.5 w-3.5" style={{ color: `hsl(${pt.accentColor})` }} />
                              Conteúdo Exclusivo
                            </h2>

                            {pImages.length > 0 ? (
                              <div className="grid grid-cols-2 gap-3">
                                {pImages.map((img, i) => (
                                  <div key={i} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                                    <img src={img.url} alt={img.name} className="w-full aspect-[3/4] object-cover" />
                                  </div>
                                ))}
                              </div>
                            ) : pFallback.length > 0 ? (
                              <div className="grid grid-cols-2 gap-3">
                                {pFallback.map((src, i) => (
                                  <div key={i} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                                    <img src={src} alt={`Preview ${i + 1}`} className="w-full aspect-[3/4] object-cover" />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Image className="h-10 w-10 mx-auto mb-2" style={{ color: `hsl(${pt.accentColor})` }} />
                                <p className="text-slate-500 text-sm">Nenhum conteúdo no storage</p>
                                <p className="text-slate-400 text-xs mt-1">Upload na aba "Conteúdo" → pasta <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{previewSlug}/</code></p>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Upsell section */}
                      {models.filter(m => m.slug !== previewSlug).length > 0 && (
                        <div className="px-4 pb-6">
                          <div className="border-t border-slate-200 pt-5">
                            <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                              <Zap className="h-4 w-4" style={{ color: `hsl(${pt.accentColor})` }} />
                              Você também vai amar 🔥
                            </h2>
                            <div className="space-y-3">
                              {models.filter(m => m.slug !== previewSlug).map((m) => {
                                const mGrad = `linear-gradient(135deg, hsl(${m.theme.accentColor}) 0%, hsl(${m.theme.accentColorEnd}) 100%)`;
                                return (
                                  <div key={m.slug} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="h-20 relative overflow-hidden">
                                      <img src={m.banner} alt="" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                      <div className="absolute bottom-2 left-3 flex items-center gap-2">
                                        <div className="h-10 w-10 rounded-full p-[2px]" style={{ background: mGrad }}>
                                          <img src={m.avatar} alt={m.name} className="h-full w-full rounded-full object-cover border border-white" />
                                        </div>
                                        <div>
                                          <p className="text-white text-sm font-bold flex items-center gap-1">
                                            {m.name}
                                            {m.verified && <CheckCircle className="h-3 w-3 text-white" />}
                                          </p>
                                          <p className="text-white/70 text-[10px]">{m.username}</p>
                                        </div>
                                      </div>
                                      <span className="absolute top-2 right-2 text-[9px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: mGrad }}>
                                        {m.theme.badge}
                                      </span>
                                    </div>
                                    <div className="flex gap-1 px-3 pt-3">
                                      {(m.previews || []).slice(0, 3).map((src, i) => (
                                        <div key={i} className="flex-1 aspect-square rounded-lg overflow-hidden relative">
                                          <img src={src} alt="" className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center">
                                            <Lock className="h-3.5 w-3.5 text-white" />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="p-3 flex items-center justify-between">
                                      <div>
                                        <p className="text-xs text-slate-500">{m.stats.photos} fotos · {m.stats.videos} vídeos</p>
                                        <p className="text-sm font-bold text-slate-900">A partir de R$ {m.promos[0]?.price || m.mainPlan.price}</p>
                                      </div>
                                      <span className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: mGrad }}>
                                        {m.theme.promoText}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// KPI Card component
const KpiCard = ({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub: string; color: string }) => (
  <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
    <CardContent className="p-4 relative">
      <div className={`absolute -top-4 -right-4 h-20 w-20 rounded-full bg-gradient-to-br ${color} opacity-10 blur-xl`} />
      <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-3 shadow-lg`}>{icon}</div>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </CardContent>
  </Card>
);

// Reusable data table
const DataTable = ({ title, count, loading, onRefresh, headers, rows, emptyMsg }: {
  title: string; count: number; loading: boolean; onRefresh: () => void;
  headers: string[]; rows: React.ReactNode[][]; emptyMsg: string;
}) => (
  <Card className="bg-slate-800/50 border-slate-700/50">
    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700/50">
      <CardTitle className="text-white text-base">{title} ({count})</CardTitle>
      <Button variant="ghost" size="icon" onClick={onRefresh} className="text-slate-400 hover:text-white">
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      </Button>
    </CardHeader>
    <CardContent className="p-0">
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700/50 hover:bg-transparent">
                {headers.map((h, i) => <TableHead key={i} className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i} className="border-slate-700/30 hover:bg-slate-700/20">
                  {row.map((cell, j) => <TableCell key={j} className="text-slate-300 text-sm">{cell}</TableCell>)}
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={headers.length} className="text-center text-slate-500 py-12">{emptyMsg}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent>
  </Card>
);

export default Admin;
