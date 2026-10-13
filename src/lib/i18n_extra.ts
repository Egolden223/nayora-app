/** Clés i18n additionnelles (médias chat, appels) — fusionnées dans useLang. */
import type { Lang } from "@/lib/i18n";

const EXTRA: Record<Lang, Record<string, string>> = {
  fr: {
    sendPhoto: "Envoyer une photo",
    requestCallAudio: "Appel audio",
    requestCallVideo: "Appel vidéo",
    callAudioTitle: "Appel audio",
    callVideoTitle: "Appel vidéo",
    callIncomingAudio: "vous appelle (audio)",
    callIncomingVideo: "vous appelle (vidéo)",
    cancel: "Annuler",
    mmTitle: "Accompagnement personnalisé",
    mmLead: "Un accompagnement adapté à ton profil et à tes univers.",
  },
  en: {
    sendPhoto: "Send a photo",
    requestCallAudio: "Audio call",
    requestCallVideo: "Video call",
    callAudioTitle: "Audio call",
    callVideoTitle: "Video call",
    callIncomingAudio: "is calling you (audio)",
    callIncomingVideo: "is calling you (video)",
    cancel: "Cancel",
    mmTitle: "Personalized support",
    mmLead: "Support tailored to your profile and universes.",
  },
  ar: {
    sendPhoto: "إرسال صورة",
    requestCallAudio: "مكالمة صوتية",
    requestCallVideo: "مكالمة فيديو",
    callAudioTitle: "مكالمة صوتية",
    callVideoTitle: "مكالمة فيديو",
    callIncomingAudio: "يتصل بك (صوت)",
    callIncomingVideo: "يتصل بك (فيديو)",
    cancel: "إلغاء",
    mmTitle: "مرافقة مخصصة",
    mmLead: "مرافقة مكيّفة مع ملفك وعوالمك.",
  },
  es: {
    sendPhoto: "Enviar una foto",
    requestCallAudio: "Llamada de audio",
    requestCallVideo: "Videollamada",
    callAudioTitle: "Llamada de audio",
    callVideoTitle: "Videollamada",
    callIncomingAudio: "te llama (audio)",
    callIncomingVideo: "te llama (vídeo)",
    cancel: "Cancelar",
    mmTitle: "Acompañamiento personalizado",
    mmLead: "Un acompañamiento adaptado a tu perfil y universos.",
  },
  pt: {
    sendPhoto: "Enviar uma foto",
    requestCallAudio: "Chamada de áudio",
    requestCallVideo: "Videochamada",
    callAudioTitle: "Chamada de áudio",
    callVideoTitle: "Videochamada",
    callIncomingAudio: "está a ligar (áudio)",
    callIncomingVideo: "está a ligar (vídeo)",
    cancel: "Cancelar",
    mmTitle: "Acompanhamento personalizado",
    mmLead: "Acompanhamento adaptado ao teu perfil e universos.",
  },
};

export function tExtra(lang: Lang, key: string): string | null {
  return EXTRA[lang]?.[key] ?? EXTRA.fr[key] ?? null;
}
