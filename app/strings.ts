/**
 * All Bangla UI copy lives here. Components import `strings` and read keys
 * such as `strings.nav.home`; never hard-code copy in a component.
 *
 * - Group by screen or area; key by meaning, not by the Bangla text.
 * - Use GLOSSARY.md terms in keys (story, writer, school, love, feed, report).
 * - Copy that needs data is a function, so the arguments are typed too.
 *
 * The object is `as const`, so reading a key that doesn't exist is a type
 * error, and each value keeps its literal type.
 */
export const strings = {
  brand: {
    name: "টিফিনব্রেক",
  },

  pwa: {
    description: "স্কুলের দিনের গল্প লিখে রাখার জায়গা",
  },

  /** Document titles, shown as "<page> | টিফিনব্রেক" via `pageTitle`. */
  meta: {
    pageTitle: (page: string) => `${page} | টিফিনব্রেক`,
  },

  nav: {
    label: "প্রধান মেনু",
    home: "হোম",
    write: "লেখো",
    profile: "প্রোফাইল",
    myProfile: "আমার প্রোফাইল",
    login: "লগইন",
    backToFeed: "ফিডে ফিরে যাও",
  },

  landing: {
    title: "স্কুলের সেই দিনগুলো মনে পড়ে?",
    lead: "শেষ বেঞ্চের আড্ডা, ভাগ করে খাওয়া টিফিন, পরীক্ষার আগের রাতের টেনশন। সেই গল্পগুলো এখানে লিখে রাখো, পুরোনো বন্ধুদের সাথে আবার একটু হাসো।",
  },

  feed: {
    title: "হোম ফিড",
    myDiary: "আমার ডায়েরি",
    newStories: "নতুন গল্প",
  },

  story: {
    readTitle: "গল্প পড়া",
    actions: "গল্পের অ্যাকশন",
    share: "শেয়ার করো",
    titlePlaceholder: "গল্পের একটা নাম দাও",
    bodyPlaceholder:
      "এখান থেকে লেখা শুরু করো… কী লিখবে ভেবে না পেলে নিচের প্রশ্নটা দেখো।",
    addImage: "ছবি যোগ করো",
    publish: "পোস্ট করো",
  },

  love: {
    give: "ভালোবাসা দাও",
    hint: "যতবার খুশি চাপো",
    maxReached: "অনেক ভালোবাসা দিয়ে ফেলেছ!",
  },

  writer: {
    publicProfile: "পাবলিক প্রোফাইল",
    profileOf: (name: string) => `${name} এর প্রোফাইল`,
    myStories: "আমার গল্পগুলো",
    shareProfile: "প্রোফাইল শেয়ার করো",
  },

  school: {
    addTitle: "স্কুল বা কলেজ যোগ করো",
    question: "তোমার স্কুল বা কলেজের নাম কী?",
    placeholder: "যেমন: রূপনগর হাই স্কুল",
    save: "সেভ করো, লেখা শুরু করি",
  },

  report: {
    action: "রিপোর্ট করো",
  },

  common: {
    close: "বন্ধ করো",
    back: "ফিরে যাও",
  },

  errors: {
    generic: "কিছু একটা ভুল হয়েছে",
    tryAgainLater: "একটু পরে আবার চেষ্টা করো।",
    errorTitle: "ভুল",
    notFoundTitle: "৪০৪",
    notFound: "এই পাতাটা খুঁজে পাওয়া যায়নি।",
  },
} as const;

export type Strings = typeof strings;
