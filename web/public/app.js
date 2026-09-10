const $=id=>document.getElementById(id), fileInput=$("portfolioFile"), analyseButton=$("analyseButton"), fileName=$("fileName");
const CUSTOMER_ACTION_LABELS={BUY_CANDIDATE:"Review candidate",EXIT_TARGET:"Target reached — review",WAIT_FOR_EXIT_WINDOW:"Legacy holding — review",REVIEW_ROTATION:"Rotation review",STRONG_ROTATION_REVIEW:"Strong rotation review",HOLD:"No current review"};
const customerActionLabel=a=>CUSTOMER_ACTION_LABELS[a]||String(a??"");
let selectedFile=null,pollTimer=null,activeJobId=null,currentResult=null;
function showError(id,message){const el=$(id);el.textContent=message;el.classList.remove("hidden")}
function money(v){if(v===null||v===undefined||Number.isNaN(Number(v)))return"N/A";const n=Number(v),a=Math.abs(n);if(a>=1e7)return`₹${(n/1e7).toFixed(2)} Cr`;if(a>=1e5)return`₹${(n/1e5).toFixed(2)} L`;if(a>=1e3)return`₹${(n/1e3).toFixed(1)} K`;return`₹${n.toLocaleString("en-IN",{maximumFractionDigits:0})}`}
function pct(v){return v===null||v===undefined||Number.isNaN(Number(v))?"N/A":`${Number(v).toFixed(1)}%`}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function formatIst(iso){if(!iso)return"Not available";try{const d=new Date(iso);if(Number.isNaN(d.getTime()))return String(iso);const parts=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"long",year:"numeric",hour:"numeric",minute:"2-digit",hour12:true}).formatToParts(d);const get=t=>parts.find(x=>x.type===t)?.value||"";return`${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")} ${get("dayPeriod").toUpperCase()} IST`}catch{return String(iso)}}
function marketStatusLabel(status){return({RECENT:"Recent",STALE:"Older data",UNVERSIONED:"Unavailable"}[status]||"Unavailable")}
function setStatus(title,text,badge,progress){$("statusTitle").textContent=title;$("statusText").textContent=text;$("statusBadge").textContent=badge;$("progressBar").style.width=`${progress}%`}
function table(headers,rows){if(!rows.length)return`<div class="empty">No data available.</div>`;return`<table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table>`}
function sortableHoldingsTable(holdings){
 if(!holdings.length)return`<div class="empty">No data available.</div>`;
 const actions=new Map((currentResult.decisions?.portfolio_actions||[]).map(a=>[a.symbol,a]));
 const columns=[
  {label:"Symbol",key:"symbol",type:"text",render:x=>esc(x.symbol)},
  {label:"Accounts",key:"in_portfolio",type:"text",render:x=>esc(x.in_portfolio||"MAIN")},
  {label:"Holding Type",key:"portfolio_class",type:"text",render:x=>esc(x.portfolio_class==="CORE"?"Core holding":x.portfolio_class==="LEGACY"?"Legacy holding":"Outside Quantvesting Universe")},
  {label:"Shares",key:"shares",type:"number",render:x=>esc(x.shares)},
  {label:"Avg Cost",key:"avg_cost",type:"number",render:x=>money(x.avg_cost)},
  {label:"Current",key:"current_value",type:"number",render:x=>money(x.current)},
  {label:"Allocation",key:"current_allocation_pct",type:"number",render:x=>pct(x.current_allocation_pct)},
  {label:"FTT",key:"target",type:"number",render:x=>money(x.target)},
  {label:"Profit %",key:"current_pnl_pct",type:"number",render:x=>pct(x.current_pnl_pct)},
  {label:"Upside",key:"remaining_upside_pct",type:"number",render:x=>pct(x.remaining_upside_pct)},
  {label:"Review",key:"review",type:"text",render:x=>esc(customerActionLabel(actions.get(x.symbol)?.action||"HOLD"))}
 ];
 let sortKey="symbol",sortDir=1;
 const wrap=document.createElement("div");
 const render=()=>{
  const sorted=[...holdings].sort((a,b)=>{
   const av=sortKey==="review"?(actions.get(a.symbol)?.action||"HOLD"):a[sortKey];
   const bv=sortKey==="review"?(actions.get(b.symbol)?.action||"HOLD"):b[sortKey];
   if(columns.find(c=>c.key===sortKey)?.type==="text") return String(av??"").localeCompare(String(bv??""))*sortDir;
   const an=Number(av),bn=Number(bv);
   if(!Number.isFinite(an)&&!Number.isFinite(bn)) return a.symbol.localeCompare(b.symbol);
   if(!Number.isFinite(an)) return 1;
   if(!Number.isFinite(bn)) return -1;
   return (an-bn)*sortDir || a.symbol.localeCompare(b.symbol);
  });
  wrap.innerHTML=`<table class="sortable-table"><thead><tr>${columns.map(c=>`<th><button type="button" class="sort-button" data-sort-key="${c.key}" aria-label="Sort by ${esc(c.label)}">${esc(c.label)} <span class="sort-indicator">${sortKey===c.key?(sortDir===1?"↑":"↓"):"↕"}</span></button></th>`).join("")}</tr></thead><tbody>${sorted.map(x=>`<tr>${columns.map(c=>`<td>${c.render(x)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  wrap.querySelectorAll(".sort-button").forEach(btn=>btn.addEventListener("click",()=>{const key=btn.dataset.sortKey;if(sortKey===key)sortDir*=-1;else{sortKey=key;sortDir=1;}render()}));
 };
 render();
 return wrap;
}
function renderHomeOpportunities(payload){
 const section=$("homeOpportunitySection"); if(!section)return;
 const opportunities=payload?.opportunities||[];
 const status=payload?.meta?.market_snapshot_status||"UNVERSIONED", asOf=payload?.meta?.market_snapshot_as_of;
 $("homeOpportunityMeta").textContent=opportunities.length?`Market data updated: ${formatIst(asOf)} · ${marketStatusLabel(status)}`:"Opportunity data is currently unavailable.";
 $("homeOpportunitiesTable").innerHTML=table(["Rank","Symbol","Conviction","Category","CMP","Target","Upside"],opportunities.slice(0,8).map(x=>[x.rank,esc(x.symbol),esc(x.conviction),esc(x.category),money(x.cmp),money(x.target),pct(x.upside_pct)]));
}
async function loadHomeOpportunities(){
 try{const r=await fetch("/api/public/opportunities",{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to load the Opportunity Universe.");renderHomeOpportunities(d)}catch(e){renderHomeOpportunities({opportunities:[]})}
}

function renderHoldingCards(holdings){
 const wrap=$("holdingsCards"); if(!wrap)return;
 const actions=new Map((currentResult?.decisions?.portfolio_actions||[]).map(a=>[a.symbol,a]));
 if(!holdings.length){wrap.innerHTML='<div class="empty">No data available.</div>';return}
 wrap.innerHTML=holdings.map(x=>{
  const action=customerActionLabel(actions.get(x.symbol)?.action||"HOLD");
  const type=x.portfolio_class==="CORE"?"Core holding":x.portfolio_class==="LEGACY"?"Legacy holding":"Outside Quantvesting Universe";
  return `<article class="holding-card"><div class="holding-card-head"><div><div class="holding-symbol">${esc(x.symbol)}</div><div class="holding-review pill">${esc(action)}</div></div><div class="eyebrow">${esc(type)}</div></div><div class="holding-current">${money(x.current)}</div><div class="holding-upside">Remaining upside · ${pct(x.remaining_upside_pct)}</div><div class="holding-meta"><div class="holding-meta-item"><div class="label">Allocation</div><div class="value">${pct(x.current_allocation_pct)}</div></div><div class="holding-meta-item"><div class="label">Profit</div><div class="value">${pct(x.current_pnl_pct)}</div></div><div class="holding-meta-item"><div class="label">Shares</div><div class="value">${esc(x.shares)}</div></div><div class="holding-meta-item"><div class="label">Avg Cost</div><div class="value">${money(x.avg_cost)}</div></div></div><div class="holding-details">FTT ${money(x.target)} · Account ${esc(x.in_portfolio||"MAIN")}</div></article>`;
 }).join("");
}
function renderResult(result){
 currentResult=result;
 const t=result.terminal||{},h=result.portfolio?.holdings||[],kpis=[["Current Value",money(t.current_value)],["Deployed Value",money(t.deployed_value)],["Total Holdings",String(h.length)],["Target Value",money(t.target_value)],["Target Profit",`${money(t.target_profit)} (${pct(t.target_profit_pct)})`]];
 const snapshotStatus=result.meta?.market_snapshot_status||"UNVERSIONED",snapshotAsOf=result.meta?.market_snapshot_as_of;
 $("kpis").innerHTML=kpis.map(([l,v])=>`<div class="kpi"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("")+`<div class="snapshot-note"><strong>Market data updated:</strong> ${esc(formatIst(snapshotAsOf))} · ${esc(marketStatusLabel(snapshotStatus))}</div>`;
 $("healthScore").innerHTML=`<div class="health-score-value">${pct(t.in_portfolio_health_pct)}</div><div><div class="health-score-label">Portfolio Health</div><div class="health-score-note">Share of portfolio value currently meeting the framework's health conditions. This is separate from portfolio allocation.</div></div>`;
 const a=[["Core Holdings",pct(t.core_allocation_pct)],["Legacy Holdings",pct(t.legacy_allocation_pct)],["Outside Quantvesting Universe",pct(t.out_of_universe_allocation_pct)]];$("healthGrid").innerHTML=a.map(([l,v])=>`<div class="health-item"><div class="value">${v}</div><div class="label">${l}</div></div>`).join("")+`<div class="allocation-total">Portfolio allocation <strong>${pct(t.allocation_total_pct ?? (Number(t.core_allocation_pct||0)+Number(t.legacy_allocation_pct||0)+Number(t.out_of_universe_allocation_pct||0)))}</strong></div>`;
 const c=[["Top 5",pct(t.top5_concentration_pct)],["Top 10",pct(t.top10_concentration_pct)],["Top 20",pct(t.top20_concentration_pct)]];$("concentrationGrid").innerHTML=c.map(([l,v])=>`<div class="health-item"><div class="value">${v}</div><div class="label">${l} concentration</div></div>`).join("");
 const holdingsWrap=sortableHoldingsTable(h);const holdingsTable=$("holdingsTable");holdingsTable.innerHTML="";holdingsTable.appendChild(holdingsWrap);renderHoldingCards(h);
 const pa=result.decisions?.portfolio_actions||[];$("portfolioActions").innerHTML=pa.length?pa.map(x=>`<div class="qv-action"><span class="pill">${esc(customerActionLabel(x.action))}</span><strong>${esc(x.symbol)}</strong><div>${esc(x.reason)}<div class="evidence">${esc(x.evidence)}</div></div></div>`).join(""):"<div class='empty'>No portfolio actions at current thresholds.</div>";
 const ra=result.decisions?.capital_rotation||[];$("rotationActions").innerHTML=ra.length?ra.map(x=>`<div class="qv-action"><span class="pill">${esc(customerActionLabel(x.action))}</span><strong>${esc(x.symbol)}</strong><div>Compare with <strong>${esc(x.alternative_symbol)}</strong> · ${pct(x.alternative_upside_pct)} reference upside · rank ${esc(x.alternative_rank)}</div></div>`).join(""):"<div class='empty'>No capital-rotation candidates at the current configured thresholds.</div>";
 const o=result.opportunities||[];$("opportunitiesTable").innerHTML=table(["Rank","Symbol","Conviction","Category","CMP","Target","Upside","Signal"],o.map(x=>[x.rank,esc(x.symbol),esc(x.conviction),esc(x.category),money(x.cmp),money(x.target),pct(x.upside_pct),esc(customerActionLabel(x.action))]));
 const j=result.journey||[];$("journeyTable").innerHTML=table(["Date","Portfolio Value","Deployed","Portfolio Health","Core Holdings","Legacy Holdings","Outside Quantvesting Universe"],j.map(x=>[esc(x.date),money(x.current_value),money(x.deployed_value),pct(x.health_pct),pct(x.core_pct),pct(x.legacy_pct),pct(x.out_of_universe_pct)]));
 $("statusView").classList.add("hidden");$("uploadView").classList.add("hidden");$("homeOpportunitySection")?.classList.add("hidden");$("resultView").classList.remove("hidden");$("downloadPdf").disabled=false;
}
function buildPrintableAssessment(){const source=$("resultView");if(!source)return null;const clone=source.cloneNode(true);clone.classList.remove("hidden");clone.classList.add("print-document");clone.querySelector(".result-actions")?.remove();clone.querySelector("#featureTabs")?.remove();clone.querySelector("#pdfError")?.remove();clone.querySelector(".assessment-cta")?.remove();clone.querySelector("#tab-guide")?.remove();clone.querySelectorAll(".tab-panel").forEach(panel=>{panel.classList.remove("hidden");panel.removeAttribute("hidden")});return clone}
function downloadPdf(){const button=$("downloadPdf");$("pdfError")?.classList.add("hidden");const clone=buildPrintableAssessment();if(!clone){showError("pdfError","The assessment report is not ready to print. Please start a new assessment.");return}button.disabled=true;button.textContent="Preparing print view…";const frame=document.createElement("iframe");frame.className="pdf-print-frame";frame.setAttribute("aria-hidden","true");document.body.appendChild(frame);const doc=frame.contentDocument;const base=document.createElement("base");base.href=new URL("/",window.location.origin).href;doc.head.appendChild(base);const meta=document.createElement("meta");meta.name="viewport";meta.content="width=device-width, initial-scale=1";doc.head.appendChild(meta);const title=document.createElement("title");title.textContent="Quantvesting Portfolio Assessment";doc.head.appendChild(title);const link=document.createElement("link");link.rel="stylesheet";link.href="/styles.css";doc.head.appendChild(link);const style=document.createElement("style");style.textContent="html,body{margin:0;background:#fff}.print-document{max-width:1120px;margin:0 auto}.print-document .tab-panel{display:block!important}.print-document .table-wrap{overflow:visible}.print-document .table-wrap table{min-width:0;width:100%}";doc.head.appendChild(style);doc.body.appendChild(clone);let printed=false,cleaned=false;const cleanup=()=>{if(cleaned)return;cleaned=true;frame.remove();button.disabled=false;button.textContent="Print / Save Assessment PDF"};const print=()=>{if(printed)return;printed=true;try{frame.contentWindow.focus();frame.contentWindow.print()}catch(e){cleanup();showError("pdfError","Unable to open the print dialog. Please try again.")}};frame.contentWindow.addEventListener("afterprint",cleanup);const waitForReady=async()=>{try{if(link.sheet){}await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;resolve()};link.addEventListener("load",finish,{once:true});link.addEventListener("error",finish,{once:true});setTimeout(finish,1500)});if(doc.fonts?.ready)await Promise.race([doc.fonts.ready,new Promise(r=>setTimeout(r,1000))]);}finally{setTimeout(print,50)}};doc.close();waitForReady();setTimeout(()=>{if(!printed)print()},3000);setTimeout(cleanup,300000)}
async function poll(jobId){try{const r=await fetch(`/api/jobs/${encodeURIComponent(jobId)}`,{cache:"no-store"}),d=await r.json();if(!r.ok)throw Error(d.error||"Unable to read assessment status.");if(d.status==="READY"&&d.result){clearInterval(pollTimer);pollTimer=null;activeJobId=jobId;d.result.job_id=jobId;renderResult(d.result);return}if(d.status==="FAILED"){clearInterval(pollTimer);pollTimer=null;activeJobId=null;$("newAssessmentPending").classList.remove("hidden");setStatus("We couldn't complete the assessment",d.error||"Assessment processing failed. Start a new assessment to try again.","FAILED",100);return}$("newAssessmentPending").classList.remove("hidden");setStatus(d.status==="PROCESSING"?"Your assessment is being analysed":"Preparing your assessment",d.status==="PROCESSING"?"Your portfolio is being analysed. You can start a new assessment at any time.":"Your portfolio has been received and is being analysed automatically.",d.status,d.status==="PROCESSING"?65:35)}catch(e){$("newAssessmentPending").classList.remove("hidden");showError("statusError",e.message)}}
fileInput?.addEventListener("change",()=>{selectedFile=fileInput.files?.[0]||null;fileName.textContent=selectedFile?selectedFile.name:"No file selected";analyseButton.disabled=!selectedFile;$("uploadError").classList.add("hidden")});
analyseButton?.addEventListener("click",async()=>{if(!selectedFile)return;analyseButton.disabled=true;$("uploadError").classList.add("hidden");$("statusView").classList.remove("hidden");setStatus("Uploading your portfolio","Securely sending your portfolio for assessment.","UPLOADING",15);try{const form=new FormData();form.append("file",selectedFile);const r=await fetch("/api/guest/assessments",{method:"POST",body:form}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||`Upload failed (HTTP ${r.status}).`);localStorage.setItem("quantvesting_job_id",d.job_id);activeJobId=d.job_id;setStatus("Preparing your assessment","Your portfolio is being prepared for analysis.","PENDING",35);$("newAssessmentPending").classList.remove("hidden");await poll(d.job_id);clearInterval(pollTimer);pollTimer=setInterval(()=>poll(activeJobId),3000)}catch(e){$("statusView").classList.add("hidden");showError("uploadError",e.message);analyseButton.disabled=false}});
function startNewAssessment(){clearInterval(pollTimer);pollTimer=null;activeJobId=null;currentResult=null;localStorage.removeItem("quantvesting_job_id");selectedFile=null;if(fileInput)fileInput.value="";if(fileName)fileName.textContent="No file selected";if(analyseButton)analyseButton.disabled=true;$("statusError")?.classList.add("hidden");$("pdfError")?.classList.add("hidden");$("resultView")?.classList.add("hidden");$("statusView")?.classList.add("hidden");$("uploadView")?.classList.remove("hidden");$("homeOpportunitySection")?.classList.remove("hidden");document.querySelectorAll(".upload-tabs .tab").forEach(x=>x.classList.toggle("active",x.dataset.uploadTab==="upload"));$("upload-panel")?.classList.remove("hidden");$("about-panel")?.classList.add("hidden");$("upload-guide-panel")?.classList.add("hidden")}
$("downloadPdf")?.addEventListener("click",downloadPdf);$("newAssessment")?.addEventListener("click",startNewAssessment);$("newAssessmentPending")?.addEventListener("click",startNewAssessment);
document.querySelectorAll("#featureTabs .tab").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("#featureTabs .tab").forEach(x=>x.classList.toggle("active",x===btn));document.querySelectorAll("#featureTabs + .tab-panel, #featureTabs ~ .tab-panel").forEach(x=>x.classList.add("hidden"));$("tab-"+btn.dataset.tab).classList.remove("hidden")}));
document.querySelectorAll(".upload-tabs button.tab").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".upload-tabs .tab").forEach(x=>x.classList.toggle("active",x===btn));const upload=$("upload-panel"),about=$("about-panel"),guide=$("upload-guide-panel");upload?.classList.toggle("hidden",btn.dataset.uploadTab!=="upload");about?.classList.toggle("hidden",btn.dataset.uploadTab!=="about");guide?.classList.toggle("hidden",btn.dataset.uploadTab!=="upload-guide")}));
const existingJob=localStorage.getItem("quantvesting_job_id");if(existingJob){activeJobId=existingJob;$("uploadView").classList.add("hidden");$("statusView").classList.remove("hidden");$("newAssessmentPending").classList.remove("hidden");setStatus("Restoring your assessment","Checking the latest assessment status.","PROCESSING",50);poll(existingJob);pollTimer=setInterval(()=>poll(activeJobId),3000)}else $("newAssessmentPending").classList.add("hidden");
loadHomeOpportunities();
