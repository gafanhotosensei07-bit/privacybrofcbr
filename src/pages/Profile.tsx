import { useState, useRef } from "react";
import { Camera, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Profile = () => {
  const [banner, setBanner] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState("Seu Nome");
  const [bio, setBio] = useState("Escreva algo sobre você...");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editBio, setEditBio] = useState(bio);

  const bannerRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setter(url);
  };

  const saveEdit = () => {
    setName(editName);
    setBio(editBio);
    setEditing(false);
  };

  const openEdit = () => {
    setEditName(name);
    setEditBio(bio);
    setEditing(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl">
        {/* Banner */}
        <div
          className="relative h-48 sm:h-56 bg-muted cursor-pointer group rounded-b-2xl overflow-hidden"
          onClick={() => bannerRef.current?.click()}
        >
          {banner ? (
            <img src={banner} alt="Banner" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-muted-foreground">Clique para adicionar banner</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/10 transition-colors">
            <Camera className="h-6 w-6 text-background opacity-0 group-hover:opacity-80 transition-opacity" />
          </div>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, setBanner)} />
        </div>

        {/* Avatar */}
        <div className="relative mx-auto -mt-16 w-fit">
          <div
            className="h-32 w-32 rounded-full border-4 border-background bg-muted overflow-hidden cursor-pointer group"
            onClick={() => avatarRef.current?.click()}
          >
            {avatar ? (
              <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/10 transition-colors">
              <Camera className="h-5 w-5 text-background opacity-0 group-hover:opacity-80 transition-opacity" />
            </div>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, setAvatar)} />
        </div>

        {/* Info */}
        <div className="text-center mt-4 px-4">
          <h1 className="text-2xl font-bold text-foreground">{name}</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto whitespace-pre-line">{bio}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={openEdit}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar Perfil
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Nome</Label>
              <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editBio">Bio</Label>
              <textarea
                id="editBio"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <Button onClick={saveEdit} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
