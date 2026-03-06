/**
 * SPiRiT Bar – i18n (internationalisation)
 * Supported languages: cs (default), en, de, pl, sigma
 */
(function () {
  "use strict";

  var LANGS = {
    cs:    { flag: "\u{1F1E8}\u{1F1FF}", name: "\u010ce\u0161tina" },
    en:    { flag: "\u{1F1EC}\u{1F1E7}", name: "English" },
    de:    { flag: "\u{1F1E9}\u{1F1EA}", name: "Deutsch" },
    pl:    { flag: "\u{1F1F5}\u{1F1F1}", name: "Polski" },
    sigma: { flag: "\u{1F5FF}",           name: "Sigma" }
  };

  /* ═══════════════════════════════════════════════
     TRANSLATIONS
     ═══════════════════════════════════════════════ */
  var T = {};

  // ── Czech (default – matches HTML) ──
  T.cs = {
    // Nav
    "nav.about": "O n\u00e1s",
    "nav.services": "Nab\u00eddka",
    "nav.gallery": "Prohl\u00eddka",
    "nav.hours": "Otev\u00edrac\u00ed doba",
    "nav.shop": "Kr\u00e1mek",
    "nav.map": "Kde n\u00e1s najdete",
    "nav.contact": "Kontakt",
    "nav.galerie": "Galerie",
    "nav.quiz": "Kv\u00edz",

    // Hero
    "hero.sr_title": "SPiRiT Teplice \u2013 Bar, Hookah Lounge a Coffee | \u0160koln\u00ed 605/18, 415 01 Teplice",
    "hero.tag": "Teplice \u00a0\u00b7\u00a0 \u0160koln\u00ed 605/18",
    "hero.sub": "Bar \u00a0\u00b7\u00a0 Hookah Lounge \u00a0\u00b7\u00a0 Coffee",
    "hero.reserve": "Rezervovat st\u016fl",
    "hero.more": "Zjistit v\u00edce",
    "hero.quiz": "Registrace na kv\u00edz!",
    "hero.theme_light": "Sv\u011btl\u00fd motiv",
    "hero.theme_dark": "Tmav\u00fd motiv",
    "hero.scroll": "Scroll",

    // About
    "about.label": "O n\u00e1s",
    "about.title": "M\u00edsto, kde \u010das plyne jinak",
    "about.p1": "SPiRiT je modern\u00ed a uvoln\u011bn\u00fd bar v srdci Teplic, kde se snoub\u00ed autentick\u00e1 atmosf\u00e9ra hookah lounge s pr\u00e9miovou nab\u00eddkou n\u00e1poj\u016f a dobr\u00e9 k\u00e1vy. N\u00e1\u0161 bar je stvo\u0159en pro ty, kte\u0159\u00ed si cht\u011bj\u00ed skute\u010dn\u011b odpo\u010dinout.",
    "about.p2": "Nab\u00edz\u00edme nejlep\u0161\u00ed vodn\u00ed d\u00fdmky v cel\u00e9m regionu, pe\u010dliv\u011b vybran\u00fd v\u00fdb\u011br koktejl\u016f, lihovin a nealkoholick\u00fdch n\u00e1poj\u016f. Pravideln\u011b po\u0159\u00e1d\u00e1me speci\u00e1ln\u00ed akce a eventy \u2013 sledujte na\u0161e soci\u00e1ln\u00ed s\u00edt\u011b.",
    "about.p3": "K dispozici je zdarma PlayStation i p\u016fj\u010den\u00ed deskov\u00fdch her. Platba kartou i hotovost\u00ed, Wi-Fi zdarma.",
    "about.cta": "Co nab\u00edz\u00edme",

    // Services
    "services.label": "Nab\u00eddka",
    "services.title": "Co u n\u00e1s najdete",
    "services.hookah.title": "Hookah Lounge",
    "services.hookah.desc": "Nejlep\u0161\u00ed vodn\u00ed d\u00fdmky daleko \u0161iroko. Bohat\u00fd v\u00fdb\u011br tab\u00e1k\u016f a p\u0159\u00edslu\u0161enstv\u00ed. Porad\u00edme s v\u00fdb\u011brem pro za\u010d\u00e1te\u010dn\u00edky i znalce.",
    "services.cocktails.title": "Koktejly & Drinky",
    "services.cocktails.desc": "Pr\u00e9miov\u00e9 koktejly, lihoviny, pivo i nealkoholick\u00e9 n\u00e1poje. V ka\u017ed\u00e9 n\u00e1lad\u011b si p\u0159ijdete na sv\u00e9 \u2013 od klasiky po kreativn\u00ed speci\u00e1ly.",
    "services.coffee.title": "K\u00e1va",
    "services.coffee.desc": "Espresso, americano, cappuccino, flat white a dal\u0161\u00ed. Na p\u0159\u00e1n\u00ed dochut\u00edme sirupovou p\u0159\u00edchut\u00ed.",
    "services.games.title": "PlayStation & Hry",
    "services.games.desc": "PlayStation k dispozici zdarma a p\u016fj\u010dovna deskov\u00fdch her p\u0159\u00edmo v baru. Ve\u010der s p\u0159\u00e1teli zaru\u010den\u011b nezklame.",
    "services.events.title": "Eventy & Akce",
    "services.events.desc": "Pravideln\u00e9 tematick\u00e9 ve\u010dery, koktejlov\u00e9 workshopy i soukrom\u00e9 oslavy. Sledujte n\u00e1s na s\u00edt\u00edch pro aktu\u00e1ln\u00ed program.",
    "services.tobacco.title": "Tab\u00e1k & Dopl\u0148ky",
    "services.tobacco.desc": "Prodej tab\u00e1k\u016f a dopl\u0148k\u016f pro vodn\u00ed d\u00fdmky p\u0159\u00edmo na m\u00edst\u011b. Pestr\u00e9 portfolio zna\u010dek za f\u00e9rov\u00e9 ceny.",
    "services.tea.title": "Sypan\u00e9 \u010daje",
    "services.tea.desc": "Skromn\u00fd, ale velice chutn\u00fd v\u00fdb\u011br sypan\u00fdch \u010daj\u016f pod\u00e1van\u00fdch v konvi\u010dce. Jednoduch\u00e1 radost, kter\u00e1 h\u0159eje.",
    "services.lemonade.title": "Poctiv\u00e9 limon\u00e1dy",
    "services.lemonade.desc": "Limon\u00e1dy s kousky \u010derstv\u00e9ho ovoce. Poctiv\u011b p\u0159ipraven\u00e9, bez kompromis\u016f \u2013 osv\u011b\u017een\u00ed, kter\u00e9 c\u00edt\u00edte.",

    // Gallery section (homepage)
    "gallery.label": "Prohl\u00eddka",
    "gallery.title": "U n\u00e1s v baru",
    "gallery.cta": "Prohl\u00e9dnout galerie",

    // Hours
    "hours.label": "Otev\u00edrac\u00ed doba",
    "hours.title": "Kdy n\u00e1s nav\u0161t\u00edvit",
    "hours.mon": "Pond\u011bl\u00ed",
    "hours.tue": "\u00dater\u00fd",
    "hours.wed": "St\u0159eda",
    "hours.thu": "\u010ctvrtek",
    "hours.fri": "P\u00e1tek",
    "hours.sat": "Sobota",
    "hours.sun": "Ned\u011ble",
    "hours.closed": "Zav\u0159eno",
    "hours.note": "\u23F0 Otev\u00edr\u00e1me ka\u017ed\u00fd den od 17:00, krom\u011b pond\u011bl\u00ed",
    "hours.extras_title": "V\u0161e, co pot\u0159ebujete v\u011bd\u011bt",
    "hours.card_title": "Platba kartou i hotovost\u00ed",
    "hours.card_desc": "P\u0159ij\u00edm\u00e1me Mastercard, VISA a bezkontaktn\u00ed platby.",
    "hours.wifi_title": "Wi-Fi zdarma",
    "hours.wifi_desc": "Rychl\u00fd internet pro v\u0161echny hosty.",
    "hours.reservation_title": "Rezervace",
    "hours.reservation_desc": "St\u016fl si rezervujte telefonicky, emailem nebo zpr\u00e1vou na soc. s\u00edt\u011b.",
    "hours.playstation_title": "PlayStation a deskovky zdarma",
    "hours.playstation_desc": "M\u00e1me hry a joypady a\u017e pro 4 hr\u00e1\u010de nar\u00e1z a hromady deskovek.",
    "hours.private_title": "Soukrom\u00e9 akce",
    "hours.private_desc": "Narozeniny, ve\u010d\u00edrky, firemn\u00ed eventy \u2013 kontaktujte n\u00e1s.",
    "hours.catering_title": "Ob\u010derstven\u00ed na objedn\u00e1vku",
    "hours.catering_desc": "Po domluv\u011b p\u0159ichyst\u00e1me na Va\u0161i oslavu zaj\u00edmav\u00e9 a bohat\u00e9 ob\u010derstven\u00ed.",
    "hours.loyalty_title": "V\u011brnostn\u00ed program",
    "hours.loyalty_desc": "Pro pravideln\u00e9 z\u00e1kazn\u00edky nab\u00edz\u00edme v\u011brnostn\u00ed kartu.",

    // Shop
    "shop.label": "Kr\u00e1mek",
    "shop.title": "Prodej d\u00fdmka\u0159sk\u00fdch pot\u0159eb a tab\u00e1k\u016f",
    "shop.intro": "V SPiRiTu nejenom kou\u0159\u00edme, ale i prod\u00e1v\u00e1me. P\u0159\u00edmo v baru najdete pe\u010dliv\u011b vybran\u00fd sortiment p\u0159\u00edslu\u0161enstv\u00ed a tab\u00e1k\u016f pro vodn\u00ed d\u00fdmky \u2013 v\u0161echno, co jsme sami vyzkou\u0161eli a za \u010d\u00edm si stoj\u00edme. \u017d\u00e1dn\u00e9 n\u00e1hodn\u00e9 zna\u010dky z velkoobchodu, ale ov\u011b\u0159en\u00fd v\u00fdb\u011br, kter\u00fd doporu\u010dujeme z vlastn\u00ed zku\u0161enosti.",
    "shop.accessories.title": "P\u0159\u00edslu\u0161enstv\u00ed",
    "shop.accessories.desc": "Kvalitn\u00ed kokosov\u00e9 uhl\u00edky, osobn\u00ed n\u00e1ustky, HMS (heat management syst\u00e9my) a dal\u0161\u00ed nezbytnosti pro dokonal\u00fd z\u00e1\u017eitek z vodn\u00ed d\u00fdmky. Porad\u00edme v\u00e1m s v\u00fdb\u011brem, a\u0165 jste za\u010d\u00e1te\u010dn\u00edk nebo ost\u0159\u00edlen\u00fd d\u00fdmka\u0159.",
    "shop.light.title": "Sv\u011btl\u00e9 tab\u00e1ky",
    "shop.light.desc": "Jemn\u011bj\u0161\u00ed chu\u0165, bohat\u00fd kou\u0159 a pestr\u00e1 paleta p\u0159\u00edchut\u00ed. V nab\u00eddce m\u00e1me obl\u00edben\u00e9 zna\u010dky Starwalker, Adalya, Dozaj a Serbetli \u2013 od ovocn\u00fdch mix\u016f p\u0159es m\u00e1tov\u00e9 a ledov\u00e9 varianty a\u017e po origin\u00e1ln\u00ed blends, kter\u00e9 jinde nenajdete.",
    "shop.dark.title": "\u010cern\u00e9 tab\u00e1ky",
    "shop.dark.desc": "Pro znalce, kte\u0159\u00ed hledaj\u00ed v\u00fdrazn\u011bj\u0161\u00ed a pln\u011bj\u0161\u00ed chu\u0165. Nab\u00edz\u00edme pr\u00e9miov\u00e9 zna\u010dky TNG Alpaca, Blackburn, DarkSide a Craftium \u2013 siln\u011bj\u0161\u00ed tab\u00e1ky s intenzivn\u00edmi p\u0159\u00edchut\u011bmi a dlouhotrvaj\u00edc\u00edm kou\u0159em pro ty, kdo cht\u011bj\u00ed v\u00edc.",
    "shop.note": "Kompletn\u00ed sortiment a aktu\u00e1ln\u00ed dostupnost v\u00e1m r\u00e1di uk\u00e1\u017eeme p\u0159\u00edmo na m\u00edst\u011b. Nebojte se zeptat \u2013 porad\u00edme s v\u00fdb\u011brem na m\u00edru.",

    // Map
    "map.label": "Kde n\u00e1s najdete",
    "map.title": "\u0160koln\u00ed 605/18, Teplice",

    // Contact
    "contact.label": "Kontakt",
    "contact.title": "Spojte se s n\u00e1mi",
    "contact.address": "Adresa",
    "contact.phone": "Telefon",
    "contact.email": "E-mail",
    "contact.social": "Soci\u00e1ln\u00ed s\u00edt\u011b",

    // Footer
    "footer.sub": "Bar \u00a0\u00b7\u00a0 Hookah Lounge \u00a0\u00b7\u00a0 Coffee",
    "footer.copy": "\u00a9 2026 SPiRiT Teplice \u00a0\u00b7\u00a0 \u0160koln\u00ed 605/18, 415 01 Teplice",

    // Error pages
    "error.back": "Zp\u011bt na hlavn\u00ed str\u00e1nku",
    "error.403.title": "P\u0159\u00edstup odep\u0159en",
    "error.403.sub": "Sem nem\u00e1\u0161 p\u0159\u00edstup, kamar\u00e1de! Tohle je VIP z\u00f3na.",
    "error.404.title": "Str\u00e1nka nenalezena",
    "error.404.sub": "Tady nic nen\u00ed\u2026 asi ses ztratil v d\u00fdmu z vodn\u00ed d\u00fdmky",
    "error.500.title": "Chyba serveru",
    "error.500.sub": "N\u011bco se pokazilo\u2026 barman to hned sprav\u00ed!",

    // Galerie page
    "galerie.label": "Galerie",
    "galerie.title": "Fotogalerie",
    "galerie.empty_title": "Zat\u00edm \u017e\u00e1dn\u00e9 galerie",
    "galerie.empty_desc": "Brzy sem p\u0159id\u00e1me fotky z na\u0161ich akc\u00ed.",
    "galerie.back": "\u2190 Zp\u011bt na galerie",
    "galerie.no_photos": "Tato galerie zat\u00edm nem\u00e1 \u017e\u00e1dn\u00e9 fotky.",
    "galerie.not_found": "Galerie nenalezena.",
    "galerie.load_error": "Galerie se nepoda\u0159ilo na\u010d\u00edst.",

    // Kviz page
    "kviz.label": "Kv\u00edzy",
    "kviz.title": "Kv\u00edzov\u00e9 ve\u010dery",
    "kviz.upcoming": "Nadch\u00e1zej\u00edc\u00ed",
    "kviz.history": "Historie",
    "kviz.no_quizzes": "Zat\u00edm nejsou napl\u00e1nov\u00e1ny \u017e\u00e1dn\u00e9 kv\u00edzy.",
    "kviz.load_error": "Kv\u00edzy se nepoda\u0159ilo na\u010d\u00edst.",
    "kviz.quiz_number": "Kv\u00edz #",
    "kviz.per_team": "/ t\u00fdm",
    "kviz.teams_max": "t\u00fdm\u016f max",
    "kviz.spots_full": "Kapacita napln\u011bna",
    "kviz.spots_left": "Voln\u00e1 m\u00edsta: ",
    "kviz.register_btn": "Registrovat t\u00fdm",
    "kviz.results_btn": "\u{1F3C6} V\u00fdsledky",
    "kviz.no_results": "\u017d\u00e1dn\u00e9 v\u00fdsledky.",
    "kviz.results_error": "V\u00fdsledky se nepoda\u0159ilo na\u010d\u00edst.",
    "kviz.form.team_name": "Jm\u00e9no t\u00fdmu",
    "kviz.form.team_name_placeholder": "N\u00e1zev va\u0161eho t\u00fdmu",
    "kviz.form.team_icon": "Ikona t\u00fdmu",
    "kviz.form.email": "E-mail",
    "kviz.form.email_placeholder": "kontakt@email.cz",
    "kviz.form.member_placeholder": "Jm\u00e9no sout\u011b\u017e\u00edc\u00edho",
    "kviz.form.add_member": "+ P\u0159idat \u010dlena",
    "kviz.form.submit": "Registrovat",
    "kviz.form.submitting": "Odes\u00edl\u00e1m\u2026",
    "kviz.form.err_team_name": "Vypl\u0148te jm\u00e9no t\u00fdmu.",
    "kviz.form.err_team_taken": "T\u00fdm s t\u00edmto n\u00e1zvem je ji\u017e registrov\u00e1n. Zvol jin\u00fd n\u00e1zev.",
    "kviz.form.err_icon": "Vyber ikonu t\u00fdmu.",
    "kviz.form.err_email": "Vypl\u0148te e-mail.",
    "kviz.form.err_email_invalid": "Zadejte platnou e-mailovou adresu.",
    "kviz.form.err_members": "Vypl\u0148te alespo\u0148 jednoho \u010dlena.",
    "kviz.success.title": "Registrace vytvo\u0159ena!",
    "kviz.success.notice": "\u26A0 Registrace bude potvrzena zaplacen\u00edm poplatku \u26A0",
    "kviz.success.subtitle": "Uhradit m\u016f\u017ee\u0161 hotov\u011b na baru nebo p\u0159evodem pomoc\u00ed n\u00e1sleduj\u00edc\u00edho QR k\u00f3du:",
    "kviz.success.warning": "Zapla\u0165 co nejd\u0159\u00edve, aby ti n\u011bkdo m\u00edsto nevyfoukl!",
    "kviz.success.email_sent": "jsme poslali potvrzuj\u00edc\u00ed email.",
    "kviz.score_suffix": "b."
  };

  // ── English ──
  T.en = {
    "nav.about": "About",
    "nav.services": "Menu",
    "nav.gallery": "Tour",
    "nav.hours": "Opening Hours",
    "nav.shop": "Shop",
    "nav.map": "Find Us",
    "nav.contact": "Contact",
    "nav.galerie": "Gallery",
    "nav.quiz": "Quiz",

    "hero.sr_title": "SPiRiT Teplice \u2013 Bar, Hookah Lounge & Coffee | Skolni 605/18, 415 01 Teplice",
    "hero.tag": "Teplice \u00a0\u00b7\u00a0 Skolni 605/18",
    "hero.sub": "Bar \u00a0\u00b7\u00a0 Hookah Lounge \u00a0\u00b7\u00a0 Coffee",
    "hero.reserve": "Book a Table",
    "hero.more": "Learn More",
    "hero.quiz": "Register for the Quiz!",
    "hero.theme_light": "Light Mode",
    "hero.theme_dark": "Dark Mode",
    "hero.scroll": "Scroll",

    "about.label": "About Us",
    "about.title": "A Place Where Time Flows Differently",
    "about.p1": "SPiRiT is a modern, laid-back bar in the heart of Teplice, blending the authentic atmosphere of a hookah lounge with a premium selection of drinks and great coffee. Our bar is made for those who truly want to relax.",
    "about.p2": "We offer the best hookahs in the entire region, a carefully curated selection of cocktails, spirits, and non-alcoholic beverages. We regularly host special events \u2013 follow us on social media.",
    "about.p3": "Free PlayStation and board games are available. Card and cash payments accepted, free Wi-Fi.",
    "about.cta": "See Our Menu",

    "services.label": "Menu",
    "services.title": "What You'll Find Here",
    "services.hookah.title": "Hookah Lounge",
    "services.hookah.desc": "The best hookahs around. Wide selection of tobacco and accessories. We'll help beginners and connoisseurs alike.",
    "services.cocktails.title": "Cocktails & Drinks",
    "services.cocktails.desc": "Premium cocktails, spirits, beer, and non-alcoholic beverages. Whatever your mood, we've got you covered \u2013 from classics to creative specials.",
    "services.coffee.title": "Coffee",
    "services.coffee.desc": "Espresso, americano, cappuccino, flat white, and more. Flavoured with syrup on request.",
    "services.games.title": "PlayStation & Games",
    "services.games.desc": "Free PlayStation and board game rentals right at the bar. A night out with friends that never disappoints.",
    "services.events.title": "Events",
    "services.events.desc": "Regular themed evenings, cocktail workshops, and private parties. Follow us on social media for the latest schedule.",
    "services.tobacco.title": "Tobacco & Accessories",
    "services.tobacco.desc": "Hookah tobacco and accessories sold on site. A diverse portfolio of brands at fair prices.",
    "services.tea.title": "Loose Leaf Tea",
    "services.tea.desc": "A modest but delicious selection of loose leaf teas served in a teapot. A simple joy that warms the soul.",
    "services.lemonade.title": "Homemade Lemonades",
    "services.lemonade.desc": "Lemonades with fresh fruit pieces. Honestly prepared, no compromises \u2013 refreshment you can taste.",

    "gallery.label": "Tour",
    "gallery.title": "Inside Our Bar",
    "gallery.cta": "Browse Galleries",

    "hours.label": "Opening Hours",
    "hours.title": "When to Visit",
    "hours.mon": "Monday",
    "hours.tue": "Tuesday",
    "hours.wed": "Wednesday",
    "hours.thu": "Thursday",
    "hours.fri": "Friday",
    "hours.sat": "Saturday",
    "hours.sun": "Sunday",
    "hours.closed": "Closed",
    "hours.note": "\u23F0 Open daily from 17:00, except Monday",
    "hours.extras_title": "Everything You Need to Know",
    "hours.card_title": "Card & Cash Payments",
    "hours.card_desc": "We accept Mastercard, VISA, and contactless payments.",
    "hours.wifi_title": "Free Wi-Fi",
    "hours.wifi_desc": "Fast internet for all guests.",
    "hours.reservation_title": "Reservations",
    "hours.reservation_desc": "Book a table by phone, email, or message us on social media.",
    "hours.playstation_title": "Free PlayStation & Board Games",
    "hours.playstation_desc": "We have games and controllers for up to 4 players and piles of board games.",
    "hours.private_title": "Private Events",
    "hours.private_desc": "Birthdays, parties, corporate events \u2013 get in touch.",
    "hours.catering_title": "Catering on Request",
    "hours.catering_desc": "By arrangement, we'll prepare a delicious spread for your celebration.",
    "hours.loyalty_title": "Loyalty Program",
    "hours.loyalty_desc": "We offer a loyalty card for regular customers.",

    "shop.label": "Shop",
    "shop.title": "Hookah Supplies & Tobacco for Sale",
    "shop.intro": "At SPiRiT we don't just smoke \u2013 we sell too. Right at the bar you'll find a carefully selected range of hookah accessories and tobacco \u2013 everything we've personally tested and stand behind. No random wholesale brands, just a tried-and-true selection we recommend from our own experience.",
    "shop.accessories.title": "Accessories",
    "shop.accessories.desc": "Quality coconut charcoal, personal mouthpieces, HMS (heat management systems), and other essentials for the perfect hookah experience. We'll help you choose whether you're a beginner or a seasoned smoker.",
    "shop.light.title": "Light Tobacco",
    "shop.light.desc": "Milder flavour, rich smoke, and a wide palette of tastes. We stock popular brands like Starwalker, Adalya, Dozaj, and Serbetli \u2013 from fruity mixes to mint and icy varieties to original blends you won't find elsewhere.",
    "shop.dark.title": "Dark Tobacco",
    "shop.dark.desc": "For connoisseurs seeking a stronger, fuller flavour. We offer premium brands TNG Alpaca, Blackburn, DarkSide, and Craftium \u2013 stronger tobaccos with intense flavours and long-lasting smoke for those who want more.",
    "shop.note": "We'll be happy to show you the full range and current availability on site. Don't hesitate to ask \u2013 we'll tailor a recommendation just for you.",

    "map.label": "Find Us",
    "map.title": "Skolni 605/18, Teplice",

    "contact.label": "Contact",
    "contact.title": "Get in Touch",
    "contact.address": "Address",
    "contact.phone": "Phone",
    "contact.email": "E-mail",
    "contact.social": "Social Media",

    "footer.sub": "Bar \u00a0\u00b7\u00a0 Hookah Lounge \u00a0\u00b7\u00a0 Coffee",
    "footer.copy": "\u00a9 2026 SPiRiT Teplice \u00a0\u00b7\u00a0 Skolni 605/18, 415 01 Teplice",

    "error.back": "Back to Homepage",
    "error.403.title": "Access Denied",
    "error.403.sub": "You can't come in here, buddy! This is a VIP zone.",
    "error.404.title": "Page Not Found",
    "error.404.sub": "Nothing here\u2026 you probably got lost in the hookah smoke.",
    "error.500.title": "Server Error",
    "error.500.sub": "Something went wrong\u2026 the bartender is on it!",

    "galerie.label": "Gallery",
    "galerie.title": "Photo Gallery",
    "galerie.empty_title": "No Galleries Yet",
    "galerie.empty_desc": "We'll be adding photos from our events soon.",
    "galerie.back": "\u2190 Back to Galleries",
    "galerie.no_photos": "This gallery doesn't have any photos yet.",
    "galerie.not_found": "Gallery not found.",
    "galerie.load_error": "Failed to load galleries.",

    "kviz.label": "Quizzes",
    "kviz.title": "Quiz Nights",
    "kviz.upcoming": "Upcoming",
    "kviz.history": "History",
    "kviz.no_quizzes": "No quizzes are planned yet.",
    "kviz.load_error": "Failed to load quizzes.",
    "kviz.quiz_number": "Quiz #",
    "kviz.per_team": "/ team",
    "kviz.teams_max": "teams max",
    "kviz.spots_full": "Fully Booked",
    "kviz.spots_left": "Spots left: ",
    "kviz.register_btn": "Register Team",
    "kviz.results_btn": "\u{1F3C6} Results",
    "kviz.no_results": "No results.",
    "kviz.results_error": "Failed to load results.",
    "kviz.form.team_name": "Team Name",
    "kviz.form.team_name_placeholder": "Your team name",
    "kviz.form.team_icon": "Team Icon",
    "kviz.form.email": "E-mail",
    "kviz.form.email_placeholder": "contact@email.com",
    "kviz.form.member_placeholder": "Contestant",
    "kviz.form.add_member": "+ Add Member",
    "kviz.form.submit": "Register",
    "kviz.form.submitting": "Submitting\u2026",
    "kviz.form.err_team_name": "Please enter a team name.",
    "kviz.form.err_team_taken": "A team with this name is already registered. Choose a different name.",
    "kviz.form.err_icon": "Please select a team icon.",
    "kviz.form.err_email": "Please enter an e-mail.",
    "kviz.form.err_email_invalid": "Please enter a valid e-mail address.",
    "kviz.form.err_members": "Please enter at least one member.",
    "kviz.success.title": "Registration Created!",
    "kviz.success.notice": "\u26A0 Registration will be confirmed upon payment \u26A0",
    "kviz.success.subtitle": "You can pay in cash at the bar or by bank transfer using the QR code below:",
    "kviz.success.warning": "Pay as soon as possible so nobody takes your spot!",
    "kviz.success.email_sent": "we sent a confirmation email.",
    "kviz.score_suffix": "pts"
  };

  // ── German ──
  T.de = {
    "nav.about": "\u00dcber uns",
    "nav.services": "Angebot",
    "nav.gallery": "Rundgang",
    "nav.hours": "\u00d6ffnungszeiten",
    "nav.shop": "Shop",
    "nav.map": "Wo Sie uns finden",
    "nav.contact": "Kontakt",
    "nav.galerie": "Galerie",
    "nav.quiz": "Quiz",

    "hero.sr_title": "SPiRiT Teplice \u2013 Bar, Hookah Lounge & Coffee | Skolni 605/18, 415 01 Teplice",
    "hero.tag": "Teplice \u00a0\u00b7\u00a0 Skolni 605/18",
    "hero.sub": "Bar \u00a0\u00b7\u00a0 Hookah Lounge \u00a0\u00b7\u00a0 Coffee",
    "hero.reserve": "Tisch reservieren",
    "hero.more": "Mehr erfahren",
    "hero.quiz": "Quiz-Anmeldung!",
    "hero.theme_light": "Heller Modus",
    "hero.theme_dark": "Dunkler Modus",
    "hero.scroll": "Scrollen",

    "about.label": "\u00dcber uns",
    "about.title": "Ein Ort, an dem die Zeit anders vergeht",
    "about.p1": "SPiRiT ist eine moderne, entspannte Bar im Herzen von Teplice, die die authentische Atmosph\u00e4re einer Hookah-Lounge mit einem erstklassigen Getr\u00e4nkeangebot und gutem Kaffee verbindet. Unsere Bar ist f\u00fcr alle gemacht, die wirklich entspannen wollen.",
    "about.p2": "Wir bieten die besten Wasserpfeifen der gesamten Region, eine sorgf\u00e4ltig ausgew\u00e4hlte Auswahl an Cocktails, Spirituosen und alkoholfreien Getr\u00e4nken. Regelm\u00e4\u00dfig veranstalten wir besondere Events \u2013 folgen Sie uns in den sozialen Medien.",
    "about.p3": "PlayStation und Brettspiele stehen kostenlos zur Verf\u00fcgung. Karten- und Barzahlung, kostenloses WLAN.",
    "about.cta": "Unser Angebot",

    "services.label": "Angebot",
    "services.title": "Was Sie bei uns finden",
    "services.hookah.title": "Hookah Lounge",
    "services.hookah.desc": "Die besten Wasserpfeifen weit und breit. Gro\u00dfe Auswahl an Tabak und Zubeh\u00f6r. Wir beraten Anf\u00e4nger und Kenner.",
    "services.cocktails.title": "Cocktails & Drinks",
    "services.cocktails.desc": "Premium-Cocktails, Spirituosen, Bier und alkoholfreie Getr\u00e4nke. F\u00fcr jede Stimmung das Richtige \u2013 von Klassikern bis zu kreativen Specials.",
    "services.coffee.title": "Kaffee",
    "services.coffee.desc": "Espresso, Americano, Cappuccino, Flat White und mehr. Auf Wunsch mit Sirup verfeinert.",
    "services.games.title": "PlayStation & Spiele",
    "services.games.desc": "Kostenlose PlayStation und Brettspiel-Verleih direkt in der Bar. Ein Abend mit Freunden, der garantiert nicht entt\u00e4uscht.",
    "services.events.title": "Events & Veranstaltungen",
    "services.events.desc": "Regelm\u00e4\u00dfige Themenabende, Cocktail-Workshops und private Feiern. Folgen Sie uns f\u00fcr das aktuelle Programm.",
    "services.tobacco.title": "Tabak & Zubeh\u00f6r",
    "services.tobacco.desc": "Verkauf von Tabak und Zubeh\u00f6r f\u00fcr Wasserpfeifen vor Ort. Vielf\u00e4ltiges Markenportfolio zu fairen Preisen.",
    "services.tea.title": "Loser Tee",
    "services.tea.desc": "Eine bescheidene, aber k\u00f6stliche Auswahl an losen Tees, serviert in der Kanne. Eine einfache Freude, die w\u00e4rmt.",
    "services.lemonade.title": "Hausgemachte Limonaden",
    "services.lemonade.desc": "Limonaden mit frischen Fruchtst\u00fccken. Ehrlich zubereitet, ohne Kompromisse \u2013 Erfrischung, die man schmeckt.",

    "gallery.label": "Rundgang",
    "gallery.title": "Bei uns in der Bar",
    "gallery.cta": "Galerien ansehen",

    "hours.label": "\u00d6ffnungszeiten",
    "hours.title": "Wann besuchen",
    "hours.mon": "Montag",
    "hours.tue": "Dienstag",
    "hours.wed": "Mittwoch",
    "hours.thu": "Donnerstag",
    "hours.fri": "Freitag",
    "hours.sat": "Samstag",
    "hours.sun": "Sonntag",
    "hours.closed": "Geschlossen",
    "hours.note": "\u23F0 T\u00e4glich ge\u00f6ffnet ab 17:00, au\u00dfer Montag",
    "hours.extras_title": "Alles, was Sie wissen m\u00fcssen",
    "hours.card_title": "Karten- & Barzahlung",
    "hours.card_desc": "Wir akzeptieren Mastercard, VISA und kontaktloses Bezahlen.",
    "hours.wifi_title": "Kostenloses WLAN",
    "hours.wifi_desc": "Schnelles Internet f\u00fcr alle G\u00e4ste.",
    "hours.reservation_title": "Reservierung",
    "hours.reservation_desc": "Reservieren Sie telefonisch, per E-Mail oder \u00fcber Social Media.",
    "hours.playstation_title": "Kostenlose PlayStation & Brettspiele",
    "hours.playstation_desc": "Spiele und Controller f\u00fcr bis zu 4 Spieler und jede Menge Brettspiele.",
    "hours.private_title": "Private Veranstaltungen",
    "hours.private_desc": "Geburtstage, Partys, Firmenevents \u2013 kontaktieren Sie uns.",
    "hours.catering_title": "Catering auf Anfrage",
    "hours.catering_desc": "Nach Absprache bereiten wir ein leckeres Buffet f\u00fcr Ihre Feier vor.",
    "hours.loyalty_title": "Treueprogramm",
    "hours.loyalty_desc": "Stammkunden erhalten eine Treuekarte.",

    "shop.label": "Shop",
    "shop.title": "Shisha-Zubeh\u00f6r & Tabak",
    "shop.intro": "Bei SPiRiT rauchen wir nicht nur \u2013 wir verkaufen auch. Direkt in der Bar finden Sie ein sorgf\u00e4ltig ausgew\u00e4hltes Sortiment an Zubeh\u00f6r und Tabak f\u00fcr Wasserpfeifen \u2013 alles, was wir selbst getestet haben und hinter dem wir stehen. Keine zuf\u00e4lligen Gro\u00dfhandelsmarken, sondern eine bew\u00e4hrte Auswahl aus eigener Erfahrung.",
    "shop.accessories.title": "Zubeh\u00f6r",
    "shop.accessories.desc": "Hochwertige Kokosnusskohle, pers\u00f6nliche Mundst\u00fccke, HMS und weiteres Zubeh\u00f6r f\u00fcr das perfekte Shisha-Erlebnis. Wir beraten Sie gerne.",
    "shop.light.title": "Heller Tabak",
    "shop.light.desc": "Milderer Geschmack, dichter Rauch und eine bunte Palette an Aromen. Beliebte Marken: Starwalker, Adalya, Dozaj und Serbetli \u2013 von fruchtigen Mischungen \u00fcber Minz-Varianten bis zu einzigartigen Blends.",
    "shop.dark.title": "Dunkler Tabak",
    "shop.dark.desc": "F\u00fcr Kenner mit Vorliebe f\u00fcr kr\u00e4ftigeren Geschmack. Premium-Marken: TNG Alpaca, Blackburn, DarkSide und Craftium \u2013 intensivere Aromen und langanhaltender Rauch.",
    "shop.note": "Das komplette Sortiment und die aktuelle Verf\u00fcgbarkeit zeigen wir Ihnen gerne vor Ort. Fragen Sie einfach \u2013 wir empfehlen ma\u00dfgeschneidert.",

    "map.label": "Wo Sie uns finden",
    "map.title": "Skolni 605/18, Teplice",

    "contact.label": "Kontakt",
    "contact.title": "Kontaktieren Sie uns",
    "contact.address": "Adresse",
    "contact.phone": "Telefon",
    "contact.email": "E-Mail",
    "contact.social": "Soziale Medien",

    "footer.sub": "Bar \u00a0\u00b7\u00a0 Hookah Lounge \u00a0\u00b7\u00a0 Coffee",
    "footer.copy": "\u00a9 2026 SPiRiT Teplice \u00a0\u00b7\u00a0 Skolni 605/18, 415 01 Teplice",

    "error.back": "Zur\u00fcck zur Startseite",
    "error.403.title": "Zugang verweigert",
    "error.403.sub": "Hier kommst du nicht rein, Kumpel! Das ist die VIP-Zone.",
    "error.404.title": "Seite nicht gefunden",
    "error.404.sub": "Hier gibt's nichts\u2026 du hast dich wohl im Shisha-Rauch verirrt.",
    "error.500.title": "Serverfehler",
    "error.500.sub": "Etwas ist schiefgelaufen\u2026 der Barkeeper k\u00fcmmert sich!",

    "galerie.label": "Galerie",
    "galerie.title": "Fotogalerie",
    "galerie.empty_title": "Noch keine Galerien",
    "galerie.empty_desc": "Bald f\u00fcgen wir Fotos von unseren Events hinzu.",
    "galerie.back": "\u2190 Zur\u00fcck zu Galerien",
    "galerie.no_photos": "Diese Galerie hat noch keine Fotos.",
    "galerie.not_found": "Galerie nicht gefunden.",
    "galerie.load_error": "Galerien konnten nicht geladen werden.",

    "kviz.label": "Quiz",
    "kviz.title": "Quiz-Abende",
    "kviz.upcoming": "Bevorstehend",
    "kviz.history": "Vergangene",
    "kviz.no_quizzes": "Es sind noch keine Quiz-Abende geplant.",
    "kviz.load_error": "Quiz-Abende konnten nicht geladen werden.",
    "kviz.quiz_number": "Quiz #",
    "kviz.per_team": "/ Team",
    "kviz.teams_max": "Teams max",
    "kviz.spots_full": "Ausgebucht",
    "kviz.spots_left": "Freie Pl\u00e4tze: ",
    "kviz.register_btn": "Team anmelden",
    "kviz.results_btn": "\u{1F3C6} Ergebnisse",
    "kviz.no_results": "Keine Ergebnisse.",
    "kviz.results_error": "Ergebnisse konnten nicht geladen werden.",
    "kviz.form.team_name": "Teamname",
    "kviz.form.team_name_placeholder": "Name eures Teams",
    "kviz.form.team_icon": "Team-Icon",
    "kviz.form.email": "E-Mail",
    "kviz.form.email_placeholder": "kontakt@email.de",
    "kviz.form.member_placeholder": "Teilnehmer",
    "kviz.form.add_member": "+ Mitglied hinzuf\u00fcgen",
    "kviz.form.submit": "Anmelden",
    "kviz.form.submitting": "Wird gesendet\u2026",
    "kviz.form.err_team_name": "Bitte Teamname eingeben.",
    "kviz.form.err_team_taken": "Ein Team mit diesem Namen ist bereits angemeldet. W\u00e4hle einen anderen.",
    "kviz.form.err_icon": "Bitte w\u00e4hle ein Team-Icon.",
    "kviz.form.err_email": "Bitte E-Mail eingeben.",
    "kviz.form.err_email_invalid": "Bitte g\u00fcltige E-Mail-Adresse eingeben.",
    "kviz.form.err_members": "Bitte mindestens ein Mitglied angeben.",
    "kviz.success.title": "Anmeldung erstellt!",
    "kviz.success.notice": "\u26A0 Anmeldung wird nach Zahlung best\u00e4tigt \u26A0",
    "kviz.success.subtitle": "Du kannst bar an der Bar oder per \u00dcberweisung mit dem QR-Code unten bezahlen:",
    "kviz.success.warning": "Zahle so schnell wie m\u00f6glich, damit dir niemand den Platz wegnimmt!",
    "kviz.success.email_sent": "haben wir eine Best\u00e4tigungs-E-Mail gesendet.",
    "kviz.score_suffix": "Pkt."
  };

  // ── Polish ──
  T.pl = {
    "nav.about": "O nas",
    "nav.services": "Oferta",
    "nav.gallery": "Wizyta",
    "nav.hours": "Godziny otwarcia",
    "nav.shop": "Sklep",
    "nav.map": "Gdzie nas znajdziesz",
    "nav.contact": "Kontakt",
    "nav.galerie": "Galeria",
    "nav.quiz": "Quiz",

    "hero.sr_title": "SPiRiT Teplice \u2013 Bar, Hookah Lounge & Coffee | Skolni 605/18, 415 01 Teplice",
    "hero.tag": "Teplice \u00a0\u00b7\u00a0 Skolni 605/18",
    "hero.sub": "Bar \u00a0\u00b7\u00a0 Hookah Lounge \u00a0\u00b7\u00a0 Coffee",
    "hero.reserve": "Zarezerwuj stolik",
    "hero.more": "Dowiedz si\u0119 wi\u0119cej",
    "hero.quiz": "Zapisz si\u0119 na quiz!",
    "hero.theme_light": "Jasny motyw",
    "hero.theme_dark": "Ciemny motyw",
    "hero.scroll": "Przewi\u0144",

    "about.label": "O nas",
    "about.title": "Miejsce, gdzie czas p\u0142ynie inaczej",
    "about.p1": "SPiRiT to nowoczesny, wyluzowany bar w sercu Teplic, \u0142\u0105cz\u0105cy autentyczn\u0105 atmosfer\u0119 hookah lounge z najwy\u017cszej klasy wyborem napoj\u00f3w i dobr\u0105 kaw\u0105. Nasz bar jest stworzony dla tych, kt\u00f3rzy chc\u0105 naprawd\u0119 odpocz\u0105\u0107.",
    "about.p2": "Oferujemy najlepsze fajki wodne w ca\u0142ym regionie, starannie dobrany wyb\u00f3r koktajli, alkoholi i napoj\u00f3w bezalkoholowych. Regularnie organizujemy specjalne wydarzenia \u2013 \u015bled\u017a nas w mediach spo\u0142eczno\u015bciowych.",
    "about.p3": "Do dyspozycji darmowy PlayStation i wypo\u017cyczalnia gier planszowych. P\u0142atno\u015b\u0107 kart\u0105 i got\u00f3wk\u0105, darmowe Wi-Fi.",
    "about.cta": "Nasza oferta",

    "services.label": "Oferta",
    "services.title": "Co u nas znajdziesz",
    "services.hookah.title": "Hookah Lounge",
    "services.hookah.desc": "Najlepsze fajki wodne w okolicy. Bogaty wyb\u00f3r tytoniu i akcesori\u00f3w. Doradzimy zar\u00f3wno pocz\u0105tkuj\u0105cym, jak i znawcom.",
    "services.cocktails.title": "Koktajle i Drinki",
    "services.cocktails.desc": "Koktajle premium, alkohole, piwo i napoje bezalkoholowe. Na ka\u017cdy nastr\u00f3j \u2013 od klasyk\u00f3w po kreatywne specja\u0142y.",
    "services.coffee.title": "Kawa",
    "services.coffee.desc": "Espresso, americano, cappuccino, flat white i wi\u0119cej. Na \u017cyczenie doprawiamy syropem.",
    "services.games.title": "PlayStation i Gry",
    "services.games.desc": "Darmowy PlayStation i wypo\u017cyczalnia gier planszowych. Wiecz\u00f3r ze znajomymi, kt\u00f3ry na pewno nie zawiedzie.",
    "services.events.title": "Eventy i Imprezy",
    "services.events.desc": "Regularne wieczory tematyczne, warsztaty koktajlowe i prywatne przyj\u0119cia. \u015aled\u017a nas po aktualny program.",
    "services.tobacco.title": "Tyto\u0144 i Akcesoria",
    "services.tobacco.desc": "Sprzeda\u017c tytoniu i akcesori\u00f3w do fajek wodnych na miejscu. R\u00f3\u017cnorodne portfolio marek w uczciwych cenach.",
    "services.tea.title": "Herbata li\u015bciasta",
    "services.tea.desc": "Skromny, ale pyszny wyb\u00f3r herbat li\u015bciastych podawanych w dzbanku. Prosta rado\u015b\u0107, kt\u00f3ra rozgrzewa.",
    "services.lemonade.title": "Domowe lemoniady",
    "services.lemonade.desc": "Lemoniady ze \u015bwie\u017cymi kawa\u0142kami owoc\u00f3w. Uczciwie przygotowane, bez kompromis\u00f3w \u2013 od\u015bwie\u017cenie, kt\u00f3re czujesz.",

    "gallery.label": "Wizyta",
    "gallery.title": "U nas w barze",
    "gallery.cta": "Przegl\u0105daj galerie",

    "hours.label": "Godziny otwarcia",
    "hours.title": "Kiedy nas odwiedzi\u0107",
    "hours.mon": "Poniedzia\u0142ek",
    "hours.tue": "Wtorek",
    "hours.wed": "\u015aroda",
    "hours.thu": "Czwartek",
    "hours.fri": "Pi\u0105tek",
    "hours.sat": "Sobota",
    "hours.sun": "Niedziela",
    "hours.closed": "Zamkni\u0119te",
    "hours.note": "\u23F0 Otwarte codziennie od 17:00, z wyj\u0105tkiem poniedzia\u0142ku",
    "hours.extras_title": "Wszystko, co musisz wiedzie\u0107",
    "hours.card_title": "P\u0142atno\u015b\u0107 kart\u0105 i got\u00f3wk\u0105",
    "hours.card_desc": "Akceptujemy Mastercard, VISA i p\u0142atno\u015bci zbli\u017ceniowe.",
    "hours.wifi_title": "Darmowe Wi-Fi",
    "hours.wifi_desc": "Szybki internet dla wszystkich go\u015bci.",
    "hours.reservation_title": "Rezerwacje",
    "hours.reservation_desc": "Zarezerwuj stolik telefonicznie, mailem lub przez media spo\u0142eczno\u015bciowe.",
    "hours.playstation_title": "Darmowy PlayStation i gry planszowe",
    "hours.playstation_desc": "Mamy gry i kontrolery dla max 4 graczy oraz mn\u00f3stwo gier planszowych.",
    "hours.private_title": "Imprezy prywatne",
    "hours.private_desc": "Urodziny, imprezy, eventy firmowe \u2013 skontaktuj si\u0119 z nami.",
    "hours.catering_title": "Catering na zam\u00f3wienie",
    "hours.catering_desc": "Po uzgodnieniu przygotujemy pyszny pocz\u0119stunek na Twoj\u0105 imprez\u0119.",
    "hours.loyalty_title": "Program lojalno\u015bciowy",
    "hours.loyalty_desc": "Sta\u0142ym klientom oferujemy kart\u0119 lojalno\u015bciow\u0105.",

    "shop.label": "Sklep",
    "shop.title": "Akcesoria i tyto\u0144 do fajek wodnych",
    "shop.intro": "W SPiRiTie nie tylko palimy \u2013 r\u00f3wnie\u017c sprzedajemy. Bezpo\u015brednio w barze znajdziesz starannie dobrany asortyment akcesori\u00f3w i tytoniu do fajek wodnych \u2013 wszystko, co sami przetestowali\u015bmy. \u017badnych przypadkowych marek hurtowych, tylko sprawdzony wyb\u00f3r z w\u0142asnego do\u015bwiadczenia.",
    "shop.accessories.title": "Akcesoria",
    "shop.accessories.desc": "Wysokiej jako\u015bci w\u0119giel kokosowy, osobiste ustniki, HMS i inne niezb\u0119dne akcesoria. Pomo\u017cemy w wyborze niezale\u017cnie od do\u015bwiadczenia.",
    "shop.light.title": "Jasny tyto\u0144",
    "shop.light.desc": "Delikatniejszy smak, g\u0119sty dym i bogata paleta smak\u00f3w. Popularne marki: Starwalker, Adalya, Dozaj i Serbetli \u2013 od owocowych mix\u00f3w po mi\u0119towe warianty i unikalne blendy.",
    "shop.dark.title": "Ciemny tyto\u0144",
    "shop.dark.desc": "Dla znawc\u00f3w szukaj\u0105cych mocniejszego smaku. Marki premium: TNG Alpaca, Blackburn, DarkSide i Craftium \u2013 intensywne aromaty i d\u0142ugotrwa\u0142y dym.",
    "shop.note": "Ch\u0119tnie poka\u017cemy pe\u0142ny asortyment na miejscu. Zapytaj \u2013 doradzimy indywidualnie.",

    "map.label": "Gdzie nas znajdziesz",
    "map.title": "Skolni 605/18, Teplice",

    "contact.label": "Kontakt",
    "contact.title": "Skontaktuj si\u0119 z nami",
    "contact.address": "Adres",
    "contact.phone": "Telefon",
    "contact.email": "E-mail",
    "contact.social": "Media spo\u0142eczno\u015bciowe",

    "footer.sub": "Bar \u00a0\u00b7\u00a0 Hookah Lounge \u00a0\u00b7\u00a0 Coffee",
    "footer.copy": "\u00a9 2026 SPiRiT Teplice \u00a0\u00b7\u00a0 Skolni 605/18, 415 01 Teplice",

    "error.back": "Powr\u00f3t na stron\u0119 g\u0142\u00f3wn\u0105",
    "error.403.title": "Dost\u0119p zabroniony",
    "error.403.sub": "Nie wejdziesz tu, kolego! To strefa VIP.",
    "error.404.title": "Strona nie znaleziona",
    "error.404.sub": "Nic tu nie ma\u2026 chyba zgubi\u0142e\u015b si\u0119 w dymie z fajki wodnej.",
    "error.500.title": "B\u0142\u0105d serwera",
    "error.500.sub": "Co\u015b posz\u0142o nie tak\u2026 barman ju\u017c to naprawia!",

    "galerie.label": "Galeria",
    "galerie.title": "Fotogaleria",
    "galerie.empty_title": "Brak galerii",
    "galerie.empty_desc": "Wkr\u00f3tce dodamy zdj\u0119cia z naszych event\u00f3w.",
    "galerie.back": "\u2190 Powr\u00f3t do galerii",
    "galerie.no_photos": "Ta galeria nie ma jeszcze zdj\u0119\u0107.",
    "galerie.not_found": "Galeria nie znaleziona.",
    "galerie.load_error": "Nie uda\u0142o si\u0119 za\u0142adowa\u0107 galerii.",

    "kviz.label": "Quiz",
    "kviz.title": "Wieczory quizowe",
    "kviz.upcoming": "Nadchodz\u0105ce",
    "kviz.history": "Historia",
    "kviz.no_quizzes": "Nie zaplanowano jeszcze \u017cadnych quiz\u00f3w.",
    "kviz.load_error": "Nie uda\u0142o si\u0119 za\u0142adowa\u0107 quiz\u00f3w.",
    "kviz.quiz_number": "Quiz #",
    "kviz.per_team": "/ zesp\u00f3\u0142",
    "kviz.teams_max": "zespo\u0142\u00f3w max",
    "kviz.spots_full": "Brak miejsc",
    "kviz.spots_left": "Wolne miejsca: ",
    "kviz.register_btn": "Zarejestruj zesp\u00f3\u0142",
    "kviz.results_btn": "\u{1F3C6} Wyniki",
    "kviz.no_results": "Brak wynik\u00f3w.",
    "kviz.results_error": "Nie uda\u0142o si\u0119 za\u0142adowa\u0107 wynik\u00f3w.",
    "kviz.form.team_name": "Nazwa zespo\u0142u",
    "kviz.form.team_name_placeholder": "Nazwa waszego zespo\u0142u",
    "kviz.form.team_icon": "Ikona zespo\u0142u",
    "kviz.form.email": "E-mail",
    "kviz.form.email_placeholder": "kontakt@email.pl",
    "kviz.form.member_placeholder": "Uczestnik",
    "kviz.form.add_member": "+ Dodaj cz\u0142onka",
    "kviz.form.submit": "Zarejestruj",
    "kviz.form.submitting": "Wysy\u0142anie\u2026",
    "kviz.form.err_team_name": "Podaj nazw\u0119 zespo\u0142u.",
    "kviz.form.err_team_taken": "Zesp\u00f3\u0142 o tej nazwie jest ju\u017c zarejestrowany. Wybierz inn\u0105 nazw\u0119.",
    "kviz.form.err_icon": "Wybierz ikon\u0119 zespo\u0142u.",
    "kviz.form.err_email": "Podaj e-mail.",
    "kviz.form.err_email_invalid": "Podaj prawid\u0142owy adres e-mail.",
    "kviz.form.err_members": "Podaj co najmniej jednego uczestnika.",
    "kviz.success.title": "Rejestracja utworzona!",
    "kviz.success.notice": "\u26A0 Rejestracja zostanie potwierdzona po op\u0142aceniu \u26A0",
    "kviz.success.subtitle": "Mo\u017cesz zap\u0142aci\u0107 got\u00f3wk\u0105 w barze lub przelewem za pomoc\u0105 kodu QR poni\u017cej:",
    "kviz.success.warning": "Zap\u0142a\u0107 jak najszybciej, \u017ceby nikt nie zaj\u0105\u0142 Twojego miejsca!",
    "kviz.success.email_sent": "wys\u0142ali\u015bmy e-mail z potwierdzeniem.",
    "kviz.score_suffix": "pkt."
  };

  // ── Sigma (brainrot English) ──
  T.sigma = {
    "nav.about": "The Lore",
    "nav.services": "The Drip Menu",
    "nav.gallery": "Vibe Check",
    "nav.hours": "Lock-In Hours",
    "nav.shop": "Rizz Shop",
    "nav.map": "GPS for NPCs",
    "nav.contact": "Slide Into DMs",
    "nav.galerie": "Aesthetic Dump",
    "nav.quiz": "Brain Rot Quiz",

    "hero.sr_title": "SPiRiT Teplice \u2013 The Most Sigma Bar in the Czech Republic, no cap",
    "hero.tag": "Teplice \u00a0\u00b7\u00a0 Main Character Location",
    "hero.sub": "Bar \u00a0\u00b7\u00a0 Cloud Factory \u00a0\u00b7\u00a0 Sigma Fuel Station",
    "hero.reserve": "Claim Your Throne fr fr",
    "hero.more": "Give Us a Vibe Check",
    "hero.quiz": "Lock In for the Quiz!",
    "hero.theme_light": "Light Mode (basic)",
    "hero.theme_dark": "Dark Mode (sigma)",
    "hero.scroll": "Scroll down bestie",

    "about.label": "The Lore",
    "about.title": "Where Time Hits Different, No Cap",
    "about.p1": "SPiRiT is the most sigma bar in all of Teplice, fr fr. We combined hookah lounge rizz with premium drink selection and coffee that goes absolutely crazy. This spot was literally built for main characters who need to decompress from their daily NPC interactions.",
    "about.p2": "We got the most bussin hookahs in the entire region \u2013 the clouds are giving gyatt. Plus a carefully curated selection of cocktails, spirits, and non-alc beverages. We regularly throw events that are actual W's \u2013 follow us on socials or stay delulu.",
    "about.p3": "Free PlayStation and board games available (gaming arc unlocked). Card and cash payments accepted, free Wi-Fi for your doomscrolling needs.",
    "about.cta": "Check the Drip Menu",

    "services.label": "The Drip Menu",
    "services.title": "What We Got (All W's, No L's)",
    "services.hookah.title": "Skibidi Smoke Zone",
    "services.hookah.desc": "The most sigma hookahs you'll ever hit. Clouds so thick they break the matrix. We'll help you choose whether you're a level 1 NPC or a maxed-out veteran \u2013 no gatekeeping here.",
    "services.cocktails.title": "Drinks That Give Rizz",
    "services.cocktails.desc": "Premium cocktails, spirits, beer, and zero-alc options. Whatever your current arc demands \u2013 from classic era to experimental phase. Every sip is bussin fr fr.",
    "services.coffee.title": "Sigma Fuel (Coffee)",
    "services.coffee.desc": "Espresso, americano, cappuccino, flat white, and more. The mewing juice that keeps your jawline and your grindset sharp. Syrup flavours on request.",
    "services.games.title": "Gaming Arc",
    "services.games.desc": "Free PlayStation and board game rentals. Squad up with your boys for a legendary gaming session. This is NOT an L evening, that's on Ohaio.",
    "services.events.title": "Main Character Events",
    "services.events.desc": "Regular themed nights, cocktail workshops, and private parties. We understood the assignment. Follow us on socials for the schedule.",
    "services.tobacco.title": "Cloud Producer Essentials",
    "services.tobacco.desc": "Hookah tobacco and accessories sold right here. Diverse brand portfolio at prices that won't take a fanum tax on your wallet.",
    "services.tea.title": "Mewing Juice (Tea)",
    "services.tea.desc": "A humble but absolutely bussin selection of loose leaf teas served in a teapot. Simple joy that hits different when you're in your cozy era.",
    "services.lemonade.title": "Gyatt Refreshments",
    "services.lemonade.desc": "Lemonades with fresh fruit chunks. Honestly prepared, zero cap \u2013 refreshment so good it made us say gyatt out loud.",

    "gallery.label": "Vibe Check",
    "gallery.title": "The Aesthetic (Inside Our Bar)",
    "gallery.cta": "Full Aesthetic Dump",

    "hours.label": "Lock-In Hours",
    "hours.title": "When to Pull Up",
    "hours.mon": "Monday (L day)",
    "hours.tue": "Tuesday",
    "hours.wed": "Wednesday",
    "hours.thu": "Thursday",
    "hours.fri": "Friday (W day)",
    "hours.sat": "Saturday (W day)",
    "hours.sun": "Sunday",
    "hours.closed": "Ghosting You",
    "hours.note": "\u23F0 We lock in daily at 17:00 (Monday is our rest arc, we're not NPCs)",
    "hours.extras_title": "Sigma Intel (Need to Know)",
    "hours.card_title": "Card & Cash (No Fanum Tax)",
    "hours.card_desc": "Mastercard, VISA, contactless \u2013 we accept everything except crypto (this isn't that kind of sigma).",
    "hours.wifi_title": "Free Wi-Fi",
    "hours.wifi_desc": "Fast internet for maximum doomscrolling and TikTok uploads.",
    "hours.reservation_title": "Reservations",
    "hours.reservation_desc": "Slide into our DMs, call us, or send a carrier pigeon. Just lock in your spot.",
    "hours.playstation_title": "Free PlayStation & Board Games",
    "hours.playstation_desc": "Controllers for up to 4 players and a mountain of board games. Activate your gaming arc.",
    "hours.private_title": "Private Events",
    "hours.private_desc": "Birthdays, parties, corporate events \u2013 we'll make it a W. Hit us up.",
    "hours.catering_title": "Catering on Request",
    "hours.catering_desc": "By arrangement, we'll prepare food that's absolutely bussin for your celebration. No cap.",
    "hours.loyalty_title": "Loyalty Program (Aura Points IRL)",
    "hours.loyalty_desc": "Regular customers get a loyalty card. Stack those aura points, king.",

    "shop.label": "Rizz Shop",
    "shop.title": "Cloud-Making Supplies & Tobacco",
    "shop.intro": "At SPiRiT we don't just produce clouds \u2013 we sell the tools too. Right at the bar you'll find a hand-picked selection of hookah accessories and tobacco. Everything personally tested by our sigma staff. No random NPC brands from wholesale \u2013 only tried-and-true picks that ate and left no crumbs.",
    "shop.accessories.title": "Accessories",
    "shop.accessories.desc": "Quality coconut charcoal, personal mouthpieces, HMS, and other essentials for a no-cap hookah experience. We'll guide you whether you're a beginner or an absolute menace.",
    "shop.light.title": "Light Tobacco",
    "shop.light.desc": "Milder vibes, thick clouds, and a whole palette of flavours. Starwalker, Adalya, Dozaj, and Serbetli \u2013 from fruity mixes to minty and icy variants. These blends are lowkey goated.",
    "shop.dark.title": "Dark Tobacco",
    "shop.dark.desc": "For the sigma connoisseurs seeking maximum flavour. TNG Alpaca, Blackburn, DarkSide, and Craftium \u2013 these are the final boss tobaccos. Intense, long-lasting, absolutely unhinged in the best way.",
    "shop.note": "Pull up and we'll show you everything in person. Don't be shy \u2013 we'll find your perfect match. That's rizz consulting, no cap.",

    "map.label": "GPS for NPCs",
    "map.title": "Skolni 605/18, Teplice (the coordinates of W)",

    "contact.label": "Slide Into DMs",
    "contact.title": "How to Reach Us (Choose Your Fighter)",
    "contact.address": "IRL Location",
    "contact.phone": "Hit Our Line",
    "contact.email": "Digital Pigeon",
    "contact.social": "Where We Post W's",

    "footer.sub": "Bar \u00a0\u00b7\u00a0 Cloud Factory \u00a0\u00b7\u00a0 Sigma Fuel Station",
    "footer.copy": "\u00a9 2026 SPiRiT Teplice \u00a0\u00b7\u00a0 Skolni 605/18 \u00a0\u00b7\u00a0 Living rent free in Teplice",

    "error.back": "Back to the Main Quest",
    "error.403.title": "Skill Issue \u2013 Access Denied",
    "error.403.sub": "You don't have the aura for this zone. VIP only, bestie.",
    "error.404.title": "Page Not Found (L + Ratio)",
    "error.404.sub": "Nothing here\u2026 you got lost in the hookah smoke like a true NPC.",
    "error.500.title": "Server Took an L",
    "error.500.sub": "Something broke\u2026 the bartender is in his fix-it arc. Stay delulu, it'll be fine.",

    "galerie.label": "Aesthetic Dump",
    "galerie.title": "Photo Gallery (Pure Vibes)",
    "galerie.empty_title": "No Content Yet (We're Loading)",
    "galerie.empty_desc": "Event pics dropping soon. Stay locked in.",
    "galerie.back": "\u2190 Back to the Aesthetic Dump",
    "galerie.no_photos": "This gallery is empty. The content arc hasn't started yet.",
    "galerie.not_found": "Gallery not found. That's an L.",
    "galerie.load_error": "Failed to load. Skill issue on our end fr.",

    "kviz.label": "Brain Rot Quiz",
    "kviz.title": "Quiz Nights (Lock In or Get Out)",
    "kviz.upcoming": "Coming Up (Lock In Now)",
    "kviz.history": "Hall of Fame (Past W's & L's)",
    "kviz.no_quizzes": "No quizzes planned yet. We're in our planning arc.",
    "kviz.load_error": "Quiz loading took an L. Try again.",
    "kviz.quiz_number": "Quiz #",
    "kviz.per_team": "/ squad",
    "kviz.teams_max": "squads max",
    "kviz.spots_full": "Fully Booked (massive L)",
    "kviz.spots_left": "Spots left: ",
    "kviz.register_btn": "Lock In Your Squad",
    "kviz.results_btn": "\u{1F3C6} Results",
    "kviz.no_results": "No results. The void stares back.",
    "kviz.results_error": "Results took an L loading.",
    "kviz.form.team_name": "Squad Name",
    "kviz.form.team_name_placeholder": "Your squad's sigma name",
    "kviz.form.team_icon": "Squad Icon",
    "kviz.form.email": "E-mail",
    "kviz.form.email_placeholder": "sigma@email.com",
    "kviz.form.member_placeholder": "Squad member",
    "kviz.form.add_member": "+ Add Another Sigma",
    "kviz.form.submit": "Lock In",
    "kviz.form.submitting": "Locking in\u2026",
    "kviz.form.err_team_name": "Bro, enter a squad name. Don't be an NPC.",
    "kviz.form.err_team_taken": "That name's already taken. Be more creative, king.",
    "kviz.form.err_icon": "Pick an icon. Don't leave your squad faceless.",
    "kviz.form.err_email": "Drop your email, we need to reach you somehow.",
    "kviz.form.err_email_invalid": "That email is giving NPC energy. Enter a real one.",
    "kviz.form.err_members": "Add at least one squad member. Can't sigma alone.",
    "kviz.success.title": "Squad Locked In!",
    "kviz.success.notice": "\u26A0 Registration confirmed after payment (no cap) \u26A0",
    "kviz.success.subtitle": "Pay cash at the bar or bank transfer via QR code below:",
    "kviz.success.warning": "Pay ASAP or someone takes your spot. That would be a massive L.",
    "kviz.success.email_sent": "we sent a confirmation to your digital pigeon box.",
    "kviz.score_suffix": "pts"
  };

  /* ═══════════════════════════════════════════════
     SELECTOR → KEY MAP (for static HTML translation)
     Applies to index.html and layout.ts-generated pages
     ═══════════════════════════════════════════════ */
  var SINGLE_MAP = [
    // NAV
    ['.nav-links a[href*="about"]',       "nav.about"],
    ['.nav-links a[href*="services"]',    "nav.services"],
    ['.nav-links a[href*="gallery"]',     "nav.gallery"],
    ['.nav-links a[href*="hours"]',       "nav.hours"],
    ['.nav-links a[href*="shop"]',        "nav.shop"],
    ['.nav-links a[href*="map-section"]', "nav.map"],
    ['.nav-links a[href*="contact"]',     "nav.contact"],
    ['.nav-links a[href*="galerie"]',     "nav.galerie"],
    ['.nav-links a[href*="kviz"]',        "nav.quiz"],

    // HERO
    [".hero-content .sr-only",   "hero.sr_title"],
    [".hero-tag",                "hero.tag"],
    [".hero-sub",                "hero.sub"],
    [".hero-buttons .btn-primary","hero.reserve"],
    [".hero-buttons .btn-outline","hero.more"],
    ["#quizHeroBtn",             "hero.quiz"],
    [".scroll-hint",             "hero.scroll"],

    // ABOUT
    ["#about .section-label",    "about.label"],
    ["#about .section-title",    "about.title"],
    ["#about .about-text .btn",  "about.cta"],

    // SERVICES
    ["#services .section-label", "services.label"],
    ["#services .section-title", "services.title"],

    // GALLERY (homepage section)
    ["#gallery .section-label",  "gallery.label"],
    ["#gallery .section-title",  "gallery.title"],
    [".galerie-cta .btn",        "gallery.cta"],

    // HOURS
    ["#hours .section-label",    "hours.label"],
    ["#hours .section-title",    "hours.title"],
    ["#hours .hours-note",       "hours.note"],
    ["#hours .hours-extras > h3","hours.extras_title"],

    // SHOP
    ["#shop .section-label",     "shop.label"],
    ["#shop .section-title",     "shop.title"],
    ["#shop .shop-intro p",      "shop.intro"],
    ["#shop .shop-note",         "shop.note"],

    // MAP
    ["#map-section .section-label","map.label"],
    ["#map-section .section-title","map.title"],

    // CONTACT
    ["#contact .section-label",  "contact.label"],
    ["#contact .section-title",  "contact.title"],

    // FOOTER
    [".footer-sub",              "footer.sub"],
    [".footer-copy",             "footer.copy"],

    // ERROR PAGES
    [".error-page .btn",         "error.back"]
  ];

  // Indexed arrays: [selector, [key1, key2, ...]]
  var INDEXED_MAP = [
    ["#about .about-text > p:not(.section-label)", ["about.p1", "about.p2", "about.p3"]],
    ["#hours .hours-row .day", ["hours.mon", "hours.tue", "hours.wed", "hours.thu", "hours.fri", "hours.sat", "hours.sun"]],
  ];

  // Service cards: matched by card index
  var SERVICE_KEYS = [
    { title: "services.hookah.title",    desc: "services.hookah.desc" },
    { title: "services.cocktails.title", desc: "services.cocktails.desc" },
    { title: "services.coffee.title",    desc: "services.coffee.desc" },
    { title: "services.games.title",     desc: "services.games.desc" },
    { title: "services.events.title",    desc: "services.events.desc" },
    { title: "services.tobacco.title",   desc: "services.tobacco.desc" },
    { title: "services.tea.title",       desc: "services.tea.desc" },
    { title: "services.lemonade.title",  desc: "services.lemonade.desc" },
  ];

  // Shop cards
  var SHOP_KEYS = [
    { title: "shop.accessories.title", desc: "shop.accessories.desc" },
    { title: "shop.light.title",       desc: "shop.light.desc" },
    { title: "shop.dark.title",        desc: "shop.dark.desc" },
  ];

  // Hours extras
  var EXTRAS_KEYS = [
    { title: "hours.card_title",        desc: "hours.card_desc" },
    { title: "hours.wifi_title",        desc: "hours.wifi_desc" },
    { title: "hours.reservation_title", desc: "hours.reservation_desc" },
    { title: "hours.playstation_title", desc: "hours.playstation_desc" },
    { title: "hours.private_title",     desc: "hours.private_desc" },
    { title: "hours.catering_title",    desc: "hours.catering_desc" },
    { title: "hours.loyalty_title",     desc: "hours.loyalty_desc" },
  ];

  // Contact labels
  var CONTACT_KEYS = ["contact.address", "contact.phone", "contact.email", "contact.social"];

  /* ═══════════════════════════════════════════════
     LANGUAGE DETECTION & URL HELPERS
     ═══════════════════════════════════════════════ */
  var LANG_CODES = Object.keys(LANGS);
  var LANG_REGEX = /^\/(en|de|pl|sigma)(\/|$)/;

  function detectLang() {
    var match = location.pathname.match(LANG_REGEX);
    return match ? match[1] : "cs";
  }

  var currentLang = detectLang();

  function t(key) {
    return (T[currentLang] && T[currentLang][key]) || (T.cs && T.cs[key]) || key;
  }

  function langPrefix() {
    return currentLang === "cs" ? "" : "/" + currentLang;
  }

  /** Strips any existing lang prefix from a path */
  function stripLang(path) {
    return path.replace(LANG_REGEX, "/");
  }

  /** Adds lang prefix to a path for a given language */
  function langPath(lang, path) {
    var clean = stripLang(path || "/");
    if (lang === "cs") return clean;
    if (clean === "/") return "/" + lang;
    return "/" + lang + clean;
  }

  /* ═══════════════════════════════════════════════
     DOM TRANSLATION
     ═══════════════════════════════════════════════ */
  function applyTranslations() {
    if (currentLang === "cs") return; // HTML is already Czech

    document.documentElement.lang = currentLang === "sigma" ? "en" : currentLang;

    // Single selectors
    SINGLE_MAP.forEach(function (pair) {
      if (!pair[1]) return;
      var el = document.querySelector(pair[0]);
      if (el) el.textContent = t(pair[1]);
    });

    // Indexed selectors
    INDEXED_MAP.forEach(function (pair) {
      var els = document.querySelectorAll(pair[0]);
      pair[1].forEach(function (key, i) {
        if (els[i]) els[i].textContent = t(key);
      });
    });

    // Service cards
    var serviceCards = document.querySelectorAll("#services .card");
    SERVICE_KEYS.forEach(function (keys, i) {
      if (!serviceCards[i]) return;
      var h3 = serviceCards[i].querySelector("h3");
      var p = serviceCards[i].querySelector("p");
      if (h3) h3.textContent = t(keys.title);
      if (p) p.textContent = t(keys.desc);
    });

    // Shop cards
    var shopCards = document.querySelectorAll("#shop .shop-card");
    SHOP_KEYS.forEach(function (keys, i) {
      if (!shopCards[i]) return;
      var h3 = shopCards[i].querySelector("h3");
      var p = shopCards[i].querySelector("p");
      if (h3) h3.textContent = t(keys.title);
      if (p) p.textContent = t(keys.desc);
    });

    // Hours extras
    var extraItems = document.querySelectorAll("#hours .extra-item");
    EXTRAS_KEYS.forEach(function (keys, i) {
      if (!extraItems[i]) return;
      var strong = extraItems[i].querySelector("strong");
      var span = extraItems[i].querySelector(".extra-text > span");
      if (strong) strong.textContent = t(keys.title);
      if (span) span.textContent = t(keys.desc);
    });

    // Hours "Zavreno" text
    var closedSpan = document.querySelector("#hours .time.closed");
    if (closedSpan) closedSpan.textContent = t("hours.closed");

    // Contact labels
    var contactItems = document.querySelectorAll("#contact .item");
    CONTACT_KEYS.forEach(function (key, i) {
      if (!contactItems[i]) return;
      var strong = contactItems[i].querySelector("strong");
      if (strong) strong.textContent = t(key);
    });

    // Error pages – translate based on status code
    var errorCode = document.querySelector(".error-code");
    if (errorCode) {
      var status = errorCode.textContent.trim();
      var titleEl = document.querySelector(".error-title");
      var subEl = document.querySelector(".error-sub");
      if (titleEl) titleEl.textContent = t("error." + status + ".title");
      if (subEl) subEl.textContent = t("error." + status + ".sub");
    }

    // Theme toggle button (hero)
    var heroTheme = document.querySelector(".hero-theme-toggle");
    if (heroTheme) {
      var isLight = document.body.classList.contains("light");
      heroTheme.lastChild.textContent = " " + t(isLight ? "hero.theme_light" : "hero.theme_dark");
    }

    // Update nav link hrefs with language prefix
    updateNavLinks();
  }

  function updateNavLinks() {
    var prefix = langPrefix();

    // Nav logo → homepage with lang prefix
    var logo = document.querySelector(".nav-logo");
    if (logo) logo.setAttribute("href", prefix || "/");

    document.querySelectorAll(".nav-links a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;

      // Strip existing lang prefix
      var clean = stripLang(href);
      // For hash links on homepage (/#about) – use /en#about (no slash before #)
      // so the browser path stays /en and relative assets resolve to /
      if (clean.startsWith("/#")) {
        a.setAttribute("href", (prefix || "") + "#" + clean.split("/#")[1]);
      } else if (clean.startsWith("/")) {
        a.setAttribute("href", prefix + clean);
      }
    });

    // Also update hero buttons, footer logo
    document.querySelectorAll(".hero-buttons a, #quizHeroBtn, .galerie-cta a, .galerie-back, .footer-logo a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || href.startsWith("http")) return;
      if (href.startsWith("#")) return;
      var clean = stripLang(href);
      a.setAttribute("href", prefix + clean);
    });
  }

  /* ═══════════════════════════════════════════════
     LANGUAGE PICKER
     ═══════════════════════════════════════════════ */
  function renderLangPicker() {
    var container = document.getElementById("langPicker");
    if (!container) return;

    var current = LANGS[currentLang];

    // Current page path without lang prefix
    var pagePath = stripLang(location.pathname);

    var html =
      '<button class="lang-btn" aria-label="Language">' + current.flag + '<span class="lang-btn-label"> ' + current.name + '</span><span class="lang-chevron">\u25BE</span></button>' +
      '<div class="lang-dropdown">';

    LANG_CODES.forEach(function (code) {
      var l = LANGS[code];
      var active = code === currentLang ? " lang-active" : "";
      var href = langPath(code, pagePath);
      html +=
        '<a href="' + href + '" class="lang-option' + active + '">' +
        '<span class="lang-flag">' + l.flag + "</span> " + l.name +
        "</a>";
    });

    html += "</div>";
    container.innerHTML = html;

    // Toggle dropdown on click
    var btn = container.querySelector(".lang-btn");
    var dropdown = container.querySelector(".lang-dropdown");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.toggle("open");
      container.classList.toggle("lang-picker--open", isOpen);
    });

    // Close on outside click
    document.addEventListener("click", function () {
      dropdown.classList.remove("open");
      container.classList.remove("lang-picker--open");
    });
  }

  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  // Expose globally for galerie.js, kviz.js, script.js
  window.t = t;
  window.langPrefix = langPrefix;
  window.currentLang = currentLang;
  window.SPIRIT_LANGS = LANGS;

  function init() {
    applyTranslations();
    renderLangPicker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
