import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lock, Users, MessageSquare, CreditCard, Loader2, RefreshCw, BarChart3, Eye, TrendingUp, DollarSign, Activity, ArrowUpRight, Zap, Globe, Link2, Megaphone, MousePointerClick, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area } from "recharts";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data`;

interface Profile { id: string; user_id: string; display_name: string; created_at: string; }
interface Conversation { id: string; user_id: string; model_slug: string; created_at: string; }
interface CheckoutAttempt { id: string; customer_name: string; customer_email: string; model_name: string; plan_name: string; plan_price: number; payment_status: string; payment_id: string; created_at: string; }
interface DashboardData {
  totalUsers: number; totalConversations: number; totalCheckouts: number;
  approvedCheckouts: number; totalRevenue: number; totalPageViews: number;
  recentViews24h: number; recentCheckouts24h: number;
  modelViews: Record<string, number>; modelCheckouts: Record<string, number>;
  pageTypeBreakdown: Record<string, number>; conversionRate: string;
}
interface TrackingData {
  totalClicks: number; totalCheckouts: number; totalApproved: number;
  totalRevenue: number; conversionRate: string;
  bySource: { name: string; clicks: number; checkouts: number; approved: number; revenue: number }[];
  byMedium: { name: string; clicks: number; checkouts: number; approved: number; revenue: number }[];
  byCampaign: { name: string; clicks: number; checkouts: number; approved: number; revenue: number }[];
  dailyTrend: { date: string; views: number; checkouts: number; revenue: number }[];
  utmCombos: { name: string; clicks: number }[];
  referrers: { name: string; clicks: number }[];
}

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

  const fetchData = async (table: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, table }),
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
            <CardTitle className="text-white text-xl">Painel de Rastreamento</CardTitle>
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

  // Model views chart data
  const modelViewsChart = dashboard
    ? Object.entries(dashboard.modelViews)
        .sort(([, a], [, b]) => b - a)
        .map(([name, views], i) => ({ name, views, fill: CHART_COLORS[i % CHART_COLORS.length] }))
    : [];

  const pageTypePie = dashboard
    ? Object.entries(dashboard.pageTypeBreakdown).map(([name, value], i) => ({
        name: name === "home" ? "Home" : name === "modelo" ? "Perfil Modelo" : name === "checkout" ? "Checkout" : name,
        value,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Painel de Rastreamento</h1>
              <p className="text-xs text-slate-400">UTM Tracking & Analytics</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadTab(activeTab)}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <Tabs value={activeTab} onValueChange={loadTab}>
          <TabsList className="bg-slate-800/50 border border-slate-700/50 mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="tracking" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-2">
              <Target className="h-4 w-4" /> Rastreamento
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-2">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="cadastros" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-2">
              <Users className="h-4 w-4" /> Cadastros
            </TabsTrigger>
            <TabsTrigger value="conversas" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-2">
              <MessageSquare className="h-4 w-4" /> Conversas
            </TabsTrigger>
            <TabsTrigger value="checkouts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-2">
              <CreditCard className="h-4 w-4" /> Checkouts
            </TabsTrigger>
          </TabsList>

          {/* =================== TRACKING TAB =================== */}
          <TabsContent value="tracking">
            {loading && !tracking ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
            ) : tracking ? (
              <div className="space-y-6">
                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <KpiCard icon={<MousePointerClick className="h-5 w-5" />} label="Cliques" value={tracking.totalClicks} sub="Total de visitas" color="from-blue-500 to-cyan-500" />
                  <KpiCard icon={<CreditCard className="h-5 w-5" />} label="Checkouts" value={tracking.totalCheckouts} sub={`${tracking.totalApproved} aprovados`} color="from-orange-500 to-pink-500" />
                  <KpiCard icon={<DollarSign className="h-5 w-5" />} label="Receita" value={`R$ ${tracking.totalRevenue.toFixed(2).replace(".", ",")}`} sub="Total faturado" color="from-emerald-500 to-green-500" />
                  <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="Conversão" value={`${tracking.conversionRate}%`} sub="Cliques → Checkout" color="from-violet-500 to-purple-500" />
                  <KpiCard icon={<Zap className="h-5 w-5" />} label="Ticket Médio" value={`R$ ${tracking.totalApproved > 0 ? (tracking.totalRevenue / tracking.totalApproved).toFixed(2).replace(".", ",") : "0,00"}`} sub="Por aprovado" color="from-amber-500 to-orange-500" />
                </div>

                {/* Daily Trend Chart */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-400" />
                      Tendência Diária (30 dias)
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
                            <linearGradient id="checkoutsGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false}
                            tickFormatter={(v) => { const [,m,d] = v.split("-"); return `${d}/${m}`; }} />
                          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }}
                            labelFormatter={(v) => { const [y,m,d] = v.split("-"); return `${d}/${m}/${y}`; }}
                          />
                          <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                          <Area type="monotone" dataKey="views" name="Visitas" stroke="hsl(200, 80%, 50%)" fill="url(#viewsGrad)" strokeWidth={2} />
                          <Area type="monotone" dataKey="checkouts" name="Checkouts" stroke="hsl(24, 95%, 53%)" fill="url(#checkoutsGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-slate-500 py-12">Sem dados ainda</p>
                    )}
                  </CardContent>
                </Card>

                {/* UTM Source & Medium side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* By Source */}
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white text-base flex items-center gap-2">
                        <Globe className="h-4 w-4 text-cyan-400" />
                        Por Fonte (utm_source)
                      </CardTitle>
                    </CardHeader>
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
                      ) : (
                        <p className="text-center text-slate-500 py-8">Sem dados UTM ainda</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* By Medium */}
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white text-base flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-violet-400" />
                        Por Mídia (utm_medium)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tracking.byMedium.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={tracking.byMedium.slice(0, 7).map((m, i) => ({ ...m, fill: CHART_COLORS[i % CHART_COLORS.length] }))}
                              dataKey="clicks"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              innerRadius={45}
                              strokeWidth={2}
                              stroke="#1e293b"
                            >
                              {tracking.byMedium.slice(0, 7).map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }} />
                            <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 11 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-slate-500 py-8">Sem dados UTM ainda</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Campaign Breakdown */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-pink-400" />
                      Por Campanha (utm_campaign)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tracking.byCampaign.length > 0 ? (
                      <ResponsiveContainer width="100%" height={Math.max(200, tracking.byCampaign.slice(0, 10).length * 40)}>
                        <BarChart data={tracking.byCampaign.slice(0, 10)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                          <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={150} />
                          <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }} />
                          <Bar dataKey="clicks" name="Cliques" radius={[0, 6, 6, 0]}>
                            {tracking.byCampaign.slice(0, 10).map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-slate-500 py-8">Sem campanhas rastreadas</p>
                    )}
                  </CardContent>
                </Card>

                {/* UTM Combos & Referrers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* UTM Combinations Table */}
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white text-base flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4 text-orange-400" />
                        Combinações UTM (Source / Medium / Campaign)
                      </CardTitle>
                    </CardHeader>
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
                              <TableRow>
                                <TableCell colSpan={2} className="text-center text-slate-500 py-8">Nenhum UTM rastreado</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Referrers */}
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white text-base flex items-center gap-2">
                        <Globe className="h-4 w-4 text-emerald-400" />
                        Referrers (Origem do Tráfego)
                      </CardTitle>
                    </CardHeader>
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
                      ) : (
                        <p className="text-center text-slate-500 py-8">Sem referrers registrados</p>
                      )}
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
                    <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-orange-400" />Interesse por Modelo (Views)</CardTitle></CardHeader>
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

          {/* Cadastros */}
          <TabsContent value="cadastros">
            <DataTable title="Usuários cadastrados" count={profiles.length} loading={loading} onRefresh={() => loadTab("cadastros")} headers={["Nome", "User ID", "Data"]}
              rows={profiles.map((p) => [p.display_name || "—", <span className="font-mono text-xs text-slate-400">{p.user_id.slice(0, 8)}...</span>, formatDate(p.created_at)])} emptyMsg="Nenhum cadastro encontrado" />
          </TabsContent>

          {/* Conversas */}
          <TabsContent value="conversas">
            <DataTable title="Conversas" count={conversations.length} loading={loading} onRefresh={() => loadTab("conversas")} headers={["Modelo", "User ID", "Data"]}
              rows={conversations.map((c) => [c.model_slug, <span className="font-mono text-xs text-slate-400">{c.user_id.slice(0, 8)}...</span>, formatDate(c.created_at)])} emptyMsg="Nenhuma conversa encontrada" />
          </TabsContent>

          {/* Checkouts */}
          <TabsContent value="checkouts">
            <DataTable title="Tentativas de checkout" count={checkouts.length} loading={loading} onRefresh={() => loadTab("checkouts")} headers={["Cliente", "Email", "Modelo", "Plano", "Preço", "Status", "Data"]}
              rows={checkouts.map((c) => [c.customer_name, c.customer_email, c.model_name, c.plan_name, `R$ ${Number(c.plan_price).toFixed(2).replace(".", ",")}`,
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor(c.payment_status)}`}>{statusLabel(c.payment_status)}</span>, formatDate(c.created_at)])} emptyMsg="Nenhum checkout encontrado" />
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
