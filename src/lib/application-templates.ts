import type { FormTemplateType, QuestionType, QuestionSection } from "@prisma/client";

type QuestionDef = {
  key: string;
  type: QuestionType;
  section: QuestionSection;
  labelTr: string;
  labelEn: string;
  helperTr?: string;
  helperEn?: string;
  placeholderTr?: string;
  placeholderEn?: string;
  required: boolean;
  position: number;
  options?: { key: string; labelTr: string; labelEn: string; position: number }[];
};

type TemplateDef = {
  key: string;
  type: FormTemplateType;
  nameTr: string;
  nameEn: string;
  questions: QuestionDef[];
};

export const DEFAULT_TEMPLATES: TemplateDef[] = [
  {
    key: "mentorship",
    type: "MENTORSHIP",
    nameTr: "Mentörlük Başvurusu",
    nameEn: "Mentorship Application",
    questions: [
      { key: "phone", type: "PHONE", section: "BASIC_INFO", labelTr: "Telefon Numarası", labelEn: "Phone Number", placeholderTr: "+90 5XX XXX XX XX", placeholderEn: "+90 5XX XXX XX XX", required: false, position: 0 },
      {
        key: "current_experience", type: "SINGLE_SELECT", section: "CURRENT_SITUATION", labelTr: "Deneyim Seviyeniz", labelEn: "Experience Level", required: true, position: 1,
        options: [
          { key: "beginner", labelTr: "Yeni başlıyorum", labelEn: "Just starting out", position: 0 },
          { key: "intermediate", labelTr: "Biraz deneyimim var", labelEn: "Some experience", position: 1 },
          { key: "advanced", labelTr: "Deneyimliyim", labelEn: "Experienced", position: 2 },
        ],
      },
      { key: "current_situation", type: "LONG_TEXT", section: "CURRENT_SITUATION", labelTr: "Mevcut Durumunuz", labelEn: "Current Situation", helperTr: "İşiniz/projeniz hakkında kısa bilgi verin.", helperEn: "Brief info about your business/project.", required: true, position: 2 },
      { key: "main_goal", type: "LONG_TEXT", section: "GOALS", labelTr: "Ana Hedefiniz", labelEn: "Main Goal", helperTr: "Bu mentörlükten ne elde etmek istiyorsunuz?", helperEn: "What do you want to achieve?", required: true, position: 3 },
      { key: "main_challenge", type: "LONG_TEXT", section: "CHALLENGES", labelTr: "Mevcut Zorluğunuz", labelEn: "Current Challenge", required: false, position: 4 },
      { key: "why_interested", type: "LONG_TEXT", section: "PROGRAM_FIT", labelTr: "Neden Bu Mentörlük?", labelEn: "Why This Mentorship?", required: true, position: 5 },
      { key: "optional_note", type: "LONG_TEXT", section: "ADDITIONAL_INFO", labelTr: "Eklemek İstediğiniz", labelEn: "Anything Else", required: false, position: 6 },
    ],
  },
  {
    key: "live_training",
    type: "LIVE_TRAINING",
    nameTr: "Canlı Eğitim Başvurusu",
    nameEn: "Live Training Application",
    questions: [
      { key: "phone", type: "PHONE", section: "BASIC_INFO", labelTr: "Telefon Numarası", labelEn: "Phone Number", required: false, position: 0 },
      {
        key: "current_experience", type: "SINGLE_SELECT", section: "CURRENT_SITUATION", labelTr: "Deneyim Seviyeniz", labelEn: "Experience Level", required: true, position: 1,
        options: [
          { key: "beginner", labelTr: "Yeni başlıyorum", labelEn: "Beginner", position: 0 },
          { key: "intermediate", labelTr: "Orta seviye", labelEn: "Intermediate", position: 1 },
          { key: "advanced", labelTr: "İleri seviye", labelEn: "Advanced", position: 2 },
        ],
      },
      { key: "training_topic", type: "LONG_TEXT", section: "GOALS", labelTr: "Eğitim Almak İstediğiniz Konu", labelEn: "Training Topic", required: true, position: 2 },
      { key: "specific_questions", type: "LONG_TEXT", section: "GOALS", labelTr: "Özel Soru/Sorunlarınız", labelEn: "Specific Questions", required: false, position: 3 },
      {
        key: "preferred_format", type: "RADIO", section: "AVAILABILITY", labelTr: "Tercih Ettiğiniz Format", labelEn: "Preferred Format", required: true, position: 4,
        options: [
          { key: "one_on_one", labelTr: "1:1 Özel", labelEn: "1:1 Private", position: 0 },
          { key: "group", labelTr: "Grup", labelEn: "Group", position: 1 },
        ],
      },
      { key: "optional_note", type: "LONG_TEXT", section: "ADDITIONAL_INFO", labelTr: "Eklemek İstediğiniz", labelEn: "Additional Notes", required: false, position: 5 },
    ],
  },
  {
    key: "consultation",
    type: "CONSULTATION",
    nameTr: "Danışmanlık Başvurusu",
    nameEn: "Consultation Application",
    questions: [
      { key: "phone", type: "PHONE", section: "BASIC_INFO", labelTr: "Telefon Numarası", labelEn: "Phone Number", required: false, position: 0 },
      { key: "business_project", type: "SHORT_TEXT", section: "CURRENT_SITUATION", labelTr: "İşiniz / Projeniz", labelEn: "Your Business / Project", required: true, position: 1 },
      { key: "current_problem", type: "LONG_TEXT", section: "CHALLENGES", labelTr: "Mevcut Sorun", labelEn: "Current Problem", required: true, position: 2 },
      { key: "desired_help", type: "LONG_TEXT", section: "GOALS", labelTr: "Ne Tür Yardım İstiyorsunuz?", labelEn: "What Kind of Help Do You Need?", required: true, position: 3 },
      { key: "desired_outcome", type: "LONG_TEXT", section: "GOALS", labelTr: "Beklenen Çıktı", labelEn: "Desired Outcome", required: false, position: 4 },
      { key: "optional_note", type: "LONG_TEXT", section: "ADDITIONAL_INFO", labelTr: "Eklemek İstediğiniz", labelEn: "Additional Notes", required: false, position: 5 },
    ],
  },
  {
    key: "cohort_premium",
    type: "COHORT_PREMIUM_PROGRAM",
    nameTr: "Premium Program Başvurusu",
    nameEn: "Premium Program Application",
    questions: [
      { key: "phone", type: "PHONE", section: "BASIC_INFO", labelTr: "Telefon Numarası", labelEn: "Phone Number", required: false, position: 0 },
      {
        key: "current_level", type: "SINGLE_SELECT", section: "CURRENT_SITUATION", labelTr: "Mevcut Seviyeniz", labelEn: "Current Level", required: true, position: 1,
        options: [
          { key: "no_experience", labelTr: "Deneyimim yok", labelEn: "No experience", position: 0 },
          { key: "beginner", labelTr: "Yeni başlıyorum", labelEn: "Beginner", position: 1 },
          { key: "intermediate", labelTr: "Biraz deneyimim var", labelEn: "Some experience", position: 2 },
          { key: "advanced", labelTr: "Deneyimliyim", labelEn: "Experienced", position: 3 },
        ],
      },
      { key: "current_situation", type: "LONG_TEXT", section: "CURRENT_SITUATION", labelTr: "Mevcut Durumunuz", labelEn: "Current Situation", required: true, position: 2 },
      { key: "main_goal", type: "LONG_TEXT", section: "GOALS", labelTr: "Ana Hedefiniz", labelEn: "Main Goal", required: true, position: 3 },
      { key: "why_now", type: "LONG_TEXT", section: "GOALS", labelTr: "Neden Şimdi?", labelEn: "Why Now?", helperTr: "Bu programı şimdi yapmak istemenizin nedeni nedir?", helperEn: "Why do you want to join this program now?", required: true, position: 4 },
      { key: "main_blocker", type: "LONG_TEXT", section: "CHALLENGES", labelTr: "Ana Engeliniz", labelEn: "Main Blocker", required: false, position: 5 },
      {
        key: "weekly_time", type: "SINGLE_SELECT", section: "AVAILABILITY", labelTr: "Haftalık Ayırabileceğiniz Süre", labelEn: "Available Weekly Time", required: true, position: 6,
        options: [
          { key: "lt_2h", labelTr: "2 saatten az", labelEn: "Less than 2 hours", position: 0 },
          { key: "2_5h", labelTr: "2-5 saat", labelEn: "2-5 hours", position: 1 },
          { key: "5_10h", labelTr: "5-10 saat", labelEn: "5-10 hours", position: 2 },
          { key: "gt_10h", labelTr: "10 saatten fazla", labelEn: "More than 10 hours", position: 3 },
        ],
      },
      {
        key: "preferred_language", type: "RADIO", section: "AVAILABILITY", labelTr: "Tercih Ettiğiniz Dil", labelEn: "Preferred Language", required: false, position: 7,
        options: [
          { key: "tr", labelTr: "Türkçe", labelEn: "Turkish", position: 0 },
          { key: "en", labelTr: "İngilizce", labelEn: "English", position: 1 },
        ],
      },
      { key: "why_join", type: "LONG_TEXT", section: "PROGRAM_FIT", labelTr: "Neden Bu Programa Katılmak İstiyorsunuz?", labelEn: "Why Do You Want to Join?", required: true, position: 8 },
      { key: "optional_note", type: "LONG_TEXT", section: "ADDITIONAL_INFO", labelTr: "Eklemek İstediğiniz", labelEn: "Additional Notes", required: false, position: 9 },
    ],
  },
  {
    key: "general_custom",
    type: "GENERAL_CUSTOM",
    nameTr: "Genel Başvuru",
    nameEn: "General Application",
    questions: [
      { key: "phone", type: "PHONE", section: "BASIC_INFO", labelTr: "Telefon Numarası", labelEn: "Phone Number", required: false, position: 0 },
      { key: "main_goal", type: "LONG_TEXT", section: "GOALS", labelTr: "Hedefiniz", labelEn: "Your Goal", required: true, position: 1 },
      { key: "why_interested", type: "LONG_TEXT", section: "PROGRAM_FIT", labelTr: "Neden İlgileniyorsunuz?", labelEn: "Why Are You Interested?", required: true, position: 2 },
      { key: "current_challenge", type: "LONG_TEXT", section: "CHALLENGES", labelTr: "Mevcut Zorluğunuz", labelEn: "Current Challenge", required: false, position: 3 },
      { key: "optional_note", type: "LONG_TEXT", section: "ADDITIONAL_INFO", labelTr: "Eklemek İstediğiniz", labelEn: "Additional Notes", required: false, position: 4 },
    ],
  },
];
