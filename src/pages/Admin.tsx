import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lock, Users, MessageSquare, CreditCard, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data`;

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  created_at: string;
}

interface Conversation {
  id: string;
  user_id: string;
  model_slug: string;
  created_at: string;
}

interface CheckoutAttempt {
  id: string;
  customer_name: string;
  customer_email: string;
  model_name: string;
  plan_name: string;
  plan_price: number;
  payment_status: string;
  payment_id: string;
  created_at: string;
}

const Admin = () => {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const data = await fetchData("profiles");
    if (!error) {
      setAuthenticated(true);
      setProfiles(data);
    }
  };

  const loadTab = async (tab: string) => {
    if (tab === "cadastros") {
      setProfiles(await fetchData("profiles"));
    } else if (tab === "conversas") {
      setConversations(await fetchData("conversations"));
    } else if (tab === "checkouts") {
      setCheckouts(await fetchData("checkouts"));
    }
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "text-green-600 bg-green-50";
    if (s === "rejected") return "text-red-600 bg-red-50";
    return "text-yellow-600 bg-yellow-50";
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <CardTitle>Painel Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Senha de administrador"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleLogin} className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Painel Admin</h1>

        <Tabs defaultValue="cadastros" onValueChange={loadTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="cadastros" className="gap-2">
              <Users className="h-4 w-4" /> Cadastros
            </TabsTrigger>
            <TabsTrigger value="conversas" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Conversas
            </TabsTrigger>
            <TabsTrigger value="checkouts" className="gap-2">
              <CreditCard className="h-4 w-4" /> Checkouts
            </TabsTrigger>
          </TabsList>

          {/* Cadastros */}
          <TabsContent value="cadastros">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Usuários cadastrados ({profiles.length})</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => loadTab("cadastros")}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profiles.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.display_name || "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">{p.user_id.slice(0, 8)}...</TableCell>
                            <TableCell>{formatDate(p.created_at)}</TableCell>
                          </TableRow>
                        ))}
                        {profiles.length === 0 && (
                          <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum cadastro encontrado</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversas */}
          <TabsContent value="conversas">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Conversas ({conversations.length})</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => loadTab("conversas")}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Modelo</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conversations.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.model_slug}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">{c.user_id.slice(0, 8)}...</TableCell>
                            <TableCell>{formatDate(c.created_at)}</TableCell>
                          </TableRow>
                        ))}
                        {conversations.length === 0 && (
                          <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhuma conversa encontrada</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checkouts */}
          <TabsContent value="checkouts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Tentativas de checkout ({checkouts.length})</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => loadTab("checkouts")}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Modelo</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {checkouts.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.customer_name}</TableCell>
                            <TableCell className="text-sm">{c.customer_email}</TableCell>
                            <TableCell>{c.model_name}</TableCell>
                            <TableCell>{c.plan_name}</TableCell>
                            <TableCell>R$ {Number(c.plan_price).toFixed(2).replace(".", ",")}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(c.payment_status)}`}>
                                {c.payment_status}
                              </span>
                            </TableCell>
                            <TableCell>{formatDate(c.created_at)}</TableCell>
                          </TableRow>
                        ))}
                        {checkouts.length === 0 && (
                          <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum checkout encontrado</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
