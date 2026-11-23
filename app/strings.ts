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
    logout: "লগআউট",
    backToFeed: "ফিডে ফিরে যাও",
  },

  landing: {
    chip: "ঢং ঢং ঢং! টিফিন টাইম",
    titleBefore: "স্কুলের",
    titleWord: "সেই দিনগুলো",
    titleAfter: "মনে পড়ে?",
    lead: "শেষ বেঞ্চের আড্ডা, ভাগ করে খাওয়া টিফিন, পরীক্ষার আগের রাতের টেনশন। সেই গল্পগুলো এখানে লিখে রাখো, পুরোনো বন্ধুদের সাথে আবার একটু হাসো।",
    loginToStart: "লগইন করে শুরু করো",
    startWriting: "গল্প লেখা শুরু করো",
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

  /** Privacy and data deletion pages; their long-form text is in app/content/legal.ts. */
  legal: {
    privacyLink: "গোপনীয়তা নীতি",
    dataDeletionLink: "ডেটা মুছে ফেলা",
    backToHome: "হোমে ফিরে যাও",
    /** A company name: stays in English, plain text. */
    poweredBy: "Powered by Xaonic LLC",
    privacyDescription:
      "টিফিনব্রেক কী তথ্য নেয়, কেন নেয় এবং কীভাবে ব্যবহার করে। Privacy Policy of TiffinBreak.",
    dataDeletionDescription:
      "টিফিনব্রেক থেকে নিজের অ্যাকাউন্ট ও তথ্য মুছে ফেলার নিয়ম। How to delete your TiffinBreak data.",
  },

  login: {
    title: "লগইন",
    lead: "গল্প লিখতে আর পড়তে আগে লগইন করে নাও।",
    writeTitle: "তোমার গল্প লিখতে লগইন করো",
    writeLead: "গুগল বা ফেসবুক দিয়ে এক ট্যাপে লগইন করো, তারপর লেখা শুরু।",
    withGoogle: "গুগল দিয়ে লগইন করো",
    withFacebook: "ফেসবুক দিয়ে লগইন করো",
  },

  feed: {
    title: "হোম ফিড",
    greeting: (name: string) => `স্বাগতম, ${name}!`,
    placeholder: "গল্পগুলো শিগগিরই এখানে আসছে।",
    myDiary: "আমার ডায়েরি",
    newStories: "নতুন গল্প",
    emptyTitle: "ডায়েরির প্রথম পাতাটা এখনো খালি",
    emptyLead: "স্কুলের কোন গল্পটা দিয়ে শুরু করবে?",
    writeFirst: "প্রথম গল্পটা লিখি",
    loadOlder: "আরও পুরোনো গল্প",
    share: "শেয়ার",
    time: {
      justNow: "এইমাত্র",
      minutesAgo: (n: string) => `${n} মিনিট আগে`,
      hoursAgo: (n: string) => `${n} ঘণ্টা আগে`,
      yesterday: "গতকাল",
      daysAgo: (n: string) => `${n} দিন আগে`,
    },
  },

  write: {
    title: "গল্প লেখা",
    close: "বন্ধ করো",
    autosave: "নিজে নিজেই সেভ হচ্ছে",
    storyTitle: "গল্পের নাম",
    storyBody: "তোমার গল্প",
    changeSchool: "বদলাও",
    chooseSchool: "স্কুল বা কলেজ বেছে নাও",
    promptTitle: "কোথা থেকে শুরু করবে বুঝছো না?",
    usePrompt: "এটা নিয়েই লিখি",
    nextPrompt: "আরেকটা প্রশ্ন",
    wordsWritten: "শব্দ লেখা হয়েছে",
    publishing: "পোস্ট হচ্ছে…",
    coverPick: "পুরোনো একটা ছবি দাও (না দিলেও চলবে)",
    coverChange: "ছবি বদলাও",
    coverRemove: "ছবি সরাও",
    coverAlt: "গল্পের কভার ছবি",
    errors: {
      coverType: "ছবি JPG, PNG বা WebP হতে হবে।",
      coverTooBig: (max: string) => `ছবি সর্বোচ্চ ${max} মেগাবাইটের হতে পারবে।`,
      titleRequired: "গল্পের একটা নাম দাও।",
      titleTooLong: (max: string) => `নাম সর্বোচ্চ ${max} অক্ষরের হতে পারবে।`,
      bodyRequired: "গল্পের লেখা খালি রাখা যাবে না।",
      bodyTooLong: (max: string) => `গল্প সর্বোচ্চ ${max} অক্ষরের হতে পারবে।`,
      schoolRequired: "স্কুল বা কলেজ বেছে নাও।",
    },
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
    readingTime: (minutes: string) => `${minutes} মিনিটের গল্প`,
    loveBoxTitle: "গল্পটা ছুঁয়ে গেলে একটু ভালোবাসা দাও",
    loveCount: "ভালোবাসা",
    sendToFriends: "বন্ধুদের পাঠাও",
    linkCopied: "লিংক কপি হয়েছে",
    copyLink: "লিংকটা কপি করে বন্ধুদের পাঠাও",
    shareDescription: (firstName: string) =>
      `${firstName}র লেখা একটা গল্প। টিফিনব্রেকে লগইন করে পড়ো।`,
    moreFrom: (name: string) => `${name}র আরও গল্প পড়ো`,
    months: [
      "জানুয়ারি",
      "ফেব্রুয়ারি",
      "মার্চ",
      "এপ্রিল",
      "মে",
      "জুন",
      "জুলাই",
      "আগস্ট",
      "সেপ্টেম্বর",
      "অক্টোবর",
      "নভেম্বর",
      "ডিসেম্বর",
    ],
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
    storiesOf: (name: string) => `${name}র গল্পগুলো`,
    storiesWritten: "টা গল্প লিখেছে",
    loveReceived: "ভালোবাসা পেয়েছে",
    noStories: "এখনো কোনো গল্প নেই।",
    editProfile: "প্রোফাইল এডিট করো",
  },

  editProfile: {
    title: "প্রোফাইল এডিট",
    nameLabel: "তোমার নাম",
    handleLabel: "হ্যান্ডেল",
    handleHint: (min: string, max: string) =>
      `ইংরেজি ছোট হাতের অক্ষর, সংখ্যা আর _ দিয়ে ${min} থেকে ${max} অক্ষর।`,
    avatarLabel: "প্রোফাইল ছবি",
    avatarChange: "ছবি বদলাও",
    save: "সেভ করো",
    saving: "সেভ হচ্ছে…",
    cancel: "থাক",
    errors: {
      nameRequired: "নাম খালি রাখা যাবে না।",
      nameTooLong: (max: string) => `নাম সর্বোচ্চ ${max} অক্ষরের হতে পারবে।`,
      handleLength: (min: string, max: string) =>
        `হ্যান্ডেল ${min} থেকে ${max} অক্ষরের মধ্যে হতে হবে, এটা ছোট বা বড় হয়ে গেছে।`,
      handleChars: "হ্যান্ডেলে শুধু ইংরেজি ছোট হাতের অক্ষর, সংখ্যা আর _ চলবে।",
      handleTaken: "হ্যান্ডেলটা আগেই কেউ নিয়ে নিয়েছে। অন্যটা বেছে নাও।",
      avatarType: "ছবি JPG, PNG বা WebP হতে হবে।",
      avatarTooBig: (max: string) => `ছবি সর্বোচ্চ ${max} মেগাবাইটের হতে পারবে।`,
    },
  },

  school: {
    storyCount: (n: string) => `${n}টা গল্প`,
    noStories: "এই স্কুল বা কলেজের কোনো গল্প এখনো লেখা হয়নি।",
    addTitle: "স্কুল বা কলেজ যোগ করো",
    question: "তোমার স্কুল বা কলেজের নাম কী?",
    placeholder: "যেমন: রূপনগর হাই স্কুল",
    save: "সেভ করো, লেখা শুরু করি",
    saving: "সেভ হচ্ছে…",
    lead: "গল্পের পাশে স্কুল বা কলেজের নাম থাকলে পুরোনো বন্ধুরা সহজেই চিনে ফেলবে।",
    label: "স্কুল বা কলেজের নাম",
    skip: "এখন না, পরে দেবো",
    suggestionsHint: "বন্ধুরা এই স্কুল-কলেজগুলো লিখেছে",
    matchHint: "এটা কি তোমার স্কুল বা কলেজ?",
    newNameHint: "নতুন নাম হিসেবে যোগ হয়ে যাবে",
    addNew: (name: string) => `“${name}” নতুন যোগ করো`,
    saveFailed: "সেভ করা যায়নি। একটু পরে আবার চেষ্টা করো।",
  },

  report: {
    action: "রিপোর্ট করো",
    confirmTitle: "গল্পটা রিপোর্ট করবে?",
    confirmHint: "কয়েকজন রিপোর্ট করলে গল্পটা লুকিয়ে ফেলা হবে।",
    reasonLabel: "কারণ (চাইলে লিখতে পারো)",
    submit: "রিপোর্ট পাঠাও",
    cancel: "থাক",
    done: "রিপোর্ট করা হয়েছে",
  },

  admin: {
    title: "অ্যাডমিন রিভিউ",
    lead: "রিপোর্ট হওয়া আর লুকানো গল্পগুলো এখানে।",
    empty: "রিভিউ করার মতো কোনো গল্প নেই।",
    hidden: "লুকানো",
    reports: "রিপোর্ট",
    noReason: "কারণ লেখা হয়নি",
    reasonsTitle: "রিপোর্টের কারণ",
    restore: "ফিরিয়ে দাও",
    remove: "মুছে ফেলো",
    removeConfirm: "গল্পটা চিরতরে মুছে যাবে। নিশ্চিত?",
    by: (name: string) => `লিখেছে ${name}`,
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
