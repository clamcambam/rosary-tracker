import React, { useEffect, useMemo, useState } from "react";
import { PRAYERS, ROSARY_PRAYER_KEYS, OTHER_PRAYER_KEYS } from "./data/prayers";
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
  CheckCircle2, Circle, RotateCcw, Watch, Plus, Languages, BookOpen, Lock,
  MessageSquareText, Sparkles, Mic2, BarChart3, History, Trophy
} from "lucide-react";

// --- Constants ---
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
const OPENING_STEPS = ["The Apostles’ Creed", "1 Our Father (for the intentions of the Pope)", "3 Hail Marys (for an increase in Faith, Hope, & Charity)", "1 Glory Be", "Offer intentions"];
const CLOSING_STEPS = ["Salve Regina (Hail Holy Queen)", "V. Pray for us, O holy Mother of God. / R. That we may be made worthy of the promises of Christ.", "Rosary Prayer (Let us pray…)", "The Memorare"];

// --- Helpers ---
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' });
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

// ------------------------------
// Main Component
// ------------------------------
export default function RosaryTrackerApp() {
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
  const [mirrorToFitbit, setMirrorToFitbit] = useState(false);

  const totalDecadesDone = useMemo(() => sets.reduce((sum, s) => sum + s.decades.filter(Boolean).length, 0), [sets]);
  const closingEnabled = useMemo(() => sets.some(s => s.decades.every(Boolean)), [sets]);
  const dailyPct = Math.min(100, Math.round((totalDecadesDone / DAILY_DECADE_GOAL) * 100));

  // --- Voice Feedback & Notifications ---
  const speak = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const best = voices.find(v => (v.name.includes("Premium") || v.name.includes("Enhanced") || v.name.includes("Siri")) && v.lang.startsWith("en"));
    if (best) speech.voice = best;
    speech.rate = 0.9;
    window.speechSynthesis.speak(speech);
  };

  const sendFitbitAlert = (title, body) => {
    if (!mirrorToFitbit || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  // --- Siri / CarPlay / Fitbit Logic ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');

    if (action === 'markDecade') {
      setSets(prevSets => {
        const setIndex = prevSets.findIndex(s => s.decades.includes(false));
        if (setIndex !== -1) {
          const updatedSet = { ...prevSets[setIndex], decades: [...prevSets[setIndex].decades] };
          const decadeIndex = updatedSet.decades.indexOf(false);
          updatedSet.decades[decadeIndex] = true;

          const newSets = [...prevSets];
          newSets[setIndex] = updatedSet;
          const newTotal = newSets.reduce((sum, s) => sum + s.decades.filter(Boolean).length, 0);

          speak(`Decade marked. Total: ${newTotal}.`);
          sendFitbitAlert("Rosary Progress", `Decade marked! Today: ${newTotal}/${DAILY_DECADE_GOAL}`);
          return newSets;
        }
        return prevSets;
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (action === 'getStatus') {
      setTimeout(() => {
        const msg = `Status update: ${totalDecadesDone} decades completed. ${DAILY_DECADE_GOAL - totalDecadesDone} remaining.`;
        speak(msg);
      }, 100);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [totalDecadesDone, dayKey, mirrorToFitbit]);

  // Storage and Reset Logic...
  useEffect(() => {
    const raw = localStorage.getItem("rosary_app_v10");
    if (raw) {
      try {
        const s = JSON.parse(raw);
        setDayKey(s.dayKey || todayKey()); setOpeningDone(!!s.openingDone); setClosingDone(!!s.closingDone);
        setDailyIntention(s.dailyIntention || ""); setStartMystery(s.startMystery || suggested);
        setSets(s.sets || [emptySet(suggested)]); setPrayerLang(s.prayerLang || "en"); 
        setShowPron(!!s.showPron); setPronType(s.pronType || "simple");
        setHistory(s.history || []); setLifetimeTotal(s.lifetimeTotal || 0);
        setMirrorToFitbit(!!s.mirrorToFitbit);
      } catch { }
    }
  }, [suggested]);

  useEffect(() => {
    localStorage.setItem("rosary_app_v10", JSON.stringify({ 
      dayKey, openingDone, closingDone, dailyIntention, startMystery, sets, 
      prayerLang, showPron, pronType, history, lifetimeTotal, mirrorToFitbit 
    }));
  }, [dayKey, openingDone, closingDone, dailyIntention, startMystery, sets, prayerLang, showPron, pronType, history, lifetimeTotal, mirrorToFitbit]);

  function logAndResetDay() {
    setHistory(prev => [{ date: dayKey, decades: totalDecadesDone, intention: dailyIntention }, ...prev].slice(0, 100));
    setLifetimeTotal(prev => prev + totalDecadesDone);
    setDayKey(todayKey()); setOpeningDone(false); setClosingDone(false); setDailyIntention(""); 
    setSets([emptySet(suggestedMysteryKeyForToday())]);
  }

  const pronAllowed = showPron && (prayerLang === "la" || prayerLang === "pl");
  const pronLabel = pronType === "ipa" ? "IPA" : "Pronunciation";

  return (
    <div className="min-h-screen w-full bg-slate-50 p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Rosary Tracker</h1>
            <p className="text-sm text-slate-500 font-medium">Lifetime: {lifetimeTotal + totalDecadesDone} Decades</p>
            <div className="mt-2 flex gap-2">
              <Badge variant="secondary" className="rounded-2xl">{formatDisplayDate(dayKey)}</Badge>
              <Badge className="rounded-2xl">{totalDecadesDone}/{DAILY_DECADE_GOAL} decades</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={logAndResetDay}><RotateCcw className="h-4 w-4 mr-2" /> Reset Day</Button>
            <Button className="rounded-2xl" onClick={() => setSets([...sets, emptySet(startMystery)])}><Plus className="h-4 w-4 mr-2" /> Add Set</Button>
          </div>
        </div>

        <Tabs defaultValue="track">
          <TabsList className="rounded-2xl bg-slate-200/50 p-1">
            <TabsTrigger value="track">Tracker</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="rosary">Rosary</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          <TabsContent value="track" className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="space-y-4">
              <Card className="rounded-2xl shadow-sm border-none bg-white p-4 space-y-4">
                <div><div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-1"><span>Progress</span><span>{dailyPct}%</span></div><Progress value={dailyPct} /></div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100"><div className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-700"><MessageSquareText className="h-4 w-4" /> Intention</div><Input className="rounded-xl border-slate-200 bg-white" value={dailyIntention} onChange={(e) => setDailyIntention(e.target.value)} placeholder="..." /></div>
                <Button variant={openingDone ? "secondary" : "default"} className="w-full rounded-xl flex justify-between px-4 py-6" onClick={() => setOpeningDone(!openingDone)}><span>Opening Prayers</span>{openingDone && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}</Button>
                <Button disabled={!closingEnabled} variant={closingDone ? "secondary" : "default"} className="w-full rounded-xl flex justify-between px-4 py-6" onClick={() => setClosingDone(!closingDone)}><span>Closing Prayers</span>{closingDone && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}</Button>
              </Card>

              <Card className="rounded-2xl border p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><Watch className="h-4 w-4 text-slate-600" /><span className="text-sm font-bold text-slate-900">Fitbit Charge 6</span></div>
                  <Switch checked={mirrorToFitbit} onCheckedChange={(val) => { setMirrorToFitbit(val); if (val) Notification.requestPermission(); }} />
                </div>
                <ul className="text-[10px] text-slate-500 list-disc pl-5 space-y-1 font-medium">
                  <li>Glance-only: Mirrors iPhone notifications to wrist.</li>
                  <li>Download "Samantha Enhanced" voice for better car status.</li>
                </ul>
              </Card>
            </div>

            <div className="md:col-span-2 space-y-4">
              {sets.map((s, idx) => {
                const setDone = s.decades.filter(Boolean).length;
                return (
                  <Card key={s.id} className="rounded-2xl shadow-sm border-none bg-white p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm font-bold flex items-center gap-2 text-slate-900"><BookOpen className="h-4 w-4 text-slate-400" /> {mysteryLabel(s.mystery).toUpperCase()} Set #{idx + 1}</div>
                      <Badge variant="outline" className="rounded-xl">{setDone}/5</Badge>
                    </div>
                    <div className="space-y-2">
                      {s.decades.map((done, i) => (
                        <button key={i} onClick={() => { const n = [...s.decades]; n[i] = !n[i]; setSets(sets.map(it => it.id === s.id ? { ...it, decades: n } : it)) }} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${done ? "bg-emerald-50 border-emerald-100 text-emerald-900" : "bg-white border-slate-100 shadow-sm"}`}>
                          <div className="text-left font-bold text-sm">{i + 1}. {MYSTERY_DECADES[s.mystery][i]}</div>
                          {done ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-slate-200" />}
                        </button>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-4"><StatsView history={history} lifetimeTotal={lifetimeTotal} currentDecades={totalDecadesDone} /></TabsContent>
          <TabsContent value="rosary" className="mt-4"><LibraryView keys={ROSARY_PRAYER_KEYS} prayerLang={prayerLang} setPrayerLang={setPrayerLang} showPron={showPron} setShowPron={setShowPron} pronType={pronType} setPronType={setPronType} pronAllowed={pronAllowed} pronLabel={pronLabel} /></TabsContent>
          <TabsContent value="other" className="mt-4"><LibraryView keys={OTHER_PRAYER_KEYS} prayerLang={prayerLang} setPrayerLang={setPrayerLang} showPron={showPron} setShowPron={setShowPron} pronType={pronType} setPronType={setPronType} pronAllowed={pronAllowed} pronLabel={pronLabel} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// --- Sub-Components ---
function StatsView({ history, lifetimeTotal, currentDecades }) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="rounded-2xl p-6 bg-emerald-50 border-emerald-100 text-center"><Trophy className="h-6 w-6 text-emerald-500 mx-auto mb-2" /><div className="text-4xl font-black text-emerald-900">{lifetimeTotal + currentDecades}</div><div className="text-[10px] font-black uppercase text-emerald-600">Lifetime Decades</div></Card>
                <Card className="rounded-2xl p-6 bg-blue-50 border-blue-100 text-center"><History className="h-6 w-6 text-blue-500 mx-auto mb-2" /><div className="text-4xl font-black text-blue-900">{history.length + 1}</div><div className="text-[10px] font-black uppercase text-blue-600">Days Tracked</div></Card>
            </div>
            <Card className="rounded-2xl"><CardHeader><CardTitle className="text-slate-900">Activity Journal</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    {history.map((h, i) => <div key={i} className="flex justify-between border-b border-slate-50 py-3 text-sm font-medium text-slate-700"><span>{formatDisplayDate(h.date)}</span><span>{h.decades} Decades</span></div>)}
                </CardContent>
            </Card>
        </div>
    );
}

function LibraryView({ keys, prayerLang, setPrayerLang, showPron, setShowPron, pronType, setPronType, pronAllowed, pronLabel }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader><CardTitle className="flex items-center gap-2 text-slate-900"><Languages className="h-5 w-5" /> Prayer Library</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Select value={prayerLang} onValueChange={setPrayerLang}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="la">Latin</SelectItem><SelectItem value="pl">Polish</SelectItem></SelectContent></Select>
          <div className="flex items-center justify-between rounded-2xl border p-3 bg-white"><div className="flex items-center gap-2"><Mic2 className="h-4 w-4 text-slate-600" /><span className="text-sm font-medium text-slate-700">Pronunciation</span></div><Switch checked={showPron} onCheckedChange={setShowPron} /></div>
          <Select value={pronType} onValueChange={setPronType}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="simple">Simple</SelectItem><SelectItem value="ipa">IPA</SelectItem></SelectContent></Select>
        </div>
        <Separator /><div className="space-y-4">{keys.map(k => <PrayerBlock key={k} title={PRAYERS[k].title} body={PRAYERS[k].text[prayerLang]} pron={PRAYERS[k].pron?.[prayerLang]?.[pronType]} showPron={pronAllowed} pronLabel={pronLabel} />)}</div>
      </CardContent>
    </Card>
  );
}

function PrayerBlock({ title, body, pron, showPron, pronLabel }) {
  const lines = (body || "").split("\n").filter(l => l.trim() !== "");
  return (
    <div className="mb-8">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">{title}</div>
      {lines.map((ln, idx) => (
        <div key={idx} className="rounded-xl border border-slate-100 p-3 mb-2 bg-white shadow-sm">
            <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">{ln}</div>
            {showPron && pron?.[idx] && (<div className="mt-2 text-xs text-slate-500 italic border-t border-slate-50 pt-2"><span className="font-bold text-slate-400">{pronLabel}: </span>{pron[idx]}</div>)}
        </div>
      ))}
    </div>
  );
}