/**
 * i18n/en.js
 * English language pack.
 */
export const enTranslations = {
  site: {
    title: "CH's HomePage",
    kawaii: "Sekai ichi kawaii!",
    notice: "Notice",
    socialMedia: "Social Media",
    siteInfo: "Site Info",
    runningStatus: "Running Status:",
    myStatus: "My Status:",
    servicesStatus: "Services Status:",
    normal: "🟢 Normal",
    alive: "🟢 Still Alive",
    view: "🟢 View",
    profile: "Profile",
    sidebar: "Sidebar Info",
    socialNav: "Social Media and Functions",
    socialLinks: "Social Media Links",
    pageControl: "Page Control",
    avatarAlt: "CH's Avatar",
    switchLang: "Switch Language",
    mainTitle: "CH's Personal Page",
    sponsorTitle: "CH's Sponsor Page",
  },
  about: {
    title: "About CH",
    greeting:
      "Hello! This is CH! Currently still a vampire loli enchantress in school!",
    disclaimer:
      "Because our ideas are a bit peculiar, so if you see any silly repositories, it's not us! It's all the next door QT!",
    hobby:
      "There are many things I like, but currently the favorite is sleeping.",
    affiliation: "Currently affiliated with GAS / GirlsAndScary",
    business:
      "For business cooperation, please email (but can we really get any business orders? qaq).",
    currentStatus: "Today, study.",
  },
  skills: {
    title: "My Skills",
    barAriaLabel: "{{skill}} skill {{percent}}%",
  },
  websites: {
    title: "Websites About Me",
    qtnull: "The Next Door QT",
    nekocServer: "NekoC Game Server List",
    chFileShare: "CH GAS Public File Share Service",
    sponsor: "Sponsor CC",
    messageVerify: "Message verification / Download CH's PGP public key",
    links: {
      chFileShare: "Visit CH GAS Public File Share Service",
      sponsor: "Go to sponsor page",
      messageVerify: "Message verification / Download CH's PGP public key",
      qtnull: "Visit QT's GitHub homepage",
      nekocServer: "View NekoC server list",
    },
  },
  sponsor: {
    chooseMethod: "Choose donation method",
    wechatPay: "Sponsor via WechatPay",
    patreon: "Sponsor via Patreon",
    afdian: "Sponsor via Afdian",
    openCollective: "Sponsor via OpenCollective",
    buttonTitles: {
      wechatPay: "Click to sponsor via WeChat Pay QR code",
      patreon: "Click to sponsor via Patreon platform",
      afdian: "Click to sponsor via Afdian platform",
      openCollective: "Click to sponsor via OpenCollective platform",
    },
    confirmDialog: {
      title: "Really want to buy CC a milk tea?",
      text: "You're such a nice person!",
      cancel: "No, thanks",
      confirm: "OK",
    },
  },
  socialMedia: {
    bilibili: "Bilibili",
    github: "GitHub",
    email: "Email",
    twitter: "Twitter",
    youtube: "Youtube Channel",
    telegram: "Telegram",
    steam: "Steam",
    discord: "Discord Channel",
    twitch: "Twitch",
    osu: "OSU!",
    session: "Session",
    links: {
      bilibili: "Visit my Bilibili homepage",
      github: "Visit my GitHub homepage",
      email: "Click to view email address",
      twitter: "Visit my Twitter homepage",
      youtube: "Visit my Youtube channel",
      telegram: "Visit my Telegram channel",
      steam: "Visit my Steam homepage",
      discord: "Visit my Discord channel",
      twitch: "Visit my Twitch channel",
      osu: "Visit my OSU! homepage",
      session: "View Session ID",
    },
  },
  common: {
    switchLanguage: "Switch Language",
    copy: "Copy",
    cancel: "Cancel",
    copySuccess: "Copied!",
    copyFailed: "Copy failed, please copy manually",
    tabTitleGone: "╭(°A°`)╮ Where are you going?",
    tabTitleBack: "(ฅ>ω<*ฅ) Welcome back!",
  },
  greeting: {
    autoModeSwitch: {
      dark: "Detected system switch to dark mode, dark mode automatically enabled",
      light:
        "Detected system switch to light mode, dark mode automatically disabled",
      title: "Auto Mode Switch",
    },
    modeSwitch: {
      title: "Mode Switched",
      dark: "Switched to dark mode",
      light: "Switched to light mode",
      vampireExit: "Exited vampire mode",
    },
    vampireMode: {
      activated: "Vampire mode activated!",
      welcome: "Welcome to the dark palace, my follower~",
    },
  },
  language: {
    zh: "Chinese",
    en: "English",
  },
  theme: {
    buttonTitle: "Toggle dark/light mode",
  },
  verify: {
    meta: {
      description:
        "CH Security Verification Center - PGP Signature Verification & Identity Security Announcements",
      keywords:
        "CH, PGP, digital signature, identity verification, security announcement, CHonesetDoPa",
    },
    site: {
      title: "CH Security Verification Center - PGP Signature Verification",
      kawaii: "Sekai ichi kawaii!",
      profile: "Profile",
      sidebar: "Sidebar Information",
      socialNav: "Social Media & Functions",
      socialLinks: "Social Media Links",
      pageControl: "Page Control",
      switchLang: "Switch Language",
      mainTitle: "CH's Personal Page",
      avatarAlt: "CH's avatar",
      darkModeAriaLabel: "Toggle dark mode",
    },
    notice: {
      title: "Security Verification Instructions",
      content:
        "Welcome to CH Security Verification Center.\nThis page is used to verify PGP digital signatures and publish identity security announcements.\nPlease use the tools below to verify the authenticity of digital signatures or check the latest identity security status.\nNote: Please make sure to access this page through official channels.",
    },
    timeline: {
      title: "Verification Timeline",
      events: {
        event1: "PGP key first published",
        event2: "Suspected impersonation found",
        event3: "Revoked Telegram old identity",
      },
      footerLabel: "Last updated: ",
    },
    pgp: {
      title: "PGP Public Key",
      description:
        "CH's PGP public key can be used to verify the authenticity of messages. You can import this key with any PGP-compatible software (such as GnuPG, OpenKeychain).",
    },
    pgpKey: {
      buttons: {
        local: "Local Download",
        remote: "OpenPGP.org",
        show: "Show Public Key",
        hide: "Hide Public Key",
      },
      labels: {
        userId: "User ID:",
        fingerprint: "Fingerprint:",
        algorithm: "Algorithm:",
        usage: "How to use:",
      },
      copyBtn: "Copy Public Key",
      downloadSuccess: "Download Complete",
      downloadMsg: "CH's PGP public key has been downloaded successfully!",
      downloadUsage:
        "Please import the downloaded key file into your PGP software to verify.",
      downloadFailed: "Download Failed",
      downloadFailedMsg: "Unable to download the public key",
      loadFailed: "(Unable to load public key)",
    },
    security: {
      title: "Security Identity Announcements",
      status: {
        revoked: "Revoked/Disabled",
        warning: "Suspected Impersonation Warning",
      },
      messages: {
        revoked:
          "The following identities have been revoked or disabled, please do not trust:",
        warning:
          "The following suspected impersonation identities have been found, please be careful to identify:",
      },
      items: {
        revokedStatus: "(Disabled)",
        warningStatus: "(Disabled, Uncontrolled)",
      },
      listLabel: "Security Announcements",
    },
    footerPrefix: "Copyright ",
    footerSuffix: "CH Every day is a new day",
  },
};
