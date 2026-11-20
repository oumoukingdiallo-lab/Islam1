// Kbizá AI Generation Edge Function
// Generates product descriptions, ad copy, store content, and marketing texts
// Uses OPENAI_API_KEY if configured, otherwise falls back to high-quality local generation

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateRequest {
  type: "product_landing" | "marketing_copy" | "store_builder" | "ad_script";
  productName?: string;
  productType?: "physical" | "digital";
  digitalType?: string;
  price?: number;
  category?: string;
  niche?: string;
  platform?: "whatsapp" | "facebook" | "tiktok";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json() as GenerateRequest;
    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (apiKey) {
      const result = await callOpenAI(apiKey, body);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: high-quality local generation
    const result = generateLocally(body);
    return new Response(JSON.stringify({ ...result, _source: "fallback" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function callOpenAI(apiKey: string, body: GenerateRequest) {
  const prompts = buildPrompt(body);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Tu es un expert en marketing e-commerce spécialisé pour le marché angolais. Tu réponds toujours en français. Tu génères du contenu persuasif, professionnel et adapté au contexte local (Angola, Kwanza, provinces, villes, paiement à la livraison)." },
        { role: "user", content: prompts.user },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error: ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content from AI");
  return JSON.parse(content);
}

function buildPrompt(body: GenerateRequest): { user: string } {
  const name = body.productName ?? "produit";
  const price = body.price ? `${body.price} Kz` : "prix à définir";

  if (body.type === "product_landing" && body.productType === "physical") {
    return {
      user: `Génère une page de vente complète pour un produit physique e-commerce en Angola. Produit: "${name}", prix: ${price}, catégorie: ${body.category ?? "général"}.
Réponds en JSON avec cette structure exacte:
{
  "hero_subtitle": "sous-titre marketing percutant",
  "description": "description persuasive de 2-3 paragraphes",
  "benefits": [{"icon":"check","title":"titre du bénéfice","text":"description courte"}],
  "specs": [{"key":"caractéristique","value":"valeur"}],
  "packs": [{"qty":1,"label":"1 Unité","price":${body.price ?? 0},"discount":0},{"qty":2,"label":"2 Unités (-15%)","price":${Math.round((body.price ?? 0) * 2 * 0.85)},"discount":15,"badge":"Le plus populaire"},{"qty":3,"label":"3 Unités (-25%)","price":${Math.round((body.price ?? 0) * 3 * 0.75)},"discount":25,"badge":"Meilleure offre"}],
  "reviews": [{"name":"nom angolais","city":"ville angolaise","rating":5,"text":"témoignage"}],
  "guarantee": "texte de garantie",
  "faq": [{"q":"question","a":"réponse"}]
}
Génère 4 bénéfices, 4 caractéristiques, 3 avis (noms angolais: João, Helena, Paulo, Maria, Carlos...) avec villes (Luanda, Benguela, Huambo, Lubango...), et 3 questions FAQ.`,
    };
  }

  if (body.type === "product_landing" && body.productType === "digital") {
    return {
      user: `Génère une description vendeuse pour un produit digital: "${name}" (type: ${body.digitalType ?? "fichier"}), prix: ${price}.
Réponds en JSON: {"description": "description de 2-3 paragraphes, persuasive, qui met en valeur les bénéfices et l'accès immédiat", "faq": [{"q":"question fréquente","a":"réponse"}]}.
Génère 3 questions FAQ pertinentes.`,
    };
  }

  if (body.type === "marketing_copy") {
    const platform = body.platform ?? "whatsapp";
    return {
      user: `Génère 3 variantes de texte publicitaire pour "${name}" à ${price}, plateforme: ${platform}. Marché: Angola.
Réponds en JSON: {"variants": ["texte 1", "texte 2", "texte 3"]}.
Chaque variante doit inclure le nom du produit, le prix en Kz, un argument de vente, une mention de livraison en Angola, et un appel à l'action. Adapte le style à ${platform} (emojis pour WhatsApp, accroche visuelle pour TikTok, etc).`,
    };
  }

  if (body.type === "store_builder") {
    return {
      user: `Génère le contenu d'une boutique e-commerce pour la niche: "${body.niche ?? "général"}". Marché: Angola.
Réponds en JSON: {"store_name": "nom de boutique", "tagline": "slogan court", "hero_title": "titre principal", "hero_subtitle": "sous-titre", "description": "description boutique", "faq": [{"q":"question","a":"réponse"}]}.
Génère 3 questions FAQ sur la livraison, le paiement et les garanties en Angola.`,
    };
  }

  if (body.type === "ad_script") {
    return {
      user: `Génère un script vidéo TikTok/Reels de 30-45 secondes pour présenter "${name}" à ${price}. Marché: Angola.
Réponds en JSON: {"script": "script détaillé avec indications de plan, voix off, et texte à l'écran", "caption": "légende pour la publication", "hashtags": "#hashtag1 #hashtag2 ..."}.
Le script doit être dynamique, accrocheur, et adapté au marché angolais.`,
    };
  }

  return { user: "Génère du contenu marketing en français pour l'Angola." };
}

function generateLocally(body: GenerateRequest) {
  const name = body.productName ?? "votre produit";
  const price = body.price ?? 0;
  const fmtPrice = `${price.toLocaleString("fr-FR")} Kz`;

  if (body.type === "product_landing" && body.productType === "physical") {
    return {
      hero_subtitle: `La solution que tout le Angola attend — disponible maintenant à ${fmtPrice}`,
      description: `Le ${name} est le produit tendance plébiscité par les acheteurs angolais. Conçu avec des matériaux premium, il combine élégance, durabilité et performance. Que vous soyez à Luanda, Benguela ou Huambo, profitez d'une livraison rapide et d'un paiement à la livraison.\n\nNe laissez pas cette opportunité passer — stock limité !`,
      benefits: [
        { icon: "check", title: "Qualité supérieure", text: "Matériaux premium garantis pour une longue durée de vie" },
        { icon: "truck", title: "Livraison rapide Angola", text: "Livraison à Luanda en 24-48h et dans toutes les provinces en 3-5 jours" },
        { icon: "shield", title: "Garantie 30 jours", text: "Satisfait ou remboursé — votre achat est protégé" },
        { icon: "wallet", title: "Paiement à la livraison", text: "Payez en espèces à la réception — aucun risque pour vous" },
      ],
      specs: [
        { key: "Matériau", value: "Premium" },
        { key: "Garantie", value: "30 jours" },
        { key: "Livraison", value: "3-5 jours Angola" },
        { key: "Paiement", value: "COD ou transfert" },
      ],
      packs: [
        { qty: 1, label: "1 Unité", price, discount: 0 },
        { qty: 2, label: "2 Unités (-15%)", price: Math.round(price * 2 * 0.85), discount: 15, badge: "Le plus populaire" },
        { qty: 3, label: "3 Unités (-25%)", price: Math.round(price * 3 * 0.75), discount: 25, badge: "Meilleure offre" },
      ],
      reviews: [
        { name: "João Manuel", city: "Luanda", rating: 5, text: `Produit excellent, livraison très rapide. Je recommande à 100% !` },
        { name: "Helena da Silva", city: "Benguela", rating: 5, text: `Qualité au top, exactement comme sur la photo. Merci Kbizá !` },
        { name: "Paulo Mendes", city: "Huambo", rating: 5, text: `Très bon rapport qualité-prix. Paiement à la livraison très pratique.` },
      ],
      guarantee: "Satisfait ou remboursé sous 30 jours. Votre achat est 100% protégé.",
      faq: [
        { q: "Quels sont les délais de livraison ?", a: "La livraison à Luanda prend 24-48h. Pour les autres provinces (Benguela, Huambo, Lubango...), comptez 3 à 5 jours ouvrables." },
        { q: "Comment se passe le paiement ?", a: "Vous pouvez payer à la livraison (en espèces, en Kwanza) ou par transfert local. Le paiement en ligne (Multicaixa) est également disponible en mode simulation." },
        { q: "Le produit est-il garanti ?", a: "Oui, tous nos produits sont garantis 30 jours. Si vous n'êtes pas satisfait, nous vous remboursons intégralement." },
      ],
    };
  }

  if (body.type === "product_landing" && body.productType === "digital") {
    return {
      description: `Découvrez **${name}** — la solution complète conçue pour vous accompagner pas à pas.\n\nCe produit digital premium vous offre un contenu structuré, facile à suivre et immédiatement applicable. Que vous soyez débutant ou déjà avancé, vous y trouverez des stratégies concrètes, des exemples pratiques et des exercices pour progresser rapidement.\n\n**Ce que vous obtenez :**\n• Un accès immédiat après paiement\n• Un format optimisé pour mobile et ordinateur\n• Des mises à jour gratuites à vie\n• Un support disponible par WhatsApp`,
      faq: [
        { q: "Comment reçois-je mon produit ?", a: "L'accès est immédiat après confirmation du paiement. Vous recevez un lien de téléchargement par e-mail et sur la page de confirmation." },
        { q: "Le produit est-il compatible mobile ?", a: "Oui, tous nos produits digitaux sont optimisés pour mobile, tablette et ordinateur." },
        { q: "Puis-je obtenir un remboursement ?", a: "Oui, vous disposez de 7 jours pour demander un remboursement si le produit ne correspond pas à vos attentes." },
      ],
    };
  }

  if (body.type === "marketing_copy") {
    const link = "{link}";
    return {
      variants: [
        `🔥 OFFRE SPÉCIALE ! ${name} — maintenant à ${fmtPrice} seulement ! Livraison rapide partout en Angola 🇦🇴. Commandez via WhatsApp 👉 ${link}`,
        `✨ ${name} à ${fmtPrice}. Qualité garantie, paiement à la livraison à Luanda et provinces. Réservez votre exemplaire aujourd'hui ! ${link}`,
        `🎁 Pourquoi payer plus ? ${name} à prix imbattable : ${fmtPrice}. Stock limité ! Écrivez-nous en privé pour commander. 📍 Livraison Angola. ${link}`,
      ],
    };
  }

  if (body.type === "store_builder") {
    const niche = body.niche ?? "e-commerce";
    return {
      store_name: `Boutique ${niche.charAt(0).toUpperCase() + niche.slice(1)} Angola`,
      tagline: "La qualité au meilleur prix, livrée partout en Angola",
      hero_title: "Bienvenue dans votre nouvelle boutique",
      hero_subtitle: "Des produits sélectionnés avec soin pour les Angolais. Livraison rapide, paiement à la livraison.",
      description: "Nous proposons les meilleurs produits pour le marché angolais, avec une livraison rapide dans toutes les provinces et un paiement à la livraison en Kwanza.",
      faq: [
        { q: "Livrez-vous dans toute l'Angola ?", a: "Oui, nous livrons à Luanda, Benguela, Huambo, Lubango, Cabinda et dans toutes les provinces." },
        { q: "Comment puis-je payer ?", a: "Vous pouvez payer à la livraison en espèces (Kwanza), par Multicaixa Express (simulation) ou par carte bancaire (simulation)." },
        { q: "Quels sont les délais de livraison ?", a: "Luanda : 24-48h. Autres provinces : 3 à 5 jours ouvrables." },
      ],
    };
  }

  if (body.type === "ad_script") {
    return {
      script: `[Plan 1 - 0-3s] Accroche : "Stop ! Tu dois voir ça 👀" — gros plan sur le produit\n[Plan 2 - 3-10s] Démonstration du produit en action avec texte à l'écran: "${name} — ${fmtPrice}"\n[Plan 3 - 10-20s] Témoignage client: "J'ai commandé à Luanda, reçu en 2 jours !" \n[Plan 4 - 20-30s] Offre: "Paiement à la livraison partout en Angola 🇦🇴" — bouton "Commander maintenant"\n[Plan 5 - 30-35s] CTA: "Cliquez sur le lien pour commander ! Stock limité 🔥"`,
      caption: `${name} — ${fmtPrice} 🔥 Livraison rapide en Angola ! Paiement à la livraison ✅ Cliquez pour commander 👆`,
      hashtags: "#angola #luanda #shopping #dropshipping #kbiza #livraison #paiementalivraison #benguela #huambo",
    };
  }

  return { error: "Type de génération non reconnu" };
}
