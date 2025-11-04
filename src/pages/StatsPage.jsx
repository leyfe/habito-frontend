import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody } from "@nextui-org/react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import HeaderBar from "../components/layout/HeaderBar";
import { addDays, toISO, api } from "../components";


export default function StatsPage() {
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});

  useEffect(()=>{ (async ()=>{
    const hs=await api("/habits"); if(!hs) return;
    setHabits(hs);
    const map={};
    for(const h of hs){
      const rows=await api(`/habits/${h.id}/completions`);
      map[h.id]=Object.fromEntries((rows||[]).map(r=>[toISO(new Date(r.date)), Number(r.count||0)]));
    }
    setCompletions(map);
  })(); }, []);

  const week = useMemo(()=>{
    const s=new Date(); s.setDate(s.getDate()-((s.getDay()+6)%7));
    return Array.from({length:7},(_,i)=>toISO(addDays(s,i)));
  }, []);

  const totals = useMemo(()=>{
    let target=0, achieved=0;
    for(const h of habits){
      const t=h.times_per_week || (h.frequency==="täglich"?7:0);
      target+=t;
      const by=completions[h.id]||{};
      achieved+=week.reduce((a,iso)=> a+(by[iso]>0?1:0), 0);
    }
    const pct=target?Math.round((achieved/target)*100):0;
    return { target, achieved, pct };
  }, [habits,completions,week]);

  return (
    <div className="min-h-screen">
      <HeaderBar
        left={

          <div className="flex items-center gap-2">
            <Button
              size="lg"
              variant="light"
              color="default"
              radius="full"
              isIconOnly
              onPress={() => navigate("/")}
            >
              <ArrowLeft size={18} />
            </Button>
            <div className="font-semibold">Statistiken</div>
          </div>
        }
      />

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardBody><div className="text-3xl font-semibold">{totals.pct}%</div><div className="text-xs text-foreground-500">Erfüllt</div></CardBody></Card>
        <Card><CardBody><div className="text-3xl font-semibold">{totals.achieved}</div><div className="text-xs text-foreground-500">Erledigt</div></CardBody></Card>
        <Card><CardBody><div className="text-3xl font-semibold">{totals.target}</div><div className="text-xs text-foreground-500">Ziel</div></CardBody></Card>
      </div>
    </div>
  );
}