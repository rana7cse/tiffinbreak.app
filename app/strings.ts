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
    chip: "ঢং ঢং ঢং! টিফিন টাইম",
    titleBefore: "স্কুলের",
    titleWord: "সেই দিনগুলো",
    titleAfter: "মনে পড়ে?",
    lead: "শেষ বেঞ্চের আড্ডা, ভাগ করে খাওয়া টিফিন, পরীক্ষার আগের রাতের টেনশন। সেই গল্পগুলো এখানে লিখে রাখো, পুরোনো বন্ধুদের সাথে আবার একটু হাসো।",
    loginToStart: "লগইন করে শুরু করো",
    lookAround: "আগে একটু ঘুরে দেখি",
    promptsTitle: "একটু মনে করো তো",
    promptsLead:
      "স্কুলের প্রথম দিন থেকে শেষ দিন পর্যন্ত, কত গল্প জমে আছে! যেকোনো একটা দিয়ে শুরু করো।",
    prompts: [
      {
        label: "প্রথম দিন",
        question: "স্কুলের প্রথম দিনটা কেমন ছিল? কার হাত ধরে গেট পেরিয়েছিলে?",
      },
      {
        label: "টিফিন টাইম",
        question: "টিফিনের ঘণ্টা বাজলেই কী কী করতে? কার বক্সে হানা দিতে?",
      },
      { label: "প্রাণের বন্ধু", question: "কার সাথে সবচেয়ে বেশি সময় কাটত?" },
      {
        label: "ঝগড়া",
        question: "সবচেয়ে বেশি ঝগড়া হতো কার সাথে? এখনো কি কথা হয়?",
      },
      {
        label: "স্যার, ম্যাডাম",
        question: "কোন স্যার বা ম্যাডামের কথা আজও মনে পড়ে?",
      },
      {
        label: "ক্লাসমেট",
        question: "কোনো ক্লাসমেট বা স্কুলের এমন কোনো কথা, যা ভোলা যায় না?",
      },
      { label: "শেষ দিন", question: "স্কুলের শেষ দিনে কাকে কী বলা হয়নি?" },
    ],
    stepsTitle: "একদম সহজ",
    steps: [
      {
        title: "লগইন করো",
        text: "এক ট্যাপেই হয়ে যাবে, নতুন পাসওয়ার্ড মনে রাখার ঝামেলা নেই।",
      },
      {
        title: "একটা গল্প লেখো",
        text: "ছোট হোক বা বড়, চাইলে পুরোনো একটা ছবিও দিতে পারো।",
      },
      {
        title: "বন্ধুরা পড়বে",
        text: "ভালো লাগলে ভালোবাসা দেবে, শেয়ার করবে। হয়তো ওরাও নিজের গল্পটা লিখে ফেলবে।",
      },
    ],
    ctaTitle: "স্কুলের সেই শৈশবটা কি মিস করো?",
    ctaText:
      "এমন কোনো গল্প আছে, যেটা হারিয়ে যেতে দিতে চাও না? এখানে লিখে রাখো, যত্নে থাকবে।",
    ctaButton: "আমার গল্পটা রেখে দিই",
    footer: "বন্ধুদের জন্য, ভালোবাসা দিয়ে বানানো",
  },

  login: {
    title: "লগইন",
    comingSoon: "লগইন শিগগিরই আসছে। একটু অপেক্ষা করো।",
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
