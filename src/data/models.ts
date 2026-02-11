import andressaAvatar from "@/assets/andressa-urach-avatar.png";
import andressaBanner from "@/assets/andressa-urach-banner.png";
import andressaPreview1 from "@/assets/andressa-preview-1.jpeg";
import andressaPreview2 from "@/assets/andressa-preview-2.jpeg";
import andressaPreview3 from "@/assets/andressa-preview-3.png";
import andressaPreview4 from "@/assets/andressa-preview-4.png";
import andressaPreview5 from "@/assets/andressa-preview-5.png";
import camilaAvatar from "@/assets/camila-santos-avatar.png";
import camilaBanner from "@/assets/camila-santos-banner.jpeg";
import kamylinhaPreview1 from "@/assets/kamylinha-preview-1.png";
import kamylinhaPreview2 from "@/assets/kamylinha-preview-2.png";
import kamylinhaPreview3 from "@/assets/kamylinha-preview-3.png";
import kamylinhaPreview4 from "@/assets/kamylinha-preview-4.png";
import brunaPreview1 from "@/assets/bruna-preview-1.webp";
import melMaiaAvatar from "@/assets/mel-maia-avatar.avif";
import melMaiaPreview1 from "@/assets/mel-maia-preview-1.png";
import melMaiaPreview2 from "@/assets/mel-maia-preview-2.png";
import melMaiaPreview3 from "@/assets/mel-maia-preview-3.png";
import melMaiaPreview4 from "@/assets/mel-maia-preview-4.png";
import melMaiaBanner from "@/assets/mel-maia-banner.jpg";
import mcMelodyPreview1 from "@/assets/mc-melody-preview-1.jpeg";
import mcMelodyPreview2 from "@/assets/mc-melody-preview-2.jpeg";
import mcMelodyPreview3 from "@/assets/mc-melody-preview-3.jpeg";
import mcPipokinhaAvatar from "@/assets/mc-pipokinha-avatar.webp";
import mcPipokinhaPreview2 from "@/assets/mc-pipokinha-preview-2.png";
import mcPipokinhaPreview3 from "@/assets/mc-pipokinha-preview-3.png";
import mcPipokinhaPreview4 from "@/assets/mc-pipokinha-preview-4.png";
import mcPipokinhaPreview5 from "@/assets/mc-pipokinha-preview-5.png";
import mcPipokinhaBanner from "@/assets/mc-pipokinha-banner.png";

export interface ModelData {
  slug: string;
  name: string;
  username: string;
  avatar: string;
  banner: string;
  bio: string;
  verified: boolean;
  stats: {
    photos: number;
    videos: number;
    posts: number;
    likes: string;
  };
  mainPlan: {
    name: string;
    price: string;
  };
  promos: {
    name: string;
    discount: string;
    price: string;
  }[];
  postCount: number;
  mediaCount: number;
  previews?: string[];
}

export const models: ModelData[] = [
  {
    slug: "estermuniz",
    name: "Ester Muniz",
    username: "@estermuniz",
    avatar: "",
    banner: "",
    bio: "Sou muito safadinha e tenho 22 aninhos. PRINCESINHA +18 🥇 Sexo EXPLÍCITO 😈 Aqui você vai conhecer o meu jeito de menina e o meu lado safada. Aqui você encontrará vídeos de sexo, vídeos com amiguinhas, muito anal, vídeos solos e packs personalizados, totalmente sem CENSURA. Estou aqui para te fazer feliz todos os dias 🔥 Respondo rapidamente no Chat 💋",
    verified: true,
    stats: { photos: 711, videos: 619, posts: 54, likes: "254.6K" },
    mainPlan: { name: "1 mês", price: "12,90" },
    promos: [
      { name: "Semanal", discount: "", price: "9,90" },
      { name: "3 meses", discount: "10% off", price: "28,90" },
      { name: "1 Ano", discount: "25% off", price: "38,90" },
    ],
    postCount: 502,
    mediaCount: 354,
  },
  {
    slug: "andressaurach",
    name: "Andressa Urach",
    username: "@andressaurach",
    avatar: andressaAvatar,
    banner: andressaBanner,
    bio: "Olá meus amores 💕 Tenho 21 anos e sou apaixonada por criar conteúdo exclusivo pra vocês! Aqui você vai encontrar muito conteúdo +18, fotos sensuais e vídeos que vão te deixar louco 🔥 Venha se divertir comigo! Respondo todas as mensagens 💋",
    verified: true,
    stats: { photos: 423, videos: 312, posts: 38, likes: "189.2K" },
    mainPlan: { name: "1 mês", price: "12,90" },
    promos: [
      { name: "Semanal", discount: "", price: "9,90" },
      { name: "3 meses", discount: "10% off", price: "28,90" },
      { name: "1 Ano", discount: "25% off", price: "38,90" },
    ],
    postCount: 380,
    mediaCount: 290,
    previews: [andressaPreview1, andressaPreview2, andressaPreview3, andressaPreview4, andressaPreview5],
  },
  {
    slug: "camilasantos",
    name: "Kamylinha Santos",
    username: "@kamylinhasantos",
    avatar: camilaAvatar,
    banner: camilaBanner,
    bio: "Oi gatinhos! 😘 Sou a Kamylinha, tenho 18 anos e adoro provocar! Conteúdo exclusivo todos os dias, vídeos explícitos e muita interação no chat. Vem conhecer meu lado mais ousado 🔥💦 Não vai se arrepender!",
    verified: true,
    stats: { photos: 567, videos: 445, posts: 62, likes: "321.5K" },
    mainPlan: { name: "1 mês", price: "12,90" },
    promos: [
      { name: "Semanal", discount: "", price: "9,90" },
      { name: "3 meses", discount: "10% off", price: "28,90" },
      { name: "1 Ano", discount: "25% off", price: "38,90" },
    ],
    postCount: 445,
    mediaCount: 380,
    previews: [kamylinhaPreview1, kamylinhaPreview2, kamylinhaPreview3, kamylinhaPreview4],
  },
  {
    slug: "mcpipokinha",
    name: "MC Pipokinha",
    username: "@mcpipokinha",
    avatar: mcPipokinhaAvatar,
    banner: mcPipokinhaBanner,
    bio: "Hey baby! 💋 Tenho 20 aninhos e sou uma mistura de doce com picante 🌶️ Conteúdo +18 todos os dias! Fotos, vídeos solo e muito mais esperando por você. Vem se inscrever e aproveitar! 🔥",
    verified: false,
    stats: { photos: 289, videos: 198, posts: 25, likes: "98.7K" },
    mainPlan: { name: "1 mês", price: "12,90" },
    promos: [
      { name: "Semanal", discount: "", price: "9,90" },
      { name: "3 meses", discount: "10% off", price: "28,90" },
      { name: "1 Ano", discount: "25% off", price: "38,90" },
    ],
    postCount: 210,
    mediaCount: 180,
    previews: [mcPipokinhaPreview2, mcPipokinhaPreview3, mcPipokinhaPreview4, mcPipokinhaPreview5],
  },
  {
    slug: "melmaia",
    name: "Mel Maia",
    username: "@melmaia",
    avatar: melMaiaAvatar,
    banner: melMaiaBanner,
    bio: "Oii amores! 🥰 Sou a Mel Maia, 21 anos, fitness e muito safada! Aqui tem conteúdo exclusivo, vídeos de treino sensual, ensaios e muito +18 🔥 Adoro conversar no chat e fazer conteúdo personalizado pra vocês 💕",
    verified: true,
    stats: { photos: 634, videos: 521, posts: 48, likes: "276.3K" },
    mainPlan: { name: "1 mês", price: "12,90" },
    promos: [
      { name: "Semanal", discount: "", price: "9,90" },
      { name: "3 meses", discount: "10% off", price: "28,90" },
      { name: "1 Ano", discount: "25% off", price: "38,90" },
    ],
    postCount: 520,
    mediaCount: 410,
    previews: [melMaiaPreview1, melMaiaPreview2, melMaiaPreview3, melMaiaPreview4],
  },
  {
    slug: "mcmelody",
    name: "Mc Melody",
    username: "@mcmelody",
    avatar: "https://i.pravatar.cc/200?img=20",
    banner: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
    bio: "Oi meu bem! 💜 Amanda aqui, 22 anos. Morena, gostosa e muito atrevida 😈 Conteúdo novo todo dia! Vídeos solo, com amigas, ensaios sensuais e packs personalizados. Venha fazer parte da minha turma VIP 🔥",
    verified: true,
    stats: { photos: 512, videos: 387, posts: 41, likes: "203.8K" },
    mainPlan: { name: "1 mês", price: "12,90" },
    promos: [
      { name: "Semanal", discount: "", price: "9,90" },
      { name: "3 meses", discount: "10% off", price: "28,90" },
      { name: "1 Ano", discount: "25% off", price: "38,90" },
    ],
    postCount: 390,
    mediaCount: 310,
    previews: [mcMelodyPreview1, mcMelodyPreview2, mcMelodyPreview3],
  },
  {
    slug: "fernandaalves",
    name: "Fernanda Alves",
    username: "@fernandaalves",
    avatar: "https://i.pravatar.cc/200?img=23",
    banner: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&q=80",
    bio: "Eai gatinhos! 😻 Sou a Fer, 25 anos e cheia de conteúdo quente pra vocês! Ensaios profissionais, vídeos explícitos e muito conteúdo exclusivo que você não encontra em nenhum outro lugar 🔥 Me chama no chat! 💋",
    verified: true,
    stats: { photos: 478, videos: 356, posts: 35, likes: "167.4K" },
    mainPlan: { name: "1 mês", price: "12,90" },
    promos: [
      { name: "Semanal", discount: "", price: "9,90" },
      { name: "3 meses", discount: "10% off", price: "28,90" },
      { name: "1 Ano", discount: "25% off", price: "38,90" },
    ],
    postCount: 410,
    mediaCount: 330,
  },
];
