/* Cloudflare-native Quantvesting engine.
 *
 * This is deliberately independent of Jupyter/Colab. It consumes the same
 * exported Quantvesting market snapshots used by the notebooks and implements
 * the five customer capabilities: onboarding, portfolio, decisions,
 * opportunities and journey. It is deterministic and does not place trades.
 */

import { SHORT_DISCLAIMER, FULL_DISCLAIMER, customerActionLabel, customerActionReason } from "./compliance.js";

const MARKET_FILES = {
  screener: "myScreenerDB.csv",
  prospects: "myProspectsScrips.csv",
  momentum: "myProspects-Momentum.csv",
  technical: "technical.csv",
  relative_strength: "relative_strength.csv",
};
const CORE_CONVICTIONS = new Set(["X-LC","H-LC","X-MC","X-SC","M-LC","H-MC"]);
const CONVICTION_PRIORITY = {"X-LC":0,"H-LC":1,"X-MC":2,"X-SC":3,"M-LC":4,"H-MC":5,"H-SC":6,"L-LC":7,"M-MC":8,"M-SC":9,"L-MC":10,"L-SC":11};

export function csvParse(text) {
  const rows=[]; let row=[]; let cell=""; let quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){
      if(c==='"'){
        if(text[i+1]==='"'){cell+='"';i++;} else quoted=false;
      } else cell+=c;
    } else if(c==='"') quoted=true;
    else if(c===','){row.push(cell);cell="";}
    else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell="";}
    else if(c!=='\r') cell+=c;
  }
  if(cell.length || row.length){row.push(cell);rows.push(row);}
  if(!rows.length) return [];
  const headers=rows.shift().map(h=>String(h).trim());
  return rows.filter(r=>r.some(v=>String(v).trim()!=="")).map(r=>Object.fromEntries(headers.map((h,i)=>[h,String(r[i]??"").trim()])));
}
const num=(v,d=null)=>{if(v===null||v===undefined||String(v).trim()==="")return d;const n=Number(String(v).replace(/,/g,""));return Number.isFinite(n)?n:d};
const pct=(v,d=1)=>Number.isFinite(v)?Number(v.toFixed(d)):null;
const money=(v)=>Number.isFinite(v)?Math.round(v):null;
const csvEscape=v=>{const s=String(v??"");return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s};
export function csvStringify(rows){
  if(!rows.length)return "";
  const cols=[...new Set(rows.flatMap(r=>Object.keys(r)))];
  return [cols.map(csvEscape).join(","),...rows.map(r=>cols.map(c=>csvEscape(r[c])).join(","))].join("\n");
}

async function getMarketText(env, assets, filename, optional=false){
  const r2=await env.QUANTVESTING_DATA.get(`market_data/${filename}`);
  if(r2) return r2.text();
  const response=await assets.fetch(new Request(`https://assets/market_data/${filename}`));
  if(!response.ok){
    if(optional) return "";
    throw new Error(`Market snapshot ${filename} is unavailable.`);
  }
  return response.text();
}

export async function loadMarketSnapshotMetadata(env){
  const r2=await env.QUANTVESTING_DATA.get("market_data/metadata.json");
  return r2 ? r2.json() : null;
}

export async function loadMarketData(env, assets){
  const [screener,prospects,momentum,technical,relative_strength]=await Promise.all([
    getMarketText(env,assets,MARKET_FILES.screener),
    getMarketText(env,assets,MARKET_FILES.prospects),
    getMarketText(env,assets,MARKET_FILES.momentum, true),
    getMarketText(env,assets,MARKET_FILES.technical, true),
    getMarketText(env,assets,MARKET_FILES.relative_strength, true),
  ]);
  return {
    screener:csvParse(screener),
    prospects:csvParse(prospects),
    momentum:csvParse(momentum),
    technical:csvParse(technical),
    relative_strength:csvParse(relative_strength),
  };
}

export function normalizePortfolio(rows){
  if(!rows.length) throw new Error("Portfolio upload is empty.");
  const keys=Object.keys(rows[0]);
  const find=(names)=>{const m=new Map(keys.map(k=>[k.toLowerCase().replace(/\s+/g,""),k]));for(const n of names){const k=m.get(n.toLowerCase().replace(/\s+/g,""));if(k)return k;}return null;};
  const symbol=find(["Symbol","Ticker","Scrip"]), shares=find(["Shares","Quantity","Qty"]), avg=find(["AvgCost","Average Cost","Average Price","Avg Price","Buy Price"]), account=find(["InPortfolio","Account","Portfolio"]);
  if(!symbol||!shares||!avg) throw new Error("Portfolio upload is missing required fields: Symbol, Shares and AvgCost.");
  const out=[];
  for(let i=0;i<rows.length;i++){
    const s=String(rows[i][symbol]||"").trim().toUpperCase(), q=num(rows[i][shares]), c=num(rows[i][avg]);
    if(!s||q===null||c===null||q<=0||c<0) throw new Error(`Portfolio upload contains invalid Symbol, Shares or AvgCost at row ${i+2}.`);
    out.push({Symbol:s,Shares:q,AvgCost:c,InPortfolio:account?String(rows[i][account]||"MAIN").trim()||"MAIN":"MAIN"});
  }
  // Canonical portfolio contract: aggregate economically by Symbol regardless
  // of account labels. Account membership is preserved as a symbol-level
  // attribute (for example ABBOTINDIA DM + SV -> one 6-share holding).
  const map=new Map();
  for(const r of out){
    const x=map.get(r.Symbol)||{Symbol:r.Symbol,Shares:0,cost:0,accounts:[]};
    x.Shares+=r.Shares;
    x.cost+=r.Shares*r.AvgCost;
    if(r.InPortfolio && !x.accounts.includes(r.InPortfolio)) x.accounts.push(r.InPortfolio);
    map.set(r.Symbol,x);
  }
  return [...map.values()].map(x=>({
    Symbol:x.Symbol,
    Shares:x.Shares,
    AvgCost:Number((x.cost/x.Shares).toFixed(2)),
    InPortfolio:x.accounts.join("+")||"MAIN"
  }));
}

function prospectMap(data){const m=new Map();for(const r of data.prospects){const s=String(r.Symbol||"").trim().toUpperCase();if(s)m.set(s,r);}return m;}
function screenerMap(data){const m=new Map();for(const r of data.screener){const s=String(r.Symbol||"").trim().toUpperCase();if(s)m.set(s,r);}return m;}

function classify(prospect,screener){
  const base=String(prospect?.Conviction||"").trim();
  const cap=String(screener?.CapType||"").trim();
  const conviction=base && cap ? `${base}-${cap}` : base;
  const core=CORE_CONVICTIONS.has(conviction);
  return {conviction,portfolioClass:core?"CORE":"LEGACY",priority:CONVICTION_PRIORITY[conviction]??9999};
}

function buildHoldings(portfolio,data){
  const pm=prospectMap(data), sm=screenerMap(data);
  const tm=new Map((data.technical||[]).map(r=>[String(r.Symbol||"").trim().toUpperCase(),r]));
  const rm=new Map((data.relative_strength||[]).map(r=>[String(r.Symbol||"").trim().toUpperCase(),r]));
  return portfolio.map(h=>{
    const s=pm.get(h.Symbol), sc=sm.get(h.Symbol), tc=tm.get(h.Symbol), rs=rm.get(h.Symbol), cls=classify(s,sc);
    const screenerCmp=num(sc?.CMP), cmp=num(tc?.Close,screenerCmp);
    const target=num(s?.Target), strategy=String(s?.Strategy||"").trim().toUpperCase();
    const screenerAthPct=num(sc?.ATH);
    const maxFromScreener=(cmp!==null&&screenerAthPct!==null&&screenerAthPct<100)?cmp/(1-screenerAthPct/100):null;
    const maxPrice=num(tc?.Max,maxFromScreener);
    const minPrice=num(tc?.Min);
    const prevClose=num(tc?.Prev_Close);
    const ftt=strategy==="NTT"?target:maxPrice;
    const investment=h.Shares*h.AvgCost, current=cmp===null?null:cmp*h.Shares;
    const currentPnl=current===null?null:current-investment;
    const currentPnlPct=investment>0&&current!==null?(currentPnl*100/investment):null;
    const todayPnlPct=prevClose!==null&&prevClose>0&&cmp!==null?(cmp-prevClose)*100/prevClose:null;
    const remaining=cmp!==null&&ftt!==null&&cmp>0?(ftt-cmp)*100/cmp:null;
    const thesis=cmp!==null&&ftt!==null&&ftt>h.AvgCost?(cmp-h.AvgCost)/(ftt-h.AvgCost):null;
    const fttPct=cmp!==null&&ftt!==null&&cmp>0?(ftt-cmp)*100/cmp:null;
    const rrr=currentPnl!==null&&fttPct!==null&&fttPct!==0?currentPnl/(fttPct*current/100):null;
    const gained=cmp!==null&&minPrice!==null&&minPrice>0?(cmp-minPrice)*100/minPrice:null;
    return {symbol:h.Symbol,shares:h.Shares,avg_cost:h.AvgCost,in_portfolio:h.InPortfolio,current:money(current),current_value:current,investment:money(investment),valuation_basis:cmp===null?"unavailable":"canonical snapshot price",cmp,target,ftt:money(ftt),strategy:strategy||null,conviction:cls.conviction,portfolio_class:cls.portfolioClass,priority:cls.priority,latest_qtr:num(s?.LatestQtr),star_stock:num(s?.StarStock),category:s?.Category||null,reasoning:s?.Reasoning||null,prev_close:prevClose,rsi_14:num(tc?.RSI_14),rsp:num(rs?.RSP),spread_pct:num(tc?.SpreadPct, num(tc?.["Spread%"])),dev_200:num(tc?.DevPct_200, num(tc?.["Dev%_200"])),gained_pct:gained,current_pnl:money(currentPnl),current_pnl_pct:pct(currentPnlPct),today_pnl_pct:pct(todayPnlPct),ftt_pct:pct(fttPct),rrr:rrr===null?null:pct(rrr,2),remaining_upside_pct:remaining===null?null:pct(remaining),thesis_captured:thesis,thesis_captured_pct:thesis===null?null:pct(thesis*100,1)};
  });
}

function analyzeAllocation(holdings,portfolio,data){
  const universe=prospectMap(data); let core=0,legacy=0,out=0;
  for(const h of holdings){
    if(h.current===null) continue;
    if(universe.has(h.symbol)){ if(h.portfolio_class==="CORE")core+=h.current; else legacy+=h.current; }
    else out+=h.current ?? h.investment;
  }
  const allocationTotal=core+legacy+out;
  const inUniverseTotal=core+legacy;
  const safePortfolioTotal=inUniverseTotal>0?inUniverseTotal:portfolio.reduce((a,h)=>a+h.Shares*h.AvgCost,0);
  const safeAllocationTotal=allocationTotal>0?allocationTotal:safePortfolioTotal;
  return {total_value:money(safePortfolioTotal),allocation_total_value:money(safeAllocationTotal),core_value:money(core),legacy_value:money(legacy),out_of_universe_value:money(out),core_pct:pct(safeAllocationTotal>0?core*100/safeAllocationTotal:null),legacy_pct:pct(safeAllocationTotal>0?legacy*100/safeAllocationTotal:null),out_of_universe_pct:pct(safeAllocationTotal>0?out*100/safeAllocationTotal:null),total_pct:pct(safeAllocationTotal>0?(core+legacy+out)*100/safeAllocationTotal:0,1)};
}

export function buildOpportunities(data, holdings){
  const held=new Set(holdings.map(h=>h.symbol));
  const sm=screenerMap(data);
  const tm=new Map((data.technical||[]).map(r=>[String(r.Symbol||"").trim().toUpperCase(),r]));
  return data.prospects.map(r=>{
    const symbol=String(r.Symbol||"").trim().toUpperCase(), sc=sm.get(symbol), tc=tm.get(symbol), cls=classify(r,sc);
    const cmp=num(tc?.Close,num(sc?.CMP)), target=num(r.Target), strategy=String(r.Strategy||"").trim().toUpperCase();
    const ath=num(tc?.Max,num(sc?.ATH));
    const ftt=strategy==="NTT"?target:ath;
    return {symbol,rank:num(r.CumlRnk),conviction:cls.conviction,portfolio_class:cls.portfolioClass,category:r.Category||null,cmp,target,ftt,upside_pct:cmp!==null&&ftt!==null&&cmp>0?pct((ftt-cmp)*100/cmp):null,latest_qtr:num(r.LatestQtr),star_stock:num(r.StarStock),held:held.has(symbol),reasoning:r.Reasoning||null,criteria:r.Criteria||null,strategy:r.Strategy||null};
  }).filter(x=>x.portfolio_class==="CORE" && x.rank!==null).sort((a,b)=>a.rank-b.rank).slice(0,40).filter(x=>x.upside_pct!==null && x.upside_pct>20).map((x,i)=>({...x,action:"BUY_CANDIDATE",opportunity_band:i<1?"HIGH":i<3?"ATTRACTIVE":"WATCH"}));
}

function buildDecisions(holdings,opportunities){
  const portfolio_actions=holdings.map(h=>{
    let action="HOLD",reason="No configured review threshold is currently met.";
    if(h.portfolio_class==="LEGACY"){action="WAIT_FOR_EXIT_WINDOW";reason="Legacy holding retained in the framework; review the underlying evidence when appropriate.";}
    if(h.thesis_captured!==null && h.portfolio_class==="CORE" && h.thesis_captured>=0.80){action="REVIEW_ROTATION";reason="The configured thesis-capture threshold has been reached; compare the evidence with the available Quantvesting universe.";}
    if(h.cmp!==null&&h.ftt!==null&&h.cmp>=h.ftt){action="EXIT_TARGET";reason="Current price has reached or exceeded the configured FTT reference level.";}
    return {symbol:h.symbol,action,customer_action:customerActionLabel(action),reason:customerActionReason(action,reason),remaining_upside_pct:h.remaining_upside_pct,evidence:`Captured=${h.thesis_captured===null?"N/A":(h.thesis_captured*100).toFixed(0)+"%"} | Remaining upside=${h.remaining_upside_pct===null?"N/A":h.remaining_upside_pct.toFixed(1)+"%"}`};
  }).sort((a,b)=>{
    const av=Number.isFinite(a.remaining_upside_pct)?a.remaining_upside_pct:Infinity;
    const bv=Number.isFinite(b.remaining_upside_pct)?b.remaining_upside_pct:Infinity;
    return av-bv || a.symbol.localeCompare(b.symbol);
  });
  const best=opportunities.find(o=>o.upside_pct!==null&&o.upside_pct>=20);
  const rotation=best?holdings.filter(h=>h.portfolio_class==="CORE"&&h.thesis_captured!==null&&h.thesis_captured>=0.80).map(h=>({symbol:h.symbol,action:"REVIEW_ROTATION",customer_action:customerActionLabel("REVIEW_ROTATION"),reason:"The configured thesis-capture threshold has been reached; compare the evidence with the available Quantvesting universe.",thesis_captured_pct:h.thesis_captured_pct,thesis_captured:h.thesis_captured,alternative_symbol:best.symbol,alternative_rank:best.rank,alternative_upside_pct:best.upside_pct})):[ ];
  return {portfolio_actions,prospect_actions:opportunities,capital_rotation:rotation};
}

function buildJourney(holdings,allocation,health,existing){
  const history=Array.isArray(existing)?existing.slice():[];
  const snapshot={date:new Date().toISOString().slice(0,10),current_value:allocation.total_value,deployed_value:money(holdings.reduce((a,h)=>a+h.investment,0)),health_pct:health,core_pct:allocation.core_pct,legacy_pct:allocation.legacy_pct,out_of_universe_pct:allocation.out_of_universe_pct};
  if(!history.some(x=>x.date===snapshot.date))history.push(snapshot); else history[history.findIndex(x=>x.date===snapshot.date)]=snapshot;
  return history.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}

export async function assessPortfolio(portfolio,data,existingJourney=[],marketSnapshot=null){
  const normalizedPortfolio=normalizePortfolio(portfolio);
  const holdings=buildHoldings(normalizedPortfolio,data);
  const allocation=analyzeAllocation(holdings,normalizedPortfolio,data);
  const inUniverse=holdings.filter(h=>prospectMap(data).has(h.symbol));
  const healthyValue=inUniverse.filter(h=>h.latest_qtr===1&&h.star_stock===1).reduce((a,h)=>a+(h.current||0),0);
  const health=allocation.total_value>0?pct(healthyValue*100/allocation.total_value):null;
  const inUniverseSet=new Set(holdings.filter(h=>prospectMap(data).has(h.symbol)).map(h=>h.symbol));
  const deployed=holdings.filter(h=>inUniverseSet.has(h.symbol)).reduce((a,h)=>a+h.investment,0);
  const targetValue=holdings.reduce((a,h)=>a+(h.ftt!==null?h.ftt*h.shares:0),0);
  const opportunities=buildOpportunities(data,holdings);
  const decisions=buildDecisions(holdings,opportunities);
  const top=holdings.filter(h=>h.current!==null).sort((a,b)=>b.current-a.current), totalIn=top.reduce((a,h)=>a+(h.current||0),0);
  const concentration=n=>pct(totalIn>0 ? top.slice(0,n).reduce((a,h)=>a+(h.current||0),0)*100/totalIn : null);
  const journey=buildJourney(holdings,allocation,health,existingJourney);
  const allocationTotalValue=holdings.reduce((sum,h)=>sum+(Number.isFinite(h.current_value)?h.current_value:0),0);
  for(const h of holdings){ h.current_allocation_pct=allocationTotalValue>0&&Number.isFinite(h.current_value)?pct(h.current_value*100/allocationTotalValue):null; }
  return {
    terminal:{current_value:allocation.total_value,deployed_value:money(deployed),cagr_xirr:null,target_value:money(targetValue),target_profit:targetValue>0?money(targetValue-allocation.total_value):null,target_profit_pct:allocation.total_value>0?pct((targetValue-allocation.total_value)*100/allocation.total_value):null,in_portfolio_health_pct:health,core_allocation_pct:allocation.core_pct,legacy_allocation_pct:allocation.legacy_pct,out_of_universe_allocation_pct:allocation.out_of_universe_pct,allocation_total_pct:allocation.total_pct,top5_concentration_pct:concentration(5),top10_concentration_pct:concentration(10),top20_concentration_pct:concentration(20)},
    portfolio:{holdings,allocation},
    decisions,
    opportunities,
    journey,
    meta:{engine:"cloudflare-native",engine_version:"cf-1.3",market_snapshot:marketSnapshot?.snapshot_id||"unversioned",market_snapshot_as_of:marketSnapshot?.as_of||null,market_snapshot_source:marketSnapshot?.source||null,market_snapshot_status:marketSnapshot?.as_of?(Date.now()-Date.parse(marketSnapshot.as_of)<=48*60*60*1000?"RECENT":"STALE"):"UNVERSIONED",generated_at:new Date().toISOString(),disclaimer:SHORT_DISCLAIMER,full_disclaimer:FULL_DISCLAIMER}
  };
}

export function marketDataCsv(data){return {screener:csvStringify(data.screener),prospects:csvStringify(data.prospects),momentum:csvStringify(data.momentum)};}
