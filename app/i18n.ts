import { translations } from "./translations";

export type Language = "en" | "sw";
export const LANGUAGE_KEY = "dv_language";
export const isLanguage = (value: unknown): value is Language => value === "en" || value === "sw";

const swahili: Record<string, string> = {
  "File": "Faili", "Upload between 1 and 500 products.": "Pakia kati ya bidhaa 1 na 500.",
  "Use the template with up to 500 products.": "Tumia kiolezo chenye bidhaa zisizozidi 500.",
  "Enter text within the allowed length.": "Weka maandishi yenye urefu unaoruhusiwa.",
  "Use a non-negative whole number within the allowed range.": "Tumia namba nzima isiyo hasi ndani ya kiwango kinachoruhusiwa.",
  "Use a positive whole TZS amount, up to 1 trillion.": "Tumia kiasi chanya cha TZS kisicho na desimali, hadi trilioni 1.",
  "This product name appears more than once in the file.": "Jina hili la bidhaa limerudiwa kwenye faili.",
  "This product already exists in this branch.": "Bidhaa hii tayari ipo katika tawi hili.",
  "Required column is missing.": "Safu inayohitajika haipo.", "A column appears more than once.": "Safu imerudiwa zaidi ya mara moja.",
  "Fix the highlighted rows before importing.": "Sahihisha mistari iliyoonyeshwa kabla ya kupakia.",
  "Branch not found or access denied.": "Tawi halijapatikana au huna ruhusa.", "Authentication required.": "Tafadhali ingia kwenye akaunti.",
  "You do not have permission to import products in this branch.": "Huna ruhusa ya kupakia bidhaa katika tawi hili.",
  "Could not check existing products. Please try again.": "Imeshindikana kukagua bidhaa zilizopo. Tafadhali jaribu tena.",
  "A product already exists. Refresh Inventory and check your file.": "Bidhaa tayari ipo. Pakia upya orodha ya bidhaa na ukague faili lako.",
  "Import failed. No products were added. Check your permissions and try again.": "Upakiaji umeshindikana. Hakuna bidhaa zilizoongezwa. Kagua ruhusa zako na ujaribu tena.",
  "Could not download the template. Please try again.": "Imeshindikana kupakua kiolezo. Tafadhali jaribu tena.",
  "Choose an Excel .xlsx file. Save older .xls files as .xlsx first.": "Chagua faili la Excel .xlsx. Hifadhi faili za zamani za .xls kama .xlsx kwanza.",
  "The file must be 5 MB or smaller.": "Faili lisizidi MB 5.",
  "Could not read this workbook. Use an unprotected .xlsx file and try again.": "Imeshindikana kusoma faili. Tumia faili la .xlsx lisilolindwa kwa nenosiri na ujaribu tena.",
  "Could not confirm the import. Refresh Inventory before retrying to avoid duplicates.": "Imeshindikana kuthibitisha upakiaji. Pakia upya orodha ya bidhaa kabla ya kujaribu tena ili kuepuka marudio.",
  ...Object.fromEntries(Object.values(translations).map(({ en, sw }) => [en, sw])),
  "Stock levels and movement": "Idadi na mabadiliko ya bidhaa", "Sales, stock and movement summaries": "Muhtasari wa mauzo, bidhaa na mabadiliko yake",
  "Need reordering": "Zinahitaji kuagizwa", "Products": "Bidhaa", "Cost value": "Thamani ya ununuzi", "Sell value": "Thamani ya mauzo",
  "Save stock addition": "Hifadhi bidhaa zilizoongezwa", "Stock profit": "Faida ya bidhaa zilizopo", "Create product": "Unda bidhaa", "Ok": "Sawa",
  "Email alerts": "Arifa za barua pepe", "Low stock & daily report": "Bidhaa chache na ripoti ya kila siku",
  "SMS alerts": "Arifa za SMS", "Urgent low-stock warnings": "Tahadhari za haraka za bidhaa chache",
  "Owner summary": "Muhtasari wa mmiliki", "Revenue across branches": "Mapato ya matawi yote", "Select a plan to continue": "Chagua mpango kuendelea",
  "Pesapal · M-Pesa TZ, Airtel Money, Tigo Pesa, Halo Pesa, card": "Pesapal · M-Pesa TZ, Airtel Money, Tigo Pesa, Halo Pesa, kadi",
  "Payment integration coming soon. Please contact support.": "Huduma ya malipo inakuja hivi karibuni. Tafadhali wasiliana na usaidizi.",
  "sale": "Mauzo", "restock": "Kuongeza bidhaa", "adjustment": "Marekebisho", "opening": "Bidhaa za kuanzia",
  "Sale": "Mauzo", "Restock": "Kuongeza bidhaa", "Adjustment": "Marekebisho", "Opening": "Bidhaa za kuanzia",
  "Home": "Nyumbani", "Me": "Wasifu", "Business platform": "Mfumo wa biashara",
  "Close menu": "Funga menyu", "Active business": "Biashara inayotumika", "Main navigation": "Menyu kuu",
  "Notifications": "Arifa", "Signing out…": "Unatoka…", "Toggle theme": "Badili mwonekano",
  "Record and review every transaction": "Rekodi na kagua kila muamala",
  "Branches, staff accounts and subscription": "Matawi, akaunti za wafanyakazi na usajili",
  "restocking": "kuongezwa", "item needs": "bidhaa inahitaji", "items need": "bidhaa zinahitaji",
  "Review →": "Kagua →", "Sales Trend": "Mwenendo wa mauzo", "Last 7 days revenue": "Mapato ya siku 7 zilizopita",
  "Total": "Jumla", "Avg Daily": "Wastani kwa siku", "Transactions": "Miamala", "Stock by Category": "Bidhaa kwa aina",
  "total products": "jumla ya bidhaa", "No products categorized yet": "Hakuna bidhaa zilizopangwa kwa aina bado",
  "units": "vipimo", "Latest transactions": "Miamala ya hivi karibuni", "View all": "Ona zote",
  "No sales recorded yet.": "Hakuna mauzo yaliyorekodiwa bado.", "Record your first sale →": "Rekodi mauzo yako ya kwanza →",
  "units ·": "vipimo ·", "No data yet": "Hakuna taarifa bado", "sold": "zimeuzwa", "Stock attention": "Bidhaa za kuangalia",
  "left": "zimebaki", "Add your first product →": "Ongeza bidhaa yako ya kwanza →", "Revenue": "Mapato", "Profit": "Faida",
  "Search by product or customer…": "Tafuta bidhaa au mteja…", "Record your first sale to see it here.": "Rekodi mauzo yako ya kwanza kuyaona hapa.",
  "Qty": "Idadi", "Unit price": "Bei kwa kipimo", "Time": "Muda", "Status": "Hali",
  "No transactions match your search.": "Hakuna miamala inayolingana na utafutaji wako.", "Record a sale": "Rekodi mauzo",
  "No products found. Add products in Inventory first.": "Hakuna bidhaa. Ongeza bidhaa kwenye orodha kwanza.",
  "Quantity": "Idadi", "Payment method": "Njia ya malipo", "Customer details required for": "Taarifa za mteja zinahitajika kwa",
  "Customer name": "Jina la mteja", "Phone number": "Nambari ya simu", "(optional)": "(si lazima)",
  "Credit sale — record customer for follow-up": "Mauzo ya mkopo — rekodi mteja kwa ufuatiliaji",
  "Who owes this payment?": "Nani anadaiwa malipo haya?", "Profit on this sale": "Faida ya mauzo haya",
  "New product": "Bidhaa mpya", "Add stock": "Ongeza bidhaa zilizopo", "Search…": "Tafuta…",
  "Add your first product to get started.": "Ongeza bidhaa yako ya kwanza kuanza.", "Add product": "Ongeza bidhaa",
  "Cost": "Gharama", "Selling": "Bei ya kuuza", "Profit/unit": "Faida kwa kipimo", "Margin": "Asilimia ya faida",
  "Stock value": "Thamani ya bidhaa", "Reorder": "Kiwango cha kuagiza", "Actions": "Vitendo", "+Stock": "+Bidhaa",
  "Edit product": "Hariri bidhaa", "Delete product": "Futa bidhaa", "No products match your search.": "Hakuna bidhaa zinazolingana na utafutaji wako.",
  "Totals (": "Jumla (", "Quantity received": "Idadi iliyopokelewa", "Note": "Maelezo",
  "Supplier or delivery reference": "Msambazaji au kumbukumbu ya mzigo", "Product name": "Jina la bidhaa",
  "e.g. Kilimanjaro Lager KB": "mf. Kilimanjaro Lager KB", "Enter category name": "Weka jina la aina",
  "Opening stock": "Idadi ya kuanzia", "e.g. 24": "mf. 24", "Cost price (TZS)": "Bei ya kununua (TZS)",
  "Buying price": "Bei ya kununua", "What you pay supplier": "Unachomlipa msambazaji", "Selling price (TZS)": "Bei ya kuuza (TZS)",
  "Customer price": "Bei kwa mteja", "What you charge": "Unachomtoza mteja", "Alert when stock falls below this": "Toa arifa bidhaa zikipungua chini ya kiwango hiki",
  "New profit/unit": "Faida mpya kwa kipimo", "Delete product?": "Futa bidhaa?",
  "This will hide the product from your inventory. Past sales records are kept intact.": "Hii itaficha bidhaa kwenye orodha yako. Rekodi za mauzo ya awali zitahifadhiwa.",
  "Sales breakdown": "Mchanganuo wa mauzo", "Paid and outstanding —": "Yaliyolipwa na yanayodaiwa —",
  "No sales in this period.": "Hakuna mauzo katika kipindi hiki.", "Stock availability": "Upatikanaji wa bidhaa",
  "products ·": "bidhaa ·", "No products yet.": "Hakuna bidhaa bado.", "items need restocking.": "bidhaa zinahitaji kuongezwa.",
  "Reorder before they run out.": "Agiza kabla hazijaisha.", "Stock movement log": "Rekodi ya mabadiliko ya bidhaa",
  "All inventory additions and sales deductions": "Bidhaa zote zilizoongezwa na zilizopunguzwa kwa mauzo",
  "No stock movements yet.": "Hakuna mabadiliko ya bidhaa bado.", "Type": "Aina", "Change": "Mabadiliko",
  "Balance after": "Salio baada ya muamala", "Date & time": "Tarehe na muda", "Owner ·": "Mmiliki ·", "Free trial": "Majaribio bila malipo",
  "Active": "Inatumika", "Inactive": "Haitumiki", "Branch account created — save these credentials now": "Akaunti ya tawi imeundwa — hifadhi taarifa hizi sasa",
  "This password will not be shown again. Share it securely with your staff member.": "Nenosiri hili halitaonyeshwa tena. Mpe mfanyakazi wako kwa njia salama.",
  "Copied!": "Imenakiliwa!", "Copy all credentials": "Nakili taarifa zote za kuingia", "Branches & staff accounts": "Matawi na akaunti za wafanyakazi",
  "of 5 branches · each with its own login": "kati ya matawi 5 · kila moja lina akaunti yake", "No branches yet": "Hakuna matawi bado",
  "Add a branch and create a login for your staff": "Ongeza tawi na uunde akaunti ya mfanyakazi wako", "Add first branch": "Ongeza tawi la kwanza",
  "staff": "wafanyakazi", "No staff account for this branch yet.": "Hakuna akaunti ya mfanyakazi katika tawi hili bado.",
  "Your access": "Ruhusa zako", "Owner · All branches": "Mmiliki · Matawi yote", "Alerts & summaries": "Arifa na muhtasari",
  "Creates the branch and a staff login account in one step": "Unda tawi na akaunti ya mfanyakazi kwa hatua moja",
  "Branch details": "Taarifa za tawi", "Business": "Biashara", "Branch name": "Jina la tawi", "e.g. Mlandege Grocery": "mf. Duka la Mlandege",
  "Location": "Mahali", "Town or area": "Mji au eneo", "Staff login account": "Akaunti ya mfanyakazi",
  "A Supabase auth account will be created. This person can log in at": "Akaunti ya kuingia itaundwa. Mtu huyu anaweza kuingia kwenye",
  "and will only see this branch.": "na ataona tawi hili pekee.", "Staff name": "Jina la mfanyakazi", "Role": "Jukumu",
  "Login email": "Barua pepe ya kuingia", "Login password": "Nenosiri la kuingia", "↻ Regenerate": "↻ Tengeneza upya",
  "Share this with the staff member — they can change it after logging in.": "Mpe mfanyakazi taarifa hii — anaweza kuibadilisha baada ya kuingia.",
  "What can a": "Ruhusa za", "do?": "ni zipi?", "✓ Record sales": "✓ Rekodi mauzo", "✓ Add and update inventory": "✓ Ongeza na sasisha bidhaa",
  "✓ View branch reports": "✓ Ona ripoti za tawi", "✗ Cannot see other branches": "✗ Hawezi kuona matawi mengine",
  "✗ Cannot manage staff": "✗ Hawezi kusimamia wafanyakazi", "✓ View inventory levels": "✓ Ona idadi ya bidhaa",
  "✗ Cannot add or edit products": "✗ Hawezi kuongeza au kuhariri bidhaa", "✓ View stock levels": "✓ Ona idadi ya bidhaa",
  "✗ Cannot record sales": "✗ Hawezi kurekodi mauzo", "Creating branch & account…": "Inaunda tawi na akaunti…",
  "Create branch & staff account": "Unda tawi na akaunti ya mfanyakazi", "Subscription plans": "Mipango ya usajili",
  "Subscribe to keep your account active after the trial.": "Jisajili ili kuendelea kutumia akaunti baada ya majaribio.",
  "Recommended": "Inapendekezwa", "Selected": "Imechaguliwa", "Processing…": "Inachakatwa…",
  "All": "Zote", "Low": "Chache", "OK": "Sawa", "Paid": "Imelipwa", "Not paid": "Haijalipwa", "Bank Transfer": "Uhamisho wa benki",
  "Save sale": "Hifadhi mauzo", "Saving…": "Inahifadhi…", "Save changes": "Hifadhi mabadiliko", "Saving": "Inahifadhi",
  "Deleting…": "Inafuta…", "Close": "Funga", "From": "Kuanzia", "To": "Hadi", "This week": "Wiki hii",
  "Total revenue": "Jumla ya mapato", "Collected": "Yaliyokusanywa", "Received": "Yaliyopokelewa", "Outstanding": "Yanayodaiwa",
  "Not yet paid": "Bado hayajalipwa", "Gross profit": "Faida ghafi", "This period": "Kipindi hiki",
  "Manager": "Meneja", "Cashier": "Mhudumu wa mauzo", "Stock keeper": "Msimamizi wa bidhaa", "Owner": "Mmiliki",
  "Name": "Jina", "Email": "Barua pepe", "Password": "Nenosiri", "Yearly": "Kila mwaka", "3 months": "Miezi 3", "6 months": "Miezi 6",
  "/ month": "/ mwezi", "save 11%": "okoa 11%", "save 17%": "okoa 17%", "best value": "Thamani bora",
  "Beer": "Bia", "Cider": "Sida", "Wine": "Mvinyo", "Spirits": "Pombe kali", "Soft Drink": "Soda", "Water": "Maji",
  "Juice": "Juisi", "Energy Drink": "Kinywaji cha kuongeza nguvu", "Snacks": "Vitafunio", "Tobacco": "Tumbaku",
  "Groceries": "Vyakula", "Dairy": "Maziwa na bidhaa zake", "Bread & Bakery": "Mikate na bidhaa za kuoka",
  "Meat & Fish": "Nyama na samaki", "Household": "Vifaa vya nyumbani", "Personal Care": "Usafi binafsi", "Other": "Nyingine",
  "bottles": "chupa", "cans": "makopo", "packs": "pakiti", "cartons": "katoni", "litres": "lita", "pieces": "vipande", "sachets": "vifuko",
  "Customer name is required for mobile payments.": "Jina la mteja linahitajika kwa malipo ya simu.",
  "Please enter a category.": "Tafadhali weka aina ya bidhaa.", "Cost price must be > 0.": "Bei ya kununua lazima izidi 0.",
  "Selling price must be > 0.": "Bei ya kuuza lazima izidi 0.", "Selling price should be ≥ cost price.": "Bei ya kuuza isipungue bei ya kununua.",
};

export function translate(text: string, language: Language): string {
  if (language === "en") return text;
  const trimmed = text.trim();
  const match = swahili[trimmed];
  if (match) return text.replace(trimmed, match);
  const count = trimmed.match(/^(\d+) (transactions|units on hand|products|units|items)$/);
  if (count) {
    const nouns: Record<string, string> = { transactions: "miamala", "units on hand": "vipimo vilivyopo", products: "bidhaa", units: "vipimo", items: "bidhaa" };
    return `${count[1]} ${nouns[count[2]]}`;
  }
  const today = trimmed.match(/^(\d+) transactions today$/);
  if (today) return `${today[1]} miamala leo`;
  const allTime = trimmed.match(/^(TZS .+) all time$/);
  if (allTime) return `${allTime[1]} tangu mwanzo`;
  const stockCost = trimmed.match(/^Stock cost (TZS .+)$/);
  if (stockCost) return `Gharama ya bidhaa ${stockCost[1]}`;
  const subscription = trimmed.match(/^Subscribe — (.+)$/);
  if (subscription) return `Jisajili — ${subscription[1]}`;
  return text;
}
