/**
 * Tanzania administrative data
 * 31 regions with their districts.
 * Ward/street is a free-text input after selecting district.
 */
export const TANZANIA: Record<string, string[]> = {
  "Arusha": [
    "Arusha City","Arusha District","Karatu","Longido","Meru","Monduli","Ngorongoro"
  ],
  "Dar es Salaam": [
    "Ilala","Kinondoni","Kigamboni","Temeke","Ubungo"
  ],
  "Dodoma": [
    "Bahi","Chamwino","Chemba","Dodoma City","Kondoa","Kongwa","Mpwapwa"
  ],
  "Geita": [
    "Buchosa","Chato","Geita District","Mbogwe","Nyang'hwale"
  ],
  "Iringa": [
    "Iringa District","Iringa Municipal","Kilolo","Mafinga Town","Mufindi"
  ],
  "Kagera": [
    "Biharamulo","Bukoba District","Bukoba Municipal","Karagwe","Kyerwa","Missenyi","Muleba","Ngara"
  ],
  "Katavi": [
    "Mlele","Mpanda District","Mpanda Town"
  ],
  "Kigoma": [
    "Buhigwe","Kakonko","Kasulu District","Kasulu Town","Kibondo","Kigoma District","Kigoma-Ujiji","Uvinza"
  ],
  "Kilimanjaro": [
    "Hai","Moshi District","Moshi Municipal","Mwanga","Rombo","Same","Siha"
  ],
  "Lindi": [
    "Kilwa","Lindi District","Lindi Municipal","Liwale","Nachingwea","Ruangwa"
  ],
  "Manyara": [
    "Babati District","Babati Town","Hanang","Kiteto","Mbulu","Simanjiro"
  ],
  "Mara": [
    "Bunda","Butiama","Musoma District","Musoma Municipal","Rorya","Serengeti","Tarime District","Tarime Town"
  ],
  "Mbeya": [
    "Busokelo","Chunya","Kyela","Mbarali","Mbeya City","Mbeya District","Rungwe"
  ],
  "Morogoro": [
    "Gairo","Kilombero","Kilosa","Malinyi","Mlimba","Morogoro District","Morogoro Municipal","Mvomero","Ulanga"
  ],
  "Mtwara": [
    "Masasi District","Masasi Town","Mtwara District","Mtwara Municipal","Nanyumbu","Newala","Tandahimba"
  ],
  "Mwanza": [
    "Buchosa","Ilemela","Kwimba","Magu","Misungwi","Nyamagana","Sengerema","Ukerewe"
  ],
  "Njombe": [
    "Ludewa","Makambako Town","Makete","Njombe District","Njombe Town","Wanging'ombe"
  ],
  "Pemba North": [
    "Micheweni","Wete"
  ],
  "Pemba South": [
    "Chake-Chake","Mkoani"
  ],
  "Pwani": [
    "Bagamoyo","Kibaha District","Kibaha Town","Kisarawe","Mafia","Mkuranga","Rufiji"
  ],
  "Rukwa": [
    "Kalambo","Nkasi","Sumbawanga District","Sumbawanga Municipal"
  ],
  "Ruvuma": [
    "Mbinga District","Mbinga Town","Namtumbo","Nyasa","Songea District","Songea Municipal","Tunduru"
  ],
  "Shinyanga": [
    "Kahama District","Kahama Town","Kishapu","Shinyanga District","Shinyanga Municipal"
  ],
  "Simiyu": [
    "Bariadi District","Bariadi Town","Busega","Itilima","Maswa","Meatu"
  ],
  "Singida": [
    "Ikungi","Iramba","Manyoni","Mkalama","Singida District","Singida Municipal"
  ],
  "Songwe": [
    "Ileje","Mbozi","Momba","Songwe District"
  ],
  "Tabora": [
    "Igunga","Kaliua","Nzega District","Nzega Town","Sikonge","Tabora Municipal","Urambo","Uyui"
  ],
  "Tanga": [
    "Handeni District","Handeni Town","Kilindi","Korogwe District","Korogwe Town","Lushoto","Mkinga","Muheza","Pangani","Tanga City"
  ],
  "Zanzibar North": [
    "Kaskazini A","Kaskazini B"
  ],
  "Zanzibar South": [
    "Kati","Kusini"
  ],
  "Zanzibar West": [
    "Magharibi","Mjini"
  ],
};

export const REGIONS = Object.keys(TANZANIA).sort();

export function getDistricts(region: string): string[] {
  return TANZANIA[region] ?? [];
}
