import React, { useEffect, useMemo, useState, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, RotateCcw, Plus, Languages, BookOpen, Lock,
  MessageSquareText, Sparkles, Mic2, BarChart3, History, Trophy
} from "lucide-react";

// --- Standalone UI Components (Baking in the missing Shadcn parts) ---
const Card = ({ children, className = "" }) => <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>{children}</div>;
const CardHeader = ({ children, className = "" }) => <div className={`p-4 border-b border-slate-50 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = "" }) => <h3 className={`text-lg font-semibold tracking-tight ${className}`}>{children}</h3>;
const CardContent = ({ children, className = "" }) => <div className={`p-4 ${className}`}>{children}</div>;
const Progress = ({ value }) => (
  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${value}%` }} />
  </div>
);
const Badge = ({ children, variant = "default" }) => {
  const styles = variant === "default" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200";
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles}`}>{children}</span>;
};

// --- Prayer Rendering Logic ---
function LinePair({ original, pron, showPron, pronLabel }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3 mb-2 bg-white shadow-sm">
      <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">{original}</div>
      {showPron && pron && (
        <div className="mt-2 text-xs text-slate-500 italic border-t border-slate-50 pt-2">
          <span className="font-bold text-slate-400">{pronLabel}: </span>{pron}
        </div>
      )}
    </div>
  );
}

function PrayerBlock({ title, body, pron, showPron, pronLabel }) {
  const lines = (body || "").split("\n").filter(l => l.trim() !== "");
  const pronLines = Array.isArray(pron) ? pron : [];
  return (
    <div className="mb-8 text-left">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">{title}</div>
      {lines.map((ln, idx) => (
        <LinePair key={idx} original={ln} pron={pronLines[idx]} showPron={showPron} pronLabel={pronLabel} />
      ))}
    </div>
  );
}

// --- Data Constants ---
const DAILY_DECADE_GOAL = 15;
const MYSTERIES = [
  { key: "joyful", label: "Joyful" }, { key: "sorrowful", label: "Sorrowful" },
  { key: "glorious", label: "Glorious" }, { key: "luminous", label: "Luminous" },
];
const MYSTERY_DECADES = {
  joyful: ["The Annunciation", "The Visitation", "The Nativity", "The Presentation", "The Finding in the Temple"],
  sorrowful: ["The Agony in the Garden", "The Scourging at the Pillar", "The Crowning with Thorns", "The Carrying of the Cross", "The Crucifixion"],
  glorious: ["The Resurrection", "The Ascension", "The Descent of the Holy Spirit", "The Assumption", "The Coronation of Mary"],
  luminous: ["The Baptism of the Lord", "The Wedding Feast at Cana", "The Proclamation of the Kingdom", "The Transfiguration", "The Institution of the Eucharist"],
};
const OPENING_STEPS = ["Apostles’ Creed", "1 Our Father", "3 Hail Marys", "1 Glory Be", "Offer Intentions"];
const CLOSING_STEPS = ["Salve Regina", "V/R Response", "Rosary Prayer", "The Memorare"];

const PRAYERS = {
  apostles_creed: {
    title: "Apostles’ Creed",
    text: {
      en: "I believe in God, the Father almighty, Creator of heaven and earth.\nI believe in Jesus Christ, His only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; He descended into hell; on the third day He rose again from the dead; He ascended into heaven, and is seated at the right hand of God the Father almighty; from there He will come to judge the living and the dead.\nI believe in the Holy Spirit, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.",
      la: "Credo in Deum, Patrem omnipotentem, Creatorem caeli et terrae.\nEt in Iesum Christum, Filium Eius unicum, Dominum nostrum, qui conceptus est de Spiritu Sancto, natus ex Maria Virgine, passus sub Pontio Pilato, crucifixus, mortuus et sepultus; descendit ad inferos; tertia die resurrexit a mortuis; ascendit ad caelos; sedet ad dexteram Dei Patris omnipotentis; inde venturus est iudicare vivos et mortuos.\nCredo in Spiritum Sanctum, sanctam Ecclesiam catholicam, sanctorum communionem, remissionem peccatorum, carnis resurrectionem, vitam aeternam. Amen.",
      pl: "Wierzę w Boga, Ojca Wszechmogącego, Stworzyciela nieba i ziemi.\nI w Jezusa Chrystusa, Syna Jego Jedynego, Pana naszego, który się począł z Ducha Świętego, narodził się z Maryi Panny, umęczon pod Ponckim Piłatem, ukrzyżowan, umarł i pogrzebion; zstąpił do piekieł; trzeciego dnia zmartwychwstał; wstąpił na niebiosa, siedzi po prawicy Boga Ojca Wszechmogącego; stamtąd przyjdzie sądzić żywych i umarłych.\nWierzę w Ducha Świętego, święty Kościół powszechny, Świętych obcowanie, grzechów odpuszczenie, ciała zmartwychwstanie, żywot wieczny. Amen."
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
      pl: { simple: ["OH mooy YEH-zoo, pshe-BAHTCH nahm NAH-sheh GZHEH-hih, zah-hoh-VAI nahs ohd OH-nyah pyeh-KYEHL-neh-goh, zah-PROH-vahdsh FSHIH-stkee DOO-sheh doh NYEH-bah ee doh-POH-moosh shcheh-GOO-lyeh tihm, KTOO-zhih bar-DZYEY bar-DZYEY pɔt-sheh-BOO-yon TVOH-yeh-goh mee-WOH-shyehr-DZYAH. AH-men."] }
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
      la: { simple: ["meh-moh-RAH-reh, oh pee-ISS-ee-mah VEER-goh mah-REE-ah, non ESS-eh ow-DEE-toom ah SAY-koo-loh KWEHM-kwahm ahd TOO-ah KOO-ren-tehm preh-SIH-dee-ah, TOO-ah eem-ploh-RAHN-tehm owk-SIH-lee-ah, TOO-ah peh-TEN-tehm soof-FRAH-jee-ah, ESS-eh deh-REH-lee-ktoom.", "EH-goh TAH-lee ah-nee-MAH-toos kon-fee-DEN-tsee-ah, ahd teh, VEER-goh VEER-jee-noom, MAH-tehr, KOO-roh; ahd teh VEH-nee-oh; KOH-rahm teh JEH-mehns PEHK-kah-tohr ah-SSIS-toh.", "NOH-lee, MAH-tehr VEHR-bee, VEHR-bah MEH-ah deh-SPEE-cheh-reh; sed OW-dee proh-PEE-tsee-ah et eks-OW-dee. AH-men."] },
      pl: { simple: ["POHM-neey, oh nay-SHVYEN-tshah PAHN-noh mah-RYO, zheh NEE-gdih nyeh swih-SHAH-no, ah-bih KTOH-kohl-vyek, ktoh sheh doh TVEY oh-PYEH-kee oo-CHYEH-kahw, TVEY poh-MOH-tsih VZII-vaw, CHYEH-byeh oh pshih-CHIH-neh PROH-sheew, MYAHW bihtch pshez CHYEH-byeh oh-poosh-CHOH-nih.", "TOH oo-FNOH-shchyon oh-zhih-VYOH-nih, doh CHYEH-byeh, oh PAHN-noh nahd pah-NAH-mee ee MAHT-koh, BYE-gneh; doh CHYEH-byeh pshih-KHOH-dzeh; pshed TOH-boh STAH-yeh YAH-koh GZHEH-shneek zhah-WOO-yonts.", "OH MAHT-koh SWO-vah fchyeh-LOH-neh-goh, nyeh GAHRDZ swo-VAH-mee MO-ee-mee, ah-leh oo-SWIH-sh yeh wah-SKAH-vyeh ee vih-SWOO-khahy. AH-men."] }
    }
  },
  angelus: {
    title: "The Angelus",
    text: {
      en: "V. The Angel of the Lord declared unto Mary.\nR. And she conceived of the Holy Spirit.\nV. Behold the handmaid of the Lord.\nR. Be it done unto me according to thy word.\nV. And the Word was made flesh.\nR. And dwelt among us.\nV. Pray for us, O holy Mother of God.\nR. That we may be made worthy of the promises of Christ.",
      la: "V. Angelus Domini nuntiavit Mariae.\nR. Et concepit de Spiritu Sancto.\nV. Ecce ancilla Domini.\nR. Fiat mihi secundum verbum tuum.\nV. Et Verbum caro factum est.\nR. Et habitavit in nobis.\nV. Ora pro nobis, sancta Dei Genetrix.\nR. Ut digni efficiamur promissionibus Christi.",
      pl: "V. Anioł Pański zwiastował Pannie Maryi.\nR. I poczęła z Ducha Świętego.\nV. Oto ja służebnica Pańska.\nR. Niech mi się stanie według słowa twego.\nV. A Słowo Ciałem się stało.\nR. I mieszkało między nami.\nV. Módl się za nami, Święta Boża Rodzicielko.\nR. Abyśmy się stali godnymi obietnic Chrystusowych."
    },
    pron: {
      la: { simple: ["AHN-jeh-loos DOH-mee-nee noon-tsy-AH-veet mah-REE-ay.", "Et kon-CHEP-eet deh SPEE-ree-too SAHNK-toh.", "EH-cheh ahn-CHIL-lah DOH-mee-nee.", "FEE-aht MEE-kee seh-KOON-doom VEHR-boom TOO-oom.", "Et VEHR-boom KAH-roh FAK-toom est.", "Et ah-bee-TAH-veet een NOH-bees.", "OH-rah proh NOH-bees, SAHNK-tah DEH-ee JEH-neh-triks.", "OOT DEEN-yee eh-fee-chy-AH-moor proh-mee-sy-OH-nee-boos KRIS-tee."] },
      pl: { simple: ["AH-nyow PAH-ny-skee zv-yah-STOH-vow PAHN-nyeh mah-RYE-ee.", "ee poh-CHEH-wah z DOO-khah sh-vyen-TEH-goh.", "OH-toh yah swoo-zheh-BNEE-tsah PAHN-skah.", "nye-kh me shye STAH-nyeh VEH-dwoog SWO-vah TVEH-goh.", "ah SWO-voh CHYAH-wem sheh STAH-wo.", "ee mye-SHKAH-wo m-YEHND-zih NAH-mee.", "MOODL shye zah NAH-mee, SH-vyen-tah BOH-zhah roh-dze-CHYEH-l-koh.", "ah-BISH-me shye STAH-lee gohd-NIH-me oh-BYET-neech khris-too-SOH-vihkh."] }
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

// --- Standalone Tab System Context ---
const TabsContext = createContext({ current: "track", set: () => {} });
const Tabs = ({ children, defaultValue }) => {
  const [v, setV] = useState(defaultValue);
  return <TabsContext.Provider value={{ current: v, set: setV }}>{children}</TabsContext.Provider>;
};
const TabsList = ({ children, className = "" }) => <div className={`flex bg-slate-200/50 p-1 rounded-2xl mb-4 gap-1 ${className}`}>{children}</div>;
const TabsTrigger = ({ children, value }) => {
  const context = useContext(TabsContext);
  const active = context.current === value;
  return (
    <button onClick={() => context.set(value)} className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${active ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>{children}</button>
  );
};
const TabsContent = ({ children, value }) => {
  const context = useContext(TabsContext);
  return context.current === value ? <div>{children}</div> : null;
};

// --- Main App Logic ---
export default function RosaryTrackerAppPrototype() {
  const [dayKey, setDayKey] = useState(todayKey());
  const [openingDone, setOpeningDone] = useState(false);
  const [closingDone, setClosingDone] = useState(false);
  const [dailyIntention, setDailyIntention] = useState("");
  const suggested = useMemo(() => suggestedMysteryKeyForToday(), []);
  const [startMystery, setStartMystery] = useState(suggested);
  const [sets, setSets] = useState([{ id: 'init', createdAt: new Date().toISOString(), mystery: suggested, decades: [false, false, false, false, false] }]);
  
  const [history, setHistory] = useState([]);
  const [lifetimeTotal, setLifetimeTotal] = useState(0);
  const [prayerLang, setPrayerLang] = useState("en");
  const [showPron, setShowPron] = useState(false);
  const [pronType, setPronType] = useState("simple");

  const totalDecadesDone = useMemo(() => sets.reduce((sum, s) => sum + s.decades.filter(Boolean).length, 0), [sets]);
  const mysteriesCompleted = useMemo(() => sets.filter((s) => s.decades.every(Boolean)).length, [sets]);
  const closingEnabled = mysteriesCompleted >= 1;
  const dailyPct = Math.min(100, Math.round((totalDecadesDone / DAILY_DECADE_GOAL) * 100));

  // CarPlay/Siri Logic
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'markDecade') {
      setSets(prevSets => {
        const newSets = [...prevSets];
        const targetSet = newSets.find(s => s.decades.includes(false));
        if (targetSet) {
          targetSet.decades[targetSet.decades.indexOf(false)] = true;
          const speech = new SpeechSynthesisUtterance("Decade marked.");
          window.speechSynthesis.speak(speech);
        }
        return newSets;
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (action === 'getStatus') {
      const remaining = DAILY_DECADE_GOAL - totalDecadesDone;
      const msg = `You have completed ${totalDecadesDone} decades. You have ${remaining} left.`;
      const speech = new SpeechSynthesisUtterance(msg);
      window.speechSynthesis.speak(speech);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [totalDecadesDone]);

  // Persistent storage
  useEffect(() => {
    const raw = localStorage.getItem("rosary_v20_final");
    if (raw) {
      try {
        const s = JSON.parse(raw);
        setDayKey(s.dayKey ?? todayKey()); setOpeningDone(!!s.openingDone); setClosingDone(!!s.closingDone);
        setDailyIntention(s.dailyIntention ?? ""); setStartMystery(s.startMystery ?? suggested);
        setSets(s.sets ?? sets); setPrayerLang(s.prayerLang ?? "en");
        setShowPron(!!s.showPron); setPronType(s.pronType ?? "simple");
        setHistory(s.history ?? []); setLifetimeTotal(s.lifetimeTotal ?? 0);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("rosary_v20_final", JSON.stringify({ dayKey, openingDone, closingDone, dailyIntention, startMystery, sets, prayerLang, showPron, pronType, history, lifetimeTotal }));
  }, [dayKey, openingDone, closingDone, dailyIntention, startMystery, sets, prayerLang, showPron, pronType, history, lifetimeTotal]);

  function logAndResetDay() {
    const daySummary = { date: dayKey, decades: totalDecadesDone, intention: dailyIntention };
    setHistory(prev => [daySummary, ...prev].slice(0, 50));
    setLifetimeTotal(prev => prev + totalDecadesDone);
    setDayKey(todayKey()); setOpeningDone(false); setClosingDone(false); setDailyIntention(""); 
    setStartMystery(suggestedMysteryKeyForToday()); setSets([{ id: Date.now().toString(), createdAt: new Date().toISOString(), mystery: suggestedMysteryKeyForToday(), decades: [false, false, false, false, false] }]);
  }

  const pronAllowed = showPron && (prayerLang === "la" || prayerLang === "pl");
  const pronLabel = pronType === "ipa" ? "IPA" : "Pronunciation";

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-5xl text-left">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Rosary Tracker</h1>
            <p className="text-sm text-slate-500 font-medium">Lifetime Impact: {lifetimeTotal + totalDecadesDone} Decades</p>
            <div className="mt-2 flex gap-2"><Badge variant="outline">{formatDisplayDate(dayKey)}</Badge><Badge>{totalDecadesDone}/{DAILY_DECADE_GOAL} decades</Badge></div>
          </div>
          <div className="flex gap-2">
            <button onClick={logAndResetDay} className="flex items-center px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold shadow-sm active:scale-95"><RotateCcw className="h-4 w-4 mr-2" /> Reset</button>
            <button onClick={() => setSets([...sets, { id: Date.now().toString(), createdAt: new Date().toISOString(), mystery: startMystery, decades: [false, false, false, false, false] }])} className="flex items-center px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-sm active:scale-95"><Plus className="h-4 w-4 mr-2" /> Add Set</button>
          </div>
        </div>

        <Tabs defaultValue="track">
          <TabsList>
            <TabsTrigger value="track">Tracker</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="rosary">Rosary</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          <TabsContent value="track">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-1 h-fit">
                <CardHeader><CardTitle>Daily Goal</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div><div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-1"><span>Progress</span><span>{dailyPct}%</span></div><Progress value={dailyPct} /></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><div className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-700"><MessageSquareText className="h-4 w-4" /> Intention</div><input className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm outline-none" value={dailyIntention} onChange={(e) => setDailyIntention(e.target.value)} placeholder="..." /></div>
                  <button onClick={() => setOpeningDone(!openingDone)} className={`w-full p-3 rounded-xl border flex items-center justify-between text-sm font-bold transition-all ${openingDone ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-100"}`}><span>Opening Prayers</span>{openingDone ? <CheckCircle2 className="text-emerald-500" /> : <Circle className="text-slate-200" />}</button>
                  <button disabled={!closingEnabled} onClick={() => setClosingDone(!closingDone)} className={`w-full p-3 rounded-xl border flex items-center justify-between text-sm font-bold transition-all ${closingDone ? "bg-emerald-50 border-emerald-200 text-emerald-700" : !closingEnabled ? "opacity-40" : "bg-white border-slate-100"}`}><span>Closing Prayers</span>{closingDone ? <CheckCircle2 className="text-emerald-500" /> : !closingEnabled ? <Lock className="h-4 w-4 text-slate-400" /> : <Circle className="text-slate-200" />}</button>
                </CardContent>
              </Card>

              <div className="md:col-span-2 space-y-4">
                {sets.map((s, idx) => {
                  const setDone = s.decades.filter(Boolean).length;
                  return (
                    <Card key={s.id}>
                      <CardHeader><div className="flex justify-between items-center"><div className="text-sm font-bold flex items-center gap-2"><BookOpen className="h-4 w-4 text-slate-400" /> {mysteryLabel(s.mystery)} Set #{idx + 1}</div><Badge variant="outline">{setDone}/5</Badge></div><div className="mt-3"><Progress value={(setDone/5)*100} /></div></CardHeader>
                      <CardContent className="space-y-2">
                        {s.decades.map((done, i) => (
                          <button key={i} onClick={() => { const n = [...s.decades]; n[i] = !n[i]; setSets(sets.map(it => it.id === s.id ? { ...it, decades: n } : it)) }} className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${done ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100 shadow-sm"}`}>
                            <div><div className="text-sm font-bold">{i + 1}. {MYSTERY_DECADES[s.mystery][i]}</div><div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Decade {i+1}</div></div>
                            {done ? <CheckCircle2 className="text-emerald-500" /> : <Circle className="text-slate-200" />}
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="bg-emerald-50 border-emerald-100 p-6 text-center"><Trophy className="h-6 w-6 text-emerald-500 mx-auto mb-2" /><div className="text-4xl font-black text-emerald-900">{lifetimeTotal + totalDecadesDone}</div><div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Lifetime Decades</div></Card>
                <Card className="bg-blue-50 border-blue-100 p-6 text-center"><History className="h-6 w-6 text-blue-500 mx-auto mb-2" /><div className="text-4xl font-black text-blue-900">{history.length + 1}</div><div className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Days Tracked</div></Card>
            </div>
            <Card><CardHeader><CardTitle>Activity Journal</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between border-b pb-2 text-[10px] font-black uppercase text-slate-400 tracking-widest"><span>Date</span><span>Total Decades</span></div>
                    {history.map((h, i) => <div key={i} className="flex justify-between border-b border-slate-50 py-3 text-sm font-medium"><span>{formatDisplayDate(h.date)}</span><span>{h.decades} Decades</span></div>)}
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rosary"><LibraryView keys={ROSARY_PRAYER_KEYS} prayerLang={prayerLang} setPrayerLang={setPrayerLang} showPron={showPron} setShowPron={setShowPron} pronType={pronType} setPronType={setPronType} pronAllowed={pronAllowed} pronLabel={pronLabel} /></TabsContent>
          <TabsContent value="other"><LibraryView keys={OTHER_PRAYER_KEYS} prayerLang={prayerLang} setPrayerLang={setPrayerLang} showPron={showPron} setShowPron={setShowPron} pronType={pronType} setPronType={setPronType} pronAllowed={pronAllowed} pronLabel={pronLabel} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LibraryView({ keys, prayerLang, setPrayerLang, showPron, setShowPron, pronType, setPronType, pronAllowed, pronLabel }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={prayerLang} onChange={(e) => setPrayerLang(e.target.value)} className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none">{['en','la','pl'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}</select>
          <button onClick={() => setShowPron(!showPron)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-black tracking-widest transition-all ${showPron ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200"}`}><Mic2 className="h-3 w-3" /> PRONUNCIATION</button>
          <select value={pronType} onChange={(e) => setPronType(e.target.value)} className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none"><option value="simple">SIMPLE</option><option value="ipa">IPA</option></select>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {keys.map(k => <PrayerBlock key={k} title={PRAYERS[k].title} body={PRAYERS[k].text[prayerLang]} pron={PRAYERS[k].pron?.[prayerLang]?.[pronType]} showPron={pronAllowed} pronLabel={pronLabel} />)}
      </CardContent>
    </Card>
  );
}