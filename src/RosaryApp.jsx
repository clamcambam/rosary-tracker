
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Circle,
  RotateCcw,
  Watch,
  Shield,
  Plus,
  Languages,
  BookOpen,
  Lock,
  MessageSquareText,
  Sparkles,
  Mic2,
  BarChart3,
  History,
  Trophy
} from "lucide-react";

// ------------------------------
// Tracker constants
// ------------------------------
const DAILY_DECADE_GOAL = 15;

const MYSTERIES = [
  { key: "joyful", label: "Joyful" },
  { key: "sorrowful", label: "Sorrowful" },
  { key: "glorious", label: "Glorious" },
  { key: "luminous", label: "Luminous" },
];

const MYSTERY_DECADES = {
  joyful: ["The Annunciation", "The Visitation", "The Nativity", "The Presentation", "The Finding in the Temple"],
  sorrowful: ["The Agony in the Garden", "The Scourging at the Pillar", "The Crowning with Thorns", "The Carrying of the Cross", "The Crucifixion"],
  glorious: ["The Resurrection", "The Ascension", "The Descent of the Holy Spirit", "The Assumption", "The Coronation of Mary"],
  luminous: ["The Baptism of the Lord", "The Wedding Feast at Cana", "The Proclamation of the Kingdom", "The Transfiguration", "The Institution of the Eucharist"],
};

const OPENING_STEPS = [
  "The Apostles’ Creed",
  "1 Our Father (for the intentions of the Pope)",
  "3 Hail Marys (for an increase in Faith, Hope, & Charity)",
  "1 Glory Be",
  "Offer intentions",
];

const CLOSING_STEPS = [
  "Salve Regina (Hail Holy Queen)",
  "V. Pray for us, O holy Mother of God. / R. That we may be made worthy of the promises of Christ.",
  "Rosary Prayer (Let us pray…)",
  "The Memorare",
];

// ------------------------------
// Helpers
// ------------------------------
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' });
}

function suggestedMysteryKeyForToday() {
  const day = new Date().getDay();
  if (day === 0 || day === 3) return "glorious";
  if (day === 1 || day === 6) return "joyful";
  if (day === 2 || day === 5) return "sorrowful";
  return "luminous";
}

function mysteryLabel(key) { return MYSTERIES.find((m) => m.key === key)?.label ?? "Mystery"; }

function emptySet(mystery) {
  return { id: crypto.randomUUID(), createdAt: new Date().toISOString(), mystery, decades: [false, false, false, false, false] };
}

function splitLines(s) { return String(s || "").split("\n"); }

function padTo(lines, targetLen) {
  const out = [...(lines || [])];
  while (out.length < targetLen) out.push("");
  return out;
}

// ------------------------------
// Helper UI Components (Crucial for Prayer Tabs)
// ------------------------------
function LinePair({ original, pron, showPron, pronLabel }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="text-sm text-slate-800 whitespace-pre-line">{original || " "}</div>
      {showPron && pron != null && pron !== "" && (
        <div className="mt-2 text-xs text-slate-600 whitespace-pre-line">
          <span className="font-medium">{pronLabel}: </span>{pron}
        </div>
      )}
    </div>
  );
}

function PrayerBlock({ title, body, pron, showPron, pronLabel }) {
  const lines = splitLines(body);
  const pronLines = pron ? padTo(pron, lines.length) : null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="font-medium mb-2">{title}</div>
      <div className="space-y-2">
        {lines.map((ln, idx) => (
          <LinePair key={idx} original={ln} pron={pronLines ? pronLines[idx] : null} showPron={showPron} pronLabel={pronLabel} />
        ))}
      </div>
    </div>
  );
}

// ------------------------------
// Prayer Library Data
// ------------------------------
const PRAYERS = {
  apostles_creed: {
    title: "Apostles’ Creed",
    text: {
      en: "I believe in God, the Father almighty, Creator of heaven and earth.\n\nI believe in Jesus Christ, His only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; He descended into hell; on the third day He rose again from the dead; He ascended into heaven, and is seated at the right hand of God the Father almighty; from there He will come to judge the living and the dead.\n\nI believe in the Holy Spirit, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.",
      la: "Credo in Deum, Patrem omnipotentem, Creatorem caeli et terrae.\n\nEt in Iesum Christum, Filium Eius unicum, Dominum nostrum, qui conceptus est de Spiritu Sancto, natus ex Maria Virgine, passus sub Pontio Pilato, crucifixus, mortuus et sepultus; descendit ad inferos; tertia die resurrexit a mortuis; ascendit ad caelos; sedet ad dexteram Dei Patris omnipotentis; inde venturus est iudicare vivos et mortuos.\n\nCredo in Spiritum Sanctum, sanctam Ecclesiam catholicam, sanctorum communionem, remissionem peccatorum, carnis resurrectionem, vitam aeternam. Amen.",
      pl: "Wierzę w Boga, Ojca Wszechmogącego, Stworzyciela nieba i ziemi.\n\nI w Jezusa Chrystusa, Syna Jego Jedynego, Pana naszego, który się począł z Ducha Świętego, narodził się z Maryi Panny, umęczon pod Ponckim Piłatem, ukrzyżowan, umarł i pogrzebion; zstąpił do piekieł; trzeciego dnia zmartwychwstał; wstąpił na niebiosa, siedzi po prawicy Boga Ojca Wszechmogącego; stamtąd przyjdzie sądzić żywych i umarłych.\n\nWierzę w Ducha Świętego, święty Kościół powszechny, Świętych obcowanie, grzechów odpuszczenie, ciała zmartwychwstanie, żywot wieczny. Amen."
    },
    pron: {
      la: { simple: ["KREH-doh een DEH-oom, PAH-trehm ohm-nee-poh-TEN-tehm, kreh-ah-TOH-rehm CHEH-lee et TEH-ray.", "Et een YEH-soom KRIS-toom, FEE-lee-oom EH-yoos oo-NEE-koom, DOH-mee-noom NOH-stroom, kwee kon-CHEP-toos est deh SPEE-ree-too SAHNK-toh, NAH-toos eks mah-REE-ah VEER-jee-neh, PAHS-soos soob POHN-tsyoh pee-LAH-toh, kroo-chee-FEEK-soos, MOR-too-oos et seh-POOL-toos; deh-SHEN-deet ahd een-FEH-rohs; TEHR-tsy-ah DEE-eh reh-soor-REK-seet ah MOR-too-ees; ah-SHEN-deet ahd CHEH-lohs; SEH-det ahd DEKS-teh-rahm DEH-ee PAH-trees ohm-nee-poh-TEN-tees; EEN-deh ven-TOO-roos est yoo-dee-KAH-reh VEE-vohs et MOR-too-ohs.", "KREH-doh een SPEE-ree-too SAHNK-toh, SAHNK-tahm ek-KLEH-zy-ahm kah-TOH-lee-kahm, sahnk-TOH-room kohm-moo-nee-OH-nehm, reh-mees-sy-OH-nehm pek-kah-TOH-room, KAHR-nees reh-soor-rek-tsy-OH-nehm, VEE-tahm ay-TEHR-nahm. AH-men."] },
      pl: { simple: ["VYEH-sheh v BOH-gah, OY-tsah fsheh-moh-GON-tseh-goh, stvoh-shih-CHYEH-lah NYEH-bah ee ZYEH-mee.", "ee v yeh-ZOO-sah KRIS-too-sah, SIH-nah YEH-goh yeh-DIH-neh-goh, PAH-nah NAH-sheh-goh, KTOO-rih sheh POHN-chahv z DOO-hah shvyen-TEH-goh, nah-ROH-dzeew sheh z mah-RIH-ee PAHN-nih, oo-MEN-chon pohd POHN-tskeem pee-WAH-tem, oo-kshih-ZHOH-vahn, OO-mahw ee poh-GZHEH-byohn; ZSTEHM-peew doh pyeh-KYEW; TSHEH-chyeh-goh DNYA zmarr-tvih-VSTAHW; vstehm-PEEW nah nyeh-BYOH-sah, SHYEH-dzeeh poh prah-VEE-tsih BOH-gah OY-tsah fsheh-moh-GON-tseh-goh; STAHM-tohd PSHI-dyehs SOHN-dzeech ZHIH-vih-kh ee oo-MAHR-wih-kh.", "VYEH-sheh v DOO-khah shvyen-TEH-goh, SHVYEN-tih koh-SHCHOOW pov-SHEKH-nih, SHVYEN-tihkh op-TSOH-vah-nyeh, GZHEH-khoov odp-OOSH-cheh-nyeh, CHYAH-wah zmarr-tvih-vstah-NYEH, ZHIH-vott VYEKH-nih. AH-men."] }
    }
  },
  our_father: {
    title: "Our Father",
    text: {
      en: "Our Father, who art in heaven, hallowed be Thy name; Thy kingdom come; Thy will be done on earth as it is in heaven.\nGive us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.",
      la: "Pater noster, qui es in caelis, sanctificetur nomen tuum; adveniat regnum tuum; fiat voluntas tua, sicut in caelo et in terra.\nPanem nostrum quotidianum da nobis hodie; et dimitte nobis debita nostra sicut et nos dimittimus debitoribus nostris; et ne nos inducas in tentationem; sed libera nos a malo. Amen.",
      pl: "Ojcze nasz, któryś jest w niebie, święć się Imię Twoje; przyjdź królestwo Twoje; bądź wola Twoja jako w niebie tak i na ziemi.\nChleba naszego powszedniego daj nam dzisiaj; i odpuść nam nasze winy, jako i my odpuszczamy naszym winowajcom; i nie wódź nas na pokuszenie, ale nas zbaw ode złego. Amen."
    },
    pron: {
      la: { simple: ["PAH-tehr NOH-stehr, kwee es een CHEH-lees; sahnk-tee-fee-CHEH-toor NOH-mehn TOO-oom; ahd-VEH-nee-aht REH-nyoom TOO-oom; FEE-aht voh-LOON-tahs TOO-ah, SEE-koot een CHEH-loh et een TEH-rah.", "PAH-nehm NOH-stroom kwoh-tee-dee-AH-noom dah NOH-bees HOH-dee-eh; et DEE-meet-teh NOH-bees DEH-bee-tah NOH-strah SEE-koot et nohs dee-MEET-tee-moos deh-bee-TOH-ree-boos NOH-strees; et neh nohs een-DOO-kahs een ten-tah-TSYOH-nem; sed LEE-beh-rah NOHS ah MAH-loh. AH-men."] },
      pl: { simple: ["OY-cheh nahsh, KTOO-rish yest f NYEH-byeh, SHFYENCH shee EE-myeh TVOH-yeh; pshyidsh KROO-lest-voh TVOH-yeh; boonth VOH-lah TVOH-yah YAH-koh f NYEH-byeh tahk ee nah ZYEH-mee.", "HLEH-bah NAH-sheh-goh pof-SHEHD-nyeh-goh dahy nahm DZYE-syahy; ee odp-OOSHCH nahm NAH-sheh VEE-nih, YAH-koh ee mih odp-OOSHCH-ah-my NAH-shim vee-no-VAI-tsohm; ee nyeh VOODZ nahs nah poh-KOO-sheh-nyeh, AH-leh nahs ZBAHV ohd ZWEH-goh. AH-men."] }
    }
  },
  hail_mary: {
    title: "Hail Mary",
    text: {
      en: "Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus.\nHoly Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.",
      la: "Ave Maria, gratia plena, Dominus tecum. Benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus.\nSancta Maria, Mater Dei, ora pro nobis peccatoribus, nunc et in hora mortis nostrae. Amen.",
      pl: "Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego, Jezus.\nŚwięta Maryjo, Matko Boża, módl się za nami grzesznymi, teraz i w godzinę śmierci naszej. Amen."
    },
    pron: {
      la: { simple: ["AH-veh mah-REE-ah, GRAH-tsee-ah PLEH-nah, DOH-mee-noos TEH-koom. beh-neh-DEEK-tah too een moo-lee-EH-ree-boos, et beh-neh-DEEK-toos FROOK-toos VEN-treehs TOO-ee, YEH-soos.", "SAHNK-tah mah-REE-ah, MAH-tehr DEH-ee, OH-rah proh NOH-bees pehk-kah-TOH-ree-boos, NOONK et een OH-rah MOR-tees NOH-streh. AH-men."] },
      pl: { simple: ["ZDROH-vash mah-RYOH, WAH-skee PEHW-nah, pahn z toh-BOH, bwoh-go-swah-VYOH-nahsh tih MYEHN-jih nyeh-VYAH-stah-mee ee bwoh-go-swah-VYOH-nih OH-vots zhih-VOH-tah tvOH-YEH-goh, YEH-zoos.", "SHVYEN-tah mah-RYOH-yo, MAHT-koh BOH-zhah, moodl sheh zah NAH-mee GZHEH-shnih-mee, TEH-rahz ee f goh-DZEE-neh SHMYER-chih NAH-shey. AH-men."] }
    }
  },
  glory_be: {
    title: "Glory Be",
    text: {
      en: "Glory be to the Father, and to the Son, and to the Holy Spirit,\nas it was in the beginning, is now, and ever shall be, world without end. Amen.",
      la: "Gloria Patri, et Filio, et Spiritui Sancto,\nsicut erat in principio, et nunc, et semper, et in saecula saeculorum. Amen.",
      pl: "Chwała Ojcu i Synowi, i Duchowi Świętemu,\njak była na początku, teraz i zawsze, i na wieki wieków. Amen."
    },
    pron: {
      la: { simple: ["GLOH-ree-ah PAH-tree, et FEE-lee-oh, et SPEE-ree-too-ee SAHNK-toh,", "SEE-koot EH-raht een preen-CHEE-pee-oh, et NOONK, et SEHM-pehr, et een SAY-koo-lah say-koo-LOH-room. AH-men."] },
      pl: { simple: ["HFWAH-wah OY-tsoo ee si-NOH-vee, ee doo-HOH-vee SHVYEN-teh-moo,", "yahk BY-wah nah poh-CHON-tkoo, TEH-rahz ee ZAHF-sheh, ee nah VYEH-kee VYEH-koov. AH-men."] }
    }
  },
  fatima: {
    title: "Fatima Prayer",
    text: {
      en: "O my Jesus, forgive us our sins, save us from the fires of hell; lead all souls to Heaven, especially those most in need of Thy mercy. Amen.",
      la: "O Mi Iesu, dimitte nobis debita nostra, libera nos ab igne inferni, conduc in caelum omnes animas, praesertim illas quae maxime indigent misericordia tua. Amen.",
      pl: "O mój Jezu, przebacz nam nasze grzechy, zachowaj nas od ognia piekielnego, zaprowadź wszystkie dusze do nieba i dopomóż szczególnie tym, którzy najbardziej potrzebują Twojego miłosierdzia. Amen."
    },
    pron: {
      la: { simple: ["OH mee YEH-soo, DEE-meet-teh NOH-bees DEH-bee-tah NOH-strah, LEE-beh-rah NOHS ahb EEN-yeh een-FEHR-nee, KON-dook een CHEH-loom OM-nehss AH-nee-mahs, pray-SEHR-teem EEL-lahs KWEH MAHK-see-meh een-DEH-jent mee-zeh-ree-KOR-dee-ah TOO-ah. AH-men."] },
      pl: { simple: ["OH mooy YEH-zoo, pshe-BAHTCH nahm NAH-sheh GZHEH-hih, zah-hoh-VAI nahs ohd OH-nyah pyeh-KYEHL-neh-goh, zah-PROH-vahdsh FSHIH-stkee DOO-sheh doh NYEH-bah ee doh-POH-moosh shcheh-GOO-lyeh tihm, KTOO-zhih bar-DZYEY pɔt-sheh-BOO-yon TVOH-yeh-goh mee-WOH-shyehr-DZYAH. AH-men."] }
    }
  },
  hail_holy_queen: {
    title: "Hail Holy Queen (Salve Regina)",
    text: {
      en: "Hail, holy Queen, Mother of mercy, our life, our sweetness, and our hope.\nTo thee do we cry, poor banished children of Eve.\nTo thee do we send up our sighs, mourning and weeping in this valley of tears.\nTurn then, most gracious Advocate, thine eyes of mercy toward us,\nand after this our exile, show unto us the blessed fruit of thy womb, Jesus.\nO clement, O loving, O sweet Virgin Mary.",
      la: "Salve, Regina, Mater misericordiae, vita, dulcedo, et spes nostra, salve.\nAd te clamamus, exsules filii Hevae.\nAd te suspiramus, gementes et flentes in hac lacrimarum valle.\nEia ergo, Advocata nostra, illos tuos misericordes oculos ad nos converte;\net Iesum, benedictum fructum ventris tui, nobis post hoc exsilium ostende.\nO clemens, O pia, O dulcis Virgo Maria.",
      pl: "Witaj Królowo, Matko miłosierdzia, życie, słodyczy i nadziejo nasza, witaj!\nDo Ciebie wołamy, wygnańcy, synowie Ewy;\nDo Ciebie wzdychamy, jęcząc i płacząc na tym łez padole.\nPrzeto Orędowniczko nasza, one miłosierne oczy Twoje na nas zwróć;\na Jezusa, błogosławiony owoc żywota Twojego, po tym wygnaniu nam okaż.\nO łaskawa, o litościwa, o słodka Panno Maryjo!"
    },
    pron: {
      la: { simple: ["SAHL-veh reh-JEE-nah, MAH-tehr mee-zeh-ree-KOR-dee-eh, VEE-tah, dool-CHEH-doh, et spehs NOH-strah, SAHL-veh.", "AHD teh KLAH-mah-moos, eks-SOO-lehs FEE-lee-ee HEH-veh.", "AHD teh soos-pee-RAH-moos, jeh-MEN-tehs et FLEN-tehs een hahk lah-kree-MAH-room VAHL-leh.", "EH-yah ER-goh, ahd-voh-KAH-tah NOH-strah, EEL-lohs TOO-ohs mee-zeh-ree-KOR-dehs OH-koo-lohs ahd nohs kon-VEHR-teh;", "et YEH-soom, beh-neh-DEEK-toom FROOK-toom VEN-treehs TOO-ee, NOH-bees post hok eks-SEE-lee-oom oh-STEN-deh.", "OH KLEH-mehns, OH PEE-ah, OH DOOL-chis VEER-goh mah-REE-ah."] },
      pl: { simple: ["VEE-tahy kroo-LOH-voh, MAHT-koh mee-wo-SHYER-dzyah, ZHIH-cheh, swo-DIH-chih ee nah-DZYEH-yoh NAH-shah, VEE-tahy!", "Doh CHYEH-byeh voh-WAH-mih, vihg-NAHN-tsih, si-NOH-vyeh EH-vih;", "Doh CHYEH-byeh vzdih-KHAH-mih, YEN-chont ee PWAH-chont nah tihm wez pah-DOH-leh.", "PSHEH-toh oh-rehn-DOOV-neech-koh NAH-shah, OH-neh mee-wo-SHYER-neh OH-chih TVOH-yeh nah nahs ZVROOTCH;", "Ah yeh-ZOO-sah, bwo-go-swah-VYOH-nih OH-vots zhih-VOH-tah TVOH-yeh-goh, poh tihm vihg-NAH-nyoo nahm OH-kazh.", "OH wah-SKAH-vah, oh lee-toh-SHCHEE-vah, oh SWOHT-kah PAHN-noh mah-RYO!"] }
    }
  },
  vr: {
    title: "V/R (Versicle & Response)",
    text: {
      en: "V. Pray for us, O holy Mother of God.\nR. That we may be made worthy of the promises of Christ.",
      la: "V. Ora pro nobis, sancta Dei Genetrix.\nR. Ut digni efficiamur promissionibus Christi.",
      pl: "V. Módl się za nami, święta Boża Rodzicielko.\nR. Abyśmy się stali godnymi obietnic Chrystusowych."
    },
    pron: {
      la: { simple: ["OH-rah proh NOH-bees, SAHNK-tah DEH-ee jeh-NEH-triks.", "OOT DEEN-yee eh-FEE-chee-AH-moor proh-mee-SSYOH-nee-boos KRIS-tee."] },
      pl: { simple: ["MOODL sheh zah NAH-mee, SHVYEN-tah BOH-zhah roh-dzee-CHYEHL-koh.", "ah-BISH-mih sheh STAH-lee gohd-NIH-mee oh-BYET-neech khris-too-SOH-vikh."] }
    }
  },
  rosary_prayer: {
    title: "Rosary Prayer (Let us pray…)",
    text: {
      en: "Let us pray. O God, whose only begotten Son, by His life, death, and resurrection, has purchased for us the rewards of eternal life, grant, we beseech Thee, that meditating upon these mysteries of the Most Holy Rosary of the Blessed Virgin Mary, we may imitate what they contain and obtain what they promise, through the same Christ our Lord. Amen.",
      la: "Oremus. Deus, cuius Unigenitus per vitam, mortem et resurrectionem suam nobis salutis aeternae praemia comparavit: concede, quaesumus; ut haec mysteria sacratissimo beatae Mariae Virginis Rosario recolentes, et imitemur quod continent, et quod promittunt assequamur. Per eundem Christum Dominum nostrum. Amen.",
      pl: "Módlmy się. Boże, którego Jednorodzony Syn przez swoje życie, śmierć i zmartwychwstanie wysłużył nam nagrodę życia wiecznego, spraw, prosimy, abyśmy rozważając te tajemnice Najświętszego Różańca Najświętszej Maryi Panny, naśladowali to, co zawierają, i osiągnęli to, co obiecują. Przez tegoż Chrystusa, Pana naszego. Amen."
    },
    pron: {
      la: { simple: ["oh-REH-moos.", "DEH-oos, KOO-yoos oo-nee-jeh-NEE-toos pehr VEE-tahm, MOR-tehm et reh-soo-rek-tsyOH-nehm SOO-ahm NOH-bees sah-LOO-tees eh-TEHR-neh PREH-mee-ah kom-PAH-rah-veet: kon-CHEH-deh, kweh-SOO-moos; oot hehk mis-TEH-ree-ah sah-krah-TISS-ee-mo beh-AH-teh mah-REE-eh VEER-jee-nees roh-SAH-ree-oh reh-koh-LEN-tehs, et ee-mee-TEH-moor kwod kon-TEH-nehnt, et kwod proh-MEET-toont ah-SSEH-kwah-moor.", "pehr EH-oon-dehm KRIS-toom DOH-mee-noom NOH-stroom. AH-men."] },
      pl: { simple: ["MOODL-mih sheh. BOH-zheh, ktoh-REH-goh yeh-dno-roh-DZOH-nih SIHN pshesh SVO-yeh ZHIH-cheh, SHMYERTCH ee zmarr-tvih-VSTAH-nyeh vih-SWOO-zhihw nahm nah-GROH-deh ZHIH-chah vyekh-NEH-goh, SPRAHF, proh-SHEE-mih, ah-BISH-mih roz-vah-ZHAY-onts TEH tah-yehm-NEE-tseh nay-SHVYEN-tsheh-goh roo-ZHAYN-tsah nay-SHVYEN-tshey mah-RYEE PAHN-nih, nash-lah-DOH-vah-lee TOH, tso zah-VYEH-rah-yonts, ee oh-SHYOHN-gnyeh-lee TOH, tso oh-BYE-tsoo-yonts. Pshez TEH-gozh KHRIS-too-sah, PAH-nah NAH-sheh-goh. AH-men."] }
    }
  },
  memorare: {
    title: "The Memorare",
    text: {
      en: "Remember, O most gracious Virgin Mary, that never was it known that anyone who fled to thy protection, implored thy help, or sought thy intercession, was left unaided. Inspired by this confidence, I fly unto thee, O Virgin of virgins, my Mother; to thee do I come, before thee I stand, sinful and sorrowful. O Mother of the Word Incarnate, despise not my petitions, but in thy mercy hear and answer me. Amen.",
      la: "Memorare, o piissima Virgo Maria, non esse auditum a saeculo quemquam ad tua currentem praesidia, tua implorantem auxilia, tua petentem suffragia, esse derelictum.\nEgo tali animatus confidentia, ad te, Virgo Virginum, Mater, curro; ad te venio; coram te gemens peccator assisto.\nNoli, Mater Verbi, verba mea despicere; sed audi propitia et exaudi. Amen.",
      pl: "Pomnij, o Najświętsza Panno Maryjo, że nigdy nie słyszano, aby ktokolwiek, kto się do Twej opieki uciekał, Twej pomocy wzywał, Ciebie o przyczynę prosił, miał być przez Ciebie opuszczony.\nTą ufnością ożywiony, do Ciebie, o Panno nad pannami i Matko, biegnę; do Ciebie przychodzę; przed Tobą staję jako grzesznik żałujący.\nO Matko Słowa Wcielonego, nie gardź słowami moimi, ale usłysz je łaskawie i wysłuchaj. Amen."
    },
    pron: {
      la: { simple: ["meh-moh-RAH-reh, oh pee-ISS-ee-mah VEER-goh mah-REE-ah, non ESS-eh ow-DEE-toom ah SAY-koo-loh KWEHM-kwahm ahd TOO-ah KOO-ren-tehm preh-SIH-dee-ah, TOO-ah eem-ploh-RAHN-tehm owk-SIH-lee-ah, TOO-ah peh-TEN-tehm soof-FRAH-jee-ah, ESS-eh deh-REH-lee-ktoom.", "EH-go TAH-lee ah-nee-MAH-toos kon-fee-DEN-tsee-ah, ahd teh, VEER-goh VEER-jee-noom, MAH-tehr, KOO-roh; ahd teh VEH-nee-oh; KOH-rahm teh JEH-mehns PEHK-kah-tohr ah-SSIS-toh.", "NOH-lee, MAH-tehr VEHR-bee, VEHR-bah MEH-ah deh-SPEE-cheh-reh; sed OW-dee proh-PEE-tsee-ah et eks-OW-dee. AH-men."] },
      pl: { simple: ["POHM-neey, oh nay-SHVYEN-tshah PAHN-noh mah-RYO, zheh NEE-gdih nyeh swih-SHAH-no, ah-bih KTOH-kohl-vyek, ktoh sheh doh TVEY oh-PYEH-kee oo-CHYEH-kahw, TVEY poh-MOH-tsih VZII-vaw, CHYEH-byeh oh pshih-CHIH-neh PROH-sheew, MYAHW bihtch pshez CHYEH-byeh oh-poosh-CHOH-nih.", "TOH oo-FNOH-shchyon oh-zhih-VYOH-nih, doh CHYEH-byeh, oh PAHN-noh nahd pah-NAH-mee ee MAHT-koh, BYE-gneh; doh CHYEH-byeh pshih-KHOH-dzeh; pshed TOH-boh STAH-yeh YAH-koh GZHEH-shneek zhah-WOO-yonts.", "OH MAHT-koh SWO-vah fchyeh-LOH-neh-goh, nyeh GAHRDZ swo-VAH-mee MO-ee-mee, ah-leh oo-SWIH-sh yeh wah-SKAH-vyeh ee vih-SWOO-khahy. AH-men."] }
    }
  },
  angelus: {
    title: "The Angelus",
    text: {
      en: "V. The Angel of the Lord declared unto Mary.\nR. And she conceived of the Holy Spirit.\n\nHail Mary…\n\nV. Behold the handmaid of the Lord.\nR. Be it done unto me according to thy word.\n\nHail Mary…\n\nV. And the Word was made flesh.\nR. And dwelt among us.\n\nHail Mary…\n\nV. Pray for us, O holy Mother of God.\nR. That we may be made worthy of the promises of Christ.\n\nLet us pray.\nPour forth, we beseech Thee, O Lord, Thy grace into our hearts, that we, to whom the Incarnation of Christ, Thy Son, was made known by the message of an angel, may by His Passion and Cross be brought to the glory of His Resurrection. Through the same Christ our Lord. Amen.",
      la: "V. Angelus Domini nuntiavit Mariae.\nR. Et concepit de Spiritu Sancto.\n\nAve Maria…\n\nV. Ecce ancilla Domini.\nR. Fiat mihi secundum verbum tuum.\n\nAve Maria…\n\nV. Et Verbum caro factum est.\nR. Et habitavit in nobis.\n\nAve Maria…\n\nV. Ora pro nobis, sancta Dei Genetrix.\nR. Ut digni efficiamur promissionibus Christi.\n\nOremus.\nGratiam tuam, quaesumus, Domine, mentibus nostris infunde; ut qui, Angelo nuntiante, Christi Filii tui incarnationem cognovimus, per passionem eius et crucem ad resurrectionis gloriam perducamur. Per eundem Christum Dominum nostrum. Amen.",
      pl: "V. Anioł Pański zwiastował Pannie Maryi.\nR. I poczęła z Ducha Świętego.\n\nZdrowaś Maryjo…\n\nV. Oto ja służebnica Pańska.\nR. Niech mi się stanie według słowa twego.\n\nZdrowaś Maryjo…\n\nV. A Słowo Ciałem się stało.\nR. I mieszkało między nami.\n\nZdrowaś Maryjo…\n\nV. Módl się za nami, Święta Boża Rodzicielko.\nR. Abyśmy się stali godnymi obietnic Chrystusowych."
    },
    pron: {
      la: { simple: ["AHN-jeh-loos DOH-mee-nee noon-tsy-AH-veet mah-REE-ay.", "Et kon-CHEP-eet deh SPEE-ree-too SAHNK-toh.", "", "EH-cheh ahn-CHIL-lah DOH-mee-nee.", "FEE-aht MEE-kee seh-KOON-doom VEHR-boom TOO-oom.", "", "Et VEHR-boom KAH-roh FAK-toom est.", "Et ah-bee-TAH-veet een NOH-bees.", "", "OH-rah proh NOH-bees, SAHNK-tah DEH-ee JEH-neh-triks.", "OOT DEEN-yee eh-fee-chy-AH-moor proh-mee-sy-OH-nee-boos KRIS-tee.", "", "oh-REH-moos.", "GRAH-tsy-ahm TOO-ahm, kway-SOO-moos, DOH-mee-neh, MEN-tee-boos NOH-strees een-FOON-deh; oot kwee, AHN-jeh-loh noon-tsy-AHN-teh, KRIS-tee FEE-lee-ee TOO-ee een-kar-nah-tsy-OH-nehm kon-YOH-vee-moos, pehr pah-sy-OH-nehm EH-yoos et KROO-chem ahd reh-soor-rek-tsy-OH-nees GLOH-ry-ahm pehr-doo-KAH-moor. Pehr eh-OON-dehm KRIS-toom DOH-mee-noom NOH-stroom. AH-men."] },
      pl: { simple: ["AH-nyow PAH-ny-skee zv-yah-STOH-vow PAHN-nyeh mah-RYE-ee.", "ee poh-CHEH-wah z DOO-khah sh-vyen-TEH-goh.", "", "OH-toh yah swoo-zheh-BNEE-tsah PAHN-skah.", "nye-kh me shye STAH-nyeh VEH-dwoog SWO-vah TVEH-goh.", "", "ah SWO-voh CHYAH-wem sheh STAH-wo.", "ee mye-SHKAH-wo m-YEHND-zih NAH-mee.", "", "MOODL shye zah NAH-mee, SH-vyen-tah BOH-zhah roh-dze-CHYEH-l-koh.", "ah-BISH-me shye STAH-lee gohd-NIH-me oh-BYET-neech khris-too-SOH-vihkh."] }
    }
  },
  before_meals: {
    title: "Prayer Before Meals",
    text: {
      en: "Bless us, O Lord, and these Thy gifts, which we are about to receive from Thy bounty, through Christ our Lord. Amen.",
      la: "Benedic, Domine, nos et haec tua dona, quae de tua largitate sumus sumpturi. Per Christum Dominum nostrum. Amen.",
      pl: "Pobłogosław Panie Boże nas i te dary, które z Twojej hojności spożywać mamy. Przez Chrystusa Pana naszego. Amen."
    },
    pron: {
      la: { simple: ["BEH-neh-deek, DOH-mee-neh, nohs et hehk TOO-ah DOH-nah, kway deh TOO-ah lar-jee-TAH-teh SOO-moos soomp-TOO-ree. Pehr KRIS-toom DOH-mee-noom NOH-stroom. AH-men."] },
      pl: { simple: ["poh-bwo-goh-SWAHV PAH-nyeh BOH-zheh nahs ee teh DAH-rih, KTOH-reh z TVO-yey hoy-NOH-shchee spo-ZHIH-vatch MAH-mih. Pshez KHRIS-too-sah PAH-nah NAH-sheh-goh. AH-men."] }
    }
  },
  after_meals: {
    title: "Prayer After Meals",
    text: {
      en: "We give Thee thanks for all Thy benefits, Almighty God, who livest and reignest forever. Amen.\nMay the souls of the faithful departed, through the mercy of God, rest in peace. Amen.",
      la: "Agimus tibi gratias pro universis beneficiis tuis, omnipotens Deus, qui vivis et regnas in saecula saeculorum. Amen.\nFidelium animae, per misericordiam Dei, requiescant in pace. Amen.",
      pl: "Dzięki Ci Boże za te i wszystkie dary, któreśmy otrzymali z Twojej hojności. Przez Chrystusa Pana naszego. Amen.\nWieczny odpoczynek racz im dać Panie, a światłość wiekuista niechaj im świeci. Niech odpoczywają w pokoju. Amen."
    },
    pron: {
      la: { simple: ["AH-jee-moos TEE-bee GRAH-tsy-ahs pro oo-nee-VEHR-sees beh-neh-FEE-chy-ees TOO-ees, ohm-NEE-poh-tens DEH-oos, kwee VEE-vees et REH-nyahs een SAY-koo-lah say-koo-LOH-room. AH-men.", "fee-DEH-lee-oom AH-nee-may, pehr mee-zeh-ree-KOR-dy-ahm DEH-ee, reh-kwee-ES-kahnt een PAH-cheh. AH-men."] },
      pl: { simple: ["DZYEN-kee Chye BOH-zheh zah teh ee FSHIH-stkyeh DAH-rih, KTOH-reh-shmih oh-tshih-MAH-lee z TVO-yey hoy-NOH-shchee. Pshez KHRIS-too-sah PAH-nah NAH-sheh-goh. AH-men.", "VYEKH-nih ohd-poh-CHIH-nehk RAHTCH eem DAHTCH PAH-nyeh, ah SHVYAT-woshch vyeh-koo-EES-tah NYE-khahy eem SHVYET-chee. NYE-khahy ohd-poh-CHIH-vah-yoh f poh-KO-yoo. AH-men."] }
    }
  },
  contrition: {
    title: "Act of Contrition (long)",
    text: {
      en: "O my God, I am heartily sorry for having offended Thee, and I detest all my sins because I dread the loss of heaven and the pains of hell, but most of all because they offend Thee, my God, who art all-good and deserving of all my love. I firmly resolve, with the help of Thy grace, to confess my sins, to do penance, and to amend my life. Amen.",
      la: "Deus meus, ex toto corde paenitet me omnium peccatorum meorum, eaque detestor, quia peccando non solum poenas a te iuste statutas promeritus sum, sed praesertim quia offendi te, summum bonum ac dignum, qui super omnia diligaris.\nIdeo firmiter propono, adiuvante gratia tua, de cetero me non peccaturum, peccandique occasiones proximas fugiturum. Amen.",
      pl: "Boże mój, żałuję z całego serca za grzechy moje i brzydzę się nimi, ponieważ obraziłem Ciebie, najwyższe dobro i najbardziej godne miłości.\nPostanawiam mocno z pomocą łaski Twojej poprawę życia, unikać okazji do grzechu i czynić pokutę. Amen."
    },
    pron: {
      la: { simple: ["DEH-oos MEH-oos, eks TOH-toh KOR-deh PEH-nee-tet meh OHM-nee-oom pek-kah-TOH-room meh-OH-room, ay-AH-kway deh-TES-tor, KWY-ah pek-KAHN-doh nohn SOH-loom PAY-nahs ah teh YOOS-teh stah-TOO-tahs pro-MEH-ree-toos soom, sed pry-SEHR-teem KWY-ah of-FEN-dee teh, SOOM-moom BOH-noom ahk DEEN-yoom, kwee SOO-pehr OHM-nyah dee-LEE-gah-rees.", "ee-DEH-oh FEER-mee-tehr pro-POH-noh, ad-yoo-VAHN-teh GRAH-tsy-ah TOO-ah, deh CHEH-teh-roh meh nohn pek-kah-TOO-room, pek-kahn-DEE-kway ok-kah-zy-OH-nehs PROK-see-mahs foo-jee-TOO-room. AH-men."] },
      pl: { simple: ["BOH-zheh mooy, zhah-WOO-yeh z tsah-WEH-goh SEHR-tsah zah GZHEH-khy MO-yeh ee BZHIH-dzeh sheh NYEE-mee, pon-yeh-VAH-sh ob-rah-ZEE-wem CHYE-bye, nay-VISH-sheh DOH-bro ee nay-BAHR-dzey GOH-dneh mee-WOH-shchee.", "pos-tah-NAH-vyahm MOTS-no z poh-MOH-tson WAH-skee TVO-yey poh-PRAH-veh ZHIH-chah, oo-NYE-katch oh-KAH-zyee doh GZHEH-khoo ee CHY-neetch poh-KOO-teh. AH-men."] }
    }
  }
};

const ROSARY_PRAYER_KEYS = ["apostles_creed", "our_father", "hail_mary", "glory_be", "fatima", "hail_holy_queen", "vr", "rosary_prayer", "memorare"];
const OTHER_PRAYER_KEYS = ["memorare", "angelus", "before_meals", "after_meals", "contrition"];

// ------------------------------
// Main Prototype Component
// ------------------------------
export default function RosaryTrackerAppPrototype() {
  const [dayKey, setDayKey] = useState(todayKey());
  const [openingDone, setOpeningDone] = useState(false);
  const [closingDone, setClosingDone] = useState(false);
  const [dailyIntention, setDailyIntention] = useState("");
  const suggested = useMemo(() => suggestedMysteryKeyForToday(), []);
  const [startMystery, setStartMystery] = useState(suggested);
  const [sets, setSets] = useState([emptySet(suggested)]);
  
  const [history, setHistory] = useState([]);
  const [lifetimeTotal, setLifetimeTotal] = useState(0);
  const [prayerLang, setPrayerLang] = useState("en");
  const [showPron, setShowPron] = useState(false);
  const [pronType, setPronType] = useState("simple");
  // Add this state with your other states (around line 240)
  const [mirrorToFitbit, setMirrorToFitbit] = useState(false);

  const totalDecadesDone = useMemo(() => sets.reduce((sum, s) => sum + s.decades.filter(Boolean).length, 0), [sets]);
  const mysteriesCompleted = useMemo(() => sets.filter((s) => s.decades.every(Boolean)).length, [sets]);
  const closingEnabled = mysteriesCompleted >= 1;
  const dailyPct = Math.min(100, Math.round((totalDecadesDone / DAILY_DECADE_GOAL) * 100));

  const sendNotification = (title, body) => {
  if (!mirrorToFitbit || !("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/icon-192x192.png" });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(title, { body });
      }
    });
  }
};


// --- FINAL CARPLAY / SIRI LOGIC WITH IMPROVED VOICE ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');

    // Helper to get a better-sounding voice (Samantha or Siri)
    const speakWithBestVoice = (text) => {
      const speech = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      // Look for "Premium", "Enhanced", or "Siri" voices
      const premiumVoice = voices.find(v => 
        (v.name.includes("Premium") || v.name.includes("Enhanced") || v.name.includes("Siri")) && v.lang.startsWith("en")
      );
      if (premiumVoice) speech.voice = premiumVoice;
      speech.rate = 0.9; // Slightly slower for better clarity in the car
      window.speechSynthesis.speak(speech);
    };

    if (action === 'markDecade') {
      setSets(prevSets => {
        const setIndex = prevSets.findIndex(s => s.decades.includes(false));
        if (setIndex !== -1) {
          const updatedSet = { ...prevSets[setIndex], decades: [...prevSets[setIndex].decades] };
          const decadeIndex = updatedSet.decades.indexOf(false);
          updatedSet.decades[decadeIndex] = true;

          const newSets = [...prevSets];
          newSets[setIndex] = updatedSet;
          
          // Calculate new total immediately for the voice
          const newTotal = newSets.reduce((sum, s) => sum + s.decades.filter(Boolean).length, 0);
          speakWithBestVoice(`Decade marked. You have completed ${newTotal} today.`);
          
          return newSets;
        }
        const newTotal = newSets.reduce((sum, s) => sum + s.decades.filter(Boolean).length, 0);
        sendNotification("Rosary Progress", `Decade marked! Today: ${newTotal}/${DAILY_DECADE_GOAL}`);
        return prevSets;
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (action === 'getStatus') {
      // Force a tiny delay to ensure Safari has loaded the latest data from storage
      setTimeout(() => {
        const msg = `Status update: ${totalDecadesDone} decades completed. ${DAILY_DECADE_GOAL - totalDecadesDone} remaining.`;
        speakWithBestVoice(msg);
      }, 100);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [totalDecadesDone, dayKey]);

  // Initial Load
  useEffect(() => {
    const raw = localStorage.getItem("rosary_app_state_v6");
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      setDayKey(s.dayKey ?? todayKey()); 
      setOpeningDone(!!s.openingDone); 
      setClosingDone(!!s.closingDone);
      setDailyIntention(s.dailyIntention ?? ""); 
      setStartMystery(s.startMystery ?? suggested);
      setSets(Array.isArray(s.sets) && s.sets.length ? s.sets : [emptySet(suggested)]);
      setPrayerLang(s.prayerLang ?? "en"); 
      setShowPron(!!s.showPron); 
      setPronType(s.pronType ?? "simple");
      setHistory(Array.isArray(s.history) ? s.history : []);
      setLifetimeTotal(s.lifetimeTotal ?? 0);
    } catch { }
  }, [suggested]);

  // Save State
  useEffect(() => {
    localStorage.setItem("rosary_app_state_v6", JSON.stringify({ 
      dayKey, openingDone, closingDone, dailyIntention, startMystery, sets, 
      prayerLang, showPron, pronType, history, lifetimeTotal 
    }));
  }, [dayKey, openingDone, closingDone, dailyIntention, startMystery, sets, prayerLang, showPron, pronType, history, lifetimeTotal]);

  // Midnight Check Logic
  useEffect(() => {
    const id = setInterval(() => {
      const tk = todayKey();
      if (tk !== dayKey && closingDone) {
        logAndResetDay();
      }
    }, 15_000);
    return () => clearInterval(id);
  }, [dayKey, closingDone]);

  function addSet(mysteryKey) { setSets((prev) => [...prev, emptySet(mysteryKey)]); }
  function updateSet(id, updater) { setSets((prev) => prev.map((s) => (s.id === id ? updater(s) : s))); }
  
  function logAndResetDay() {
    const daySummary = {
        date: dayKey,
        decades: totalDecadesDone,
        mysteries: sets.filter(s => s.decades.every(Boolean)).map(s => s.mystery),
        intention: dailyIntention
    };
    setHistory(prev => {
        const next = [daySummary, ...prev];
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        return next.filter(h => new Date(h.date + "T12:00:00") > twoYearsAgo);
    });
    setLifetimeTotal(prev => prev + totalDecadesDone);
    setDayKey(todayKey());
    setOpeningDone(false); setClosingDone(false); setDailyIntention(""); 
    setStartMystery(suggestedMysteryKeyForToday()); 
    setSets([emptySet(suggestedMysteryKeyForToday())]);
  }

  function toggleClosing() {
    const nextVal = !closingDone;
    setClosingDone(nextVal);
    if (nextVal === true && todayKey() !== dayKey) { logAndResetDay(); }
  }

  const pronAllowed = showPron && (prayerLang === "la" || prayerLang === "pl");
  const pronLabel = pronType === "ipa" ? "IPA" : "Pronunciation";

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Rosary Tracker</h1>
              <p className="mt-1 text-sm text-slate-600">Goal: {DAILY_DECADE_GOAL} decades/day • Lifetime: {lifetimeTotal + totalDecadesDone} decades</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-2xl">Today: {formatDisplayDate(dayKey)}</Badge>
                <Badge className="rounded-2xl" variant={totalDecadesDone >= DAILY_DECADE_GOAL ? "default" : "outline"}>{totalDecadesDone}/{DAILY_DECADE_GOAL} decades</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={logAndResetDay}><RotateCcw className="h-4 w-4 mr-2" /> Force Reset</Button>
              <Button className="rounded-2xl" onClick={() => addSet(startMystery)}><Plus className="h-4 w-4 mr-2" /> Add set</Button>
            </div>
          </div>

          <Tabs defaultValue="track" className="mt-6">
            <TabsList className="rounded-2xl">
              <TabsTrigger value="track">Tracker</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="rosary">Rosary Prayers</TabsTrigger>
              <TabsTrigger value="other">Other Prayers</TabsTrigger>
            </TabsList>

            <TabsContent value="track" className="mt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-1 rounded-2xl shadow-sm">
                  <CardHeader><CardTitle className="text-lg">Daily Checklist</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div><div className="flex justify-between"><span className="text-sm text-slate-600">Daily progress</span><span className="text-sm font-medium">{dailyPct}%</span></div><Progress value={dailyPct} className="mt-2" /></div>
                    <div className="rounded-2xl border p-3 bg-white"><div className="flex items-center gap-2 mb-2"><MessageSquareText className="h-4 w-4 text-slate-600" /><span className="text-sm font-medium">Daily intention</span></div><Input className="rounded-2xl" value={dailyIntention} onChange={(e) => setDailyIntention(e.target.value)} placeholder="Offer intentions..." /></div>
                    <div className="rounded-2xl border p-3 bg-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">{openingDone ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-slate-400" />}<span className="text-sm font-medium">Opening prayers</span></div>
                            <Button size="sm" className="rounded-xl" variant={openingDone ? "secondary" : "default"} onClick={() => setOpeningDone(!openingDone)}>{openingDone ? "Undo" : "Done"}</Button>
                        </div>
                        <ul className="mt-3 text-xs text-slate-700 list-disc pl-5 space-y-1">{OPENING_STEPS.map(s => <li key={s}>{s}</li>)}</ul>
                    </div>
                    <div className={`rounded-2xl border p-3 ${closingEnabled ? "bg-white" : "bg-slate-50"}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">{closingDone ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : closingEnabled ? <Circle className="h-5 w-5 text-slate-400" /> : <Lock className="h-5 w-5 text-slate-500" />}<span className="text-sm font-medium">Closing prayers</span></div>
                            <Button size="sm" className="rounded-xl" variant={closingDone ? "secondary" : "default"} disabled={!closingEnabled} onClick={toggleClosing}>{closingDone ? "Undo" : "Done"}</Button>
                        </div>
                        <ul className="mt-3 text-xs text-slate-700 list-disc pl-5 space-y-1">{CLOSING_STEPS.map(s => <li key={s}>{s}</li>)}</ul>
                    </div>
                    <div className="rounded-2xl border p-3 bg-white">
                        <div className="flex items-center gap-2 mb-2"><Sparkles className="h-4 w-4 text-slate-600" /><span className="text-sm font-medium">Suggested: {mysteryLabel(suggested)}</span></div>
                        <Select value={startMystery} onValueChange={setStartMystery}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent>{MYSTERIES.map(m => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}</SelectContent></Select>
                        <div className="mt-2 flex gap-2"><Button size="sm" variant="secondary" className="rounded-2xl" onClick={() => setStartMystery(suggested)}>Use suggested</Button><Button size="sm" className="rounded-2xl" onClick={() => addSet(startMystery)}>Add set now</Button></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border p-3 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Watch className="h-4 w-4 text-slate-600" />
                      <span className="text-sm font-medium">Fitbit Charge 6 (iPhone)</span>
                    </div>
                    <Switch 
                      checked={mirrorToFitbit} 
                      onCheckedChange={(val) => {
                        setMirrorToFitbit(val);
                        if (val) Notification.requestPermission();
                      }} 
                    />
                  </div>
                  <ul className="text-[10px] text-slate-500 list-disc pl-5 space-y-1">
                    <li>Glance-only: shows iPhone notifications like "Today: 7/15 decades".</li>
                    <li>Check-offs happen on iPhone; Fitbit does not send actions back.</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mirror status to Fitbit</span>
                    <div className={`h-2 w-2 rounded-full ${mirrorToFitbit ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                </Card>

                <Card className="md:col-span-2 rounded-2xl shadow-sm">
                  <CardHeader><CardTitle className="text-lg">Mystery Sets</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">{MYSTERIES.map(m => <Button key={m.key} variant="secondary" className="rounded-2xl" onClick={() => addSet(m.key)}>Add {m.label}</Button>)}</div>
                    <AnimatePresence initial={false}>
                      {sets.map((s, idx) => {
                        const setDone = s.decades.filter(Boolean).length;
                        const titles = MYSTERY_DECADES[s.mystery] ?? [];
                        return (
                          <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="rounded-2xl border p-4 bg-white">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-slate-600" /><div className="text-sm font-medium">{mysteryLabel(s.mystery)} — Set #{idx + 1}</div><Badge className="rounded-2xl" variant={setDone === 5 ? "default" : "outline"}>{setDone}/5</Badge></div>
                              <Select value={s.mystery} onValueChange={(v) => updateSet(s.id, (old) => ({ ...old, mystery: v }))}><SelectTrigger className="rounded-2xl md:w-[200px]"><SelectValue /></SelectTrigger><SelectContent>{MYSTERIES.map(m => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}</SelectContent></Select>
                            </div>
                            <Progress value={(setDone / 5) * 100} className="mt-2" /><Separator className="my-4" />
                            <div className="grid gap-2">{s.decades.map((done, i) => (
                              <button key={i} onClick={() => updateSet(s.id, (old) => { const n = [...old.decades]; n[i] = !n[i]; return { ...old, decades: n }; })} className={`w-full rounded-2xl border p-3 text-left transition ${done ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}`}>
                                <div className="flex items-center justify-between"><div><div className="text-sm font-medium">{i + 1}. {titles[i]}</div><div className="text-xs text-slate-600">Decade {i + 1} of 5</div></div>{done ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-slate-400" />}</div>
                              </button>
                            ))}</div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </CardContent>
                </Card>


              </div>
            </TabsContent>

            <TabsContent value="stats" className="mt-4">
                <StatsView history={history} lifetimeTotal={lifetimeTotal} currentDecades={totalDecadesDone} currentMysteries={sets.filter(s => s.decades.every(Boolean)).map(s => s.mystery)} />
            </TabsContent>

            <TabsContent value="rosary" className="mt-4">
              <LibraryView keys={ROSARY_PRAYER_KEYS} prayerLang={prayerLang} setPrayerLang={setPrayerLang} showPron={showPron} setShowPron={setShowPron} pronType={pronType} setPronType={setPronType} pronAllowed={pronAllowed} pronLabel={pronLabel} />
            </TabsContent>

            <TabsContent value="other" className="mt-4">
              <LibraryView keys={OTHER_PRAYER_KEYS} prayerLang={prayerLang} setPrayerLang={setPrayerLang} showPron={showPron} setShowPron={setShowPron} pronType={pronType} setPronType={setPronType} pronAllowed={pronAllowed} pronLabel={pronLabel} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

function StatsView({ history, lifetimeTotal, currentDecades, currentMysteries }) {
    const now = new Date();
    const isThisMonth = (d) => new Date(d + "T12:00:00").getMonth() === now.getMonth() && new Date(d + "T12:00:00").getFullYear() === now.getFullYear();
    const isLastMonth = (d) => {
        const last = new Date(); last.setMonth(now.getMonth() - 1);
        return new Date(d + "T12:00:00").getMonth() === last.getMonth() && new Date(d + "T12:00:00").getFullYear() === last.getFullYear();
    };
    const intentions = history.filter(h => (now - new Date(h.date + "T12:00:00")) < (180 * 24 * 60 * 60 * 1000) && h.intention?.trim());

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="rounded-2xl shadow-sm border-emerald-100 bg-emerald-50/30"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Trophy className="h-4 w-4" /> Lifetime Impact</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{lifetimeTotal + currentDecades}</div><p className="text-xs text-slate-500">Decades</p></CardContent></Card>
                <Card className="rounded-2xl shadow-sm border-blue-100 bg-blue-50/30"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Monthly Rosaries</CardTitle></CardHeader><CardContent><div className="flex justify-between items-end"><div><div className="text-2xl font-bold">{history.filter(h => isThisMonth(h.date)).reduce((s, h) => s + (h.decades >= 5 ? 1 : 0), 0) + (currentDecades >= 5 ? 1 : 0)}</div><p className="text-xs text-slate-500">Current</p></div><div className="text-right opacity-60"><div>{history.filter(h => isLastMonth(h.date)).reduce((s, h) => s + (h.decades >= 5 ? 1 : 0), 0)}</div><p className="text-xs text-slate-500">Previous</p></div></div></CardContent></Card>
                <Card className="rounded-2xl shadow-sm border-purple-100 bg-purple-50/30"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><History className="h-4 w-4" /> This Year</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{history.filter(h => new Date(h.date + "T12:00:00").getFullYear() === now.getFullYear()).reduce((s, h) => s + (h.decades >= 5 ? 1 : 0), 0) + (currentDecades >= 5 ? 1 : 0)}</div></CardContent></Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="rounded-2xl shadow-sm"><CardHeader><CardTitle className="text-lg">Last 7 Days (Decades)</CardTitle></CardHeader><CardContent className="space-y-2"><div className="flex justify-between text-sm py-1 font-medium bg-slate-50 px-2 rounded"><span>{formatDisplayDate(todayKey())}</span><span>{currentDecades}</span></div>{history.filter(h => (now - new Date(h.date + "T12:00:00")) < (7 * 24 * 60 * 60 * 1000)).map(h => (<div key={h.date} className="flex justify-between text-sm py-1 px-2 border-b"><span>{formatDisplayDate(h.date)}</span><span>{h.decades}</span></div>))}</CardContent></Card>
                <Card className="rounded-2xl shadow-sm"><CardHeader><CardTitle className="text-lg">Intentions (6 Months)</CardTitle></CardHeader><CardContent className="grid gap-2">{intentions.map((h, i) => (<div key={i} className="p-3 rounded-xl border bg-slate-50/50"><div className="text-[10px] font-bold text-slate-400">{formatDisplayDate(h.date)}</div><div className="text-sm mt-1 italic">"{h.intention}"</div></div>))}</CardContent></Card>
            </div>
        </div>
    );
}

function LibraryView({ keys, prayerLang, setPrayerLang, showPron, setShowPron, pronType, setPronType, pronAllowed, pronLabel }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader><CardTitle className="flex items-center gap-2"><Languages className="h-5 w-5" /> Prayer Library</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Select value={prayerLang} onValueChange={setPrayerLang}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="la">Latin</SelectItem><SelectItem value="pl">Polish</SelectItem></SelectContent></Select>
          <div className="flex items-center justify-between rounded-2xl border p-3 bg-white"><div className="flex items-center gap-2"><Mic2 className="h-4 w-4 text-slate-600" /><span className="text-sm">Pronunciation</span></div><Switch checked={showPron} onCheckedChange={setShowPron} /></div>
          <Select value={pronType} onValueChange={setPronType}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="simple">Simple</SelectItem><SelectItem value="ipa">IPA</SelectItem></SelectContent></Select>
        </div>
        <Separator /><div className="space-y-4">{keys.map(k => <PrayerBlock key={k} title={PRAYERS[k].title} body={PRAYERS[k].text[prayerLang]} pron={PRAYERS[k].pron?.[prayerLang]?.[pronType]} showPron={pronAllowed} pronLabel={pronLabel} />)}</div>
      </CardContent>
    </Card>
  );
}
