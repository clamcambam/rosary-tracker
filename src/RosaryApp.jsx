
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

  const totalDecadesDone = useMemo(() => sets.reduce((sum, s) => sum + s.decades.filter(Boolean).length, 0), [sets]);
  const mysteriesCompleted = useMemo(() => sets.filter((s) => s.decades.every(Boolean)).length, [sets]);
  const closingEnabled = mysteriesCompleted >= 1;
  const dailyPct = Math.min(100, Math.round((totalDecadesDone / DAILY_DECADE_GOAL) * 100));

  // --- COMBINED CARPLAY / SIRI LOGIC ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');

    // Handle "Mark Decade" command
    if (action === 'markDecade') {
      setSets(prevSets => {
        const setIndex = prevSets.findIndex(s => s.decades.includes(false));
        
        if (setIndex !== -1) {
          // 1. Create a deep copy of the specific set to ensure React detects the change
          const updatedSet = { 
            ...prevSets[setIndex], 
            decades: [...prevSets[setIndex].decades] 
          };
          
          // 2. Mark the first available 'false' as 'true'
          const decadeIndex = updatedSet.decades.indexOf(false);
          updatedSet.decades[decadeIndex] = true;

          // 3. Create a new array for the state update
          const newSets = [...prevSets];
          newSets[setIndex] = updatedSet;

          // 4. Voice feedback
          const speech = new SpeechSynthesisUtterance("Decade marked complete.");
          window.speechSynthesis.speak(speech);
          
          return newSets;
        }
        return prevSets;
      });

      // Clear the URL to prevent double-triggering on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Handle "Get Status" command
    if (action === 'getStatus') {
      const remaining = DAILY_DECADE_GOAL - totalDecadesDone;
      const msg = `You have completed ${totalDecadesDone} decades. You have ${remaining} left to reach your daily goal.`;
      
      const speech = new SpeechSynthesisUtterance(msg);
      window.speechSynthesis.speak(speech);

      // Clear the URL
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
