import { create } from "zustand";
import { persist } from "zustand/middleware";
import en from "../locals/en.json";
import fr from "../locals/fr.json";

const languages = {
  en,
  fr,
};

export const useLanguageStore = create(
  persist(
    (set) => ({
      language: "en",
      t: en,

      setLanguage: (lang) => {
        set({
          language: lang,
          t: languages[lang],
        });
        document.documentElement.dir = "ltr";
      },
    }),
    {
      name: "app-language",
    }
  )
);
