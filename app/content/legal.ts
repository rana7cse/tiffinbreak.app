import { bn } from "~/lib/bangla-digits";

/**
 * Long-form text of the Privacy Policy and the data deletion instructions.
 * Each page has a Bangla and an English version; both are shown on the page.
 * The text needs the owner's review before it is relied on.
 */

export const CONTACT_EMAIL = "info@xaonic.com";

export type LegalSection = {
  heading: string;
  paragraphs: readonly string[];
};

export type LegalVersion = {
  title: string;
  effective: string;
  sections: readonly LegalSection[];
};

export type LegalPage = { bn: LegalVersion; en: LegalVersion };

const effectiveBn = `কার্যকর হওয়ার তারিখ: ${bn(22)} নভেম্বর ${bn(2026)}`;
const effectiveEn = "Effective date: 22 November 2026";

export const privacy: LegalPage = {
  bn: {
    title: "গোপনীয়তা নীতি",
    effective: effectiveBn,
    sections: [
      {
        heading: "এই নীতি কী নিয়ে",
        paragraphs: [
          "টিফিনব্রেক স্কুল ও কলেজ জীবনের ছোট ছোট স্মৃতি লেখা আর পড়ার একটি ওয়েবসাইট। এই পাতায় বলা আছে আমরা কী তথ্য নিই, কেন নিই এবং সেই তথ্য নিয়ে কী করি।",
        ],
      },
      {
        heading: "আমরা কী তথ্য নিই",
        paragraphs: [
          "গুগল বা ফেসবুক দিয়ে লগইন করলে ওই প্ল্যাটফর্ম থেকে আমরা তোমার নাম, ইমেইল ঠিকানা আর প্রোফাইল ছবি পাই। এর বাইরে আর কিছু চাই না।",
          "তুমি যা লেখো বা করো, সেটাও আমাদের কাছে জমা থাকে: তোমার গল্প, গল্পে উল্লেখ করা স্কুল, তুমি যে ভালোবাসা দাও, তুমি যে রিপোর্ট করো এবং গল্পের সাথে আপলোড করা কভার ছবি।",
          "ওয়েবসাইট চালানোর সময় সার্ভারের রিকোয়েস্ট লগে তোমার আইপি অ্যাড্রেস থাকে।",
        ],
      },
      {
        heading: "তথ্য কীভাবে ব্যবহার করি",
        paragraphs: [
          "তোমার নাম ও প্রোফাইল ছবি দিয়ে তোমাকে লেখক হিসেবে দেখানো হয়, আর ইমেইল দিয়ে তোমার অ্যাকাউন্ট চেনা হয়। তোমার গল্প, ভালোবাসা ও রিপোর্ট ওয়েবসাইটের কাজ চালানোর জন্য ব্যবহার হয়। আইপি অ্যাড্রেস শুধু সার্ভারের রিকোয়েস্ট লগে থাকে।",
          "লগইন করা সবার জন্য গল্প ও লেখকের প্রোফাইল দেখা যায়। কেউ গল্পের লিংক শেয়ার করলে ফেসবুক বা মেসেঞ্জারে প্রিভিউ দেখানোর জন্য গল্পের শিরোনাম, কভার ছবি আর লেখকের প্রথম নাম লগইন ছাড়াও দেখা যায়। গল্পের বাকি অংশ লগইনের পেছনে থাকে।",
        ],
      },
      {
        heading: "কুকি, বিজ্ঞাপন ও ট্র্যাকিং",
        paragraphs: [
          "লগইন করা অবস্থায় রাখার জন্য আমরা সেশন কুকি ব্যবহার করি। আমাদের ওয়েবসাইটে কোনো বিজ্ঞাপন নেই এবং আমরা তোমাকে ট্র্যাক করি না।",
        ],
      },
      {
        heading: "তথ্য বিক্রি ও শেয়ার",
        paragraphs: [
          "আমরা তোমার তথ্য কারো কাছে বিক্রি করি না। ওয়েবসাইট ও ডেটা ক্লাউডফ্লেয়ারে হোস্ট করা, তাই তোমার তথ্য ক্লাউডফ্লেয়ারের সার্ভারে থাকে। লগইনের জন্য গুগল বা ফেসবুকের সাথে যোগাযোগ হয়।",
        ],
      },
      {
        heading: "তথ্য মুছে ফেলা",
        paragraphs: [
          "তুমি চাইলে তোমার অ্যাকাউন্ট ও তথ্য মুছে ফেলতে বলতে পারো। কীভাবে বলতে হবে, সেটা ডেটা মুছে ফেলার পাতায় আছে: /data-deletion।",
        ],
      },
      {
        heading: "যোগাযোগ ও পরিবর্তন",
        paragraphs: [
          `এই নীতি নিয়ে প্রশ্ন থাকলে ${CONTACT_EMAIL} ঠিকানায় ইমেইল করো।`,
          "এই নীতি বদলালে নতুন তারিখসহ এই পাতাতেই আপডেট করা হবে।",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    effective: effectiveEn,
    sections: [
      {
        heading: "What this policy covers",
        paragraphs: [
          "TiffinBreak is a website for writing and reading short memories from school and college days. This page explains what information we collect, why, and what we do with it.",
        ],
      },
      {
        heading: "What we collect",
        paragraphs: [
          "When you sign in with Google or Facebook, we receive your name, email address and profile picture from that provider. We do not ask for anything else.",
          "We also store what you write and do on the site: your Stories, the Schools they are about, the Love you give, the Reports you make, and any cover photos you upload with a Story.",
          "Our server request logs contain your IP address.",
        ],
      },
      {
        heading: "How we use it",
        paragraphs: [
          "Your name and profile picture show you as the Writer of your Stories, and your email identifies your account. Your Stories, Love and Reports are used to run the site. IP addresses appear only in server request logs.",
          "Stories and Writer profiles are visible to people who are signed in. When someone shares a Story link, the Story title, cover photo and the Writer's first name can be seen without signing in, so that Facebook and Messenger can show a link preview. The rest of the Story stays behind sign-in.",
        ],
      },
      {
        heading: "Cookies, ads and tracking",
        paragraphs: [
          "We use session cookies to keep you signed in. The site has no ads and does not track you.",
        ],
      },
      {
        heading: "Selling and sharing data",
        paragraphs: [
          "We do not sell your data. The site and its data are hosted on Cloudflare, so your data is stored on Cloudflare's servers. Signing in involves Google or Facebook.",
        ],
      },
      {
        heading: "Deleting your data",
        paragraphs: [
          "You can ask us to delete your account and data. How to do that is explained on the data deletion page: /data-deletion.",
        ],
      },
      {
        heading: "Contact and changes",
        paragraphs: [
          `If you have questions about this policy, email ${CONTACT_EMAIL}.`,
          "If we change this policy, we will update this page with a new date.",
        ],
      },
    ],
  },
};

export const dataDeletion: LegalPage = {
  bn: {
    title: "ডেটা মুছে ফেলার নির্দেশনা",
    effective: effectiveBn,
    sections: [
      {
        heading: "কীভাবে অনুরোধ করবে",
        paragraphs: [
          `এখন ইমেইলের মাধ্যমে তথ্য মুছে ফেলার অনুরোধ করতে হয়। ${CONTACT_EMAIL} ঠিকানায় একটি ইমেইল পাঠাও।`,
          "ইমেইলে লিখে দাও: তুমি তোমার অ্যাকাউন্ট ও তথ্য মুছে ফেলতে চাও; তোমার নাম; লগইনের জন্য কোন ইমেইল ঠিকানা ব্যবহার করেছ; আর গুগল না ফেসবুক, কোনটা দিয়ে লগইন করেছ। সম্ভব হলে লগইনে ব্যবহার করা ইমেইল ঠিকানা থেকেই পাঠাও, তাতে অনুরোধটা তোমার, সেটা বোঝা সহজ হয়।",
        ],
      },
      {
        heading: "কী কী মুছে যাবে",
        paragraphs: [
          "তোমার অ্যাকাউন্ট এবং তার সাথে যুক্ত তথ্য: নাম, ইমেইল ঠিকানা ও প্রোফাইল ছবি; তোমার লেখা গল্প ও আপলোড করা কভার ছবি; তোমার দেওয়া ভালোবাসা ও রিপোর্ট।",
          "সার্ভারের রিকোয়েস্ট লগে আইপি অ্যাড্রেস থাকে। এই লগ তোমার অ্যাকাউন্টের অংশ নয়।",
        ],
      },
      {
        heading: "ফেসবুক থেকে অ্যাপ সরানো",
        paragraphs: [
          "ফেসবুক দিয়ে লগইন করে থাকলে নিজের ফেসবুক সেটিংসের অ্যাপস ও ওয়েবসাইট অংশ থেকে টিফিনব্রেক সরিয়ে দিতে পারো। এতে ফেসবুক আর আমাদের সাথে তোমার তথ্য শেয়ার করবে না। তবে আমাদের কাছে থাকা তথ্য মুছতে হলে ওপরের মতো ইমেইল করতে হবে।",
        ],
      },
      {
        heading: "আরও জানতে",
        paragraphs: ["আমরা কী তথ্য রাখি, তা জানতে গোপনীয়তা নীতি দেখো: /privacy।"],
      },
    ],
  },
  en: {
    title: "Data deletion instructions",
    effective: effectiveEn,
    sections: [
      {
        heading: "How to ask",
        paragraphs: [
          `For now, deletion is by email request. Send an email to ${CONTACT_EMAIL}.`,
          "In the email, say that you want your account and data deleted, and include your name, the email address you used to sign in, and whether you signed in with Google or Facebook. If you can, send it from the email address you used to sign in, so it is easy to confirm the request is yours.",
        ],
      },
      {
        heading: "What gets deleted",
        paragraphs: [
          "Your account and the data attached to it: your name, email address and profile picture; the Stories you wrote and the cover photos you uploaded; and the Love and Reports you gave.",
          "Server request logs contain IP addresses. These logs are not part of your account.",
        ],
      },
      {
        heading: "Removing the app from Facebook",
        paragraphs: [
          "If you signed in with Facebook, you can also remove TiffinBreak from the Apps and Websites section of your Facebook settings. This stops Facebook sharing your data with us. To delete the data we already hold, you still need to email us as above.",
        ],
      },
      {
        heading: "More information",
        paragraphs: [
          "To see what data we keep, read the Privacy Policy: /privacy.",
        ],
      },
    ],
  },
};
