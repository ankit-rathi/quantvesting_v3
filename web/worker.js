/** Quantvesting Cloudflare-native production gateway + assessment engine. */
import { assessPortfolio, buildOpportunities, csvParse, loadMarketData, loadMarketSnapshotMetadata } from "./engine/quantvesting.js";

const JSON_HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
const MAX_UPLOAD_BYTES=10*1024*1024, STALE_PROCESSING_MS=30*60*1000, JOB_PREFIX="jobs/", PORTFOLIO_PREFIX="portfolio_data/", USER_PREFIX="users/", AUTH_PREFIX="auth/", ASSESSMENT_PREFIX="assessments/";
const MARKET_FILES={screener:"myScreenerDB.csv",prospects:"myProspectsScrips.csv",momentum:"myProspects-Momentum.csv",technical:"technical.csv",relative_strength:"relative_strength.csv"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
const nowIso=()=>new Date().toISOString(), newId=()=>crypto.randomUUID();
const jobKey=id=>`${JOB_PREFIX}${id}.json`, uploadKey=id=>`${JOB_PREFIX}${id}/portfolio.csv`, resultKey=id=>`${JOB_PREFIX}${id}/result.json`;
const portfolioKey=(email,name="myPortfolioStocks.csv")=>`${PORTFOLIO_PREFIX}${email}/${name}`;
const latestKey=portfolioId=>`${PORTFOLIO_PREFIX}${portfolioId}/latest-assessment.json`;
const journeyKey=portfolioId=>`${PORTFOLIO_PREFIX}${portfolioId}/journey.json`;
const assessmentKey=id=>`${ASSESSMENT_PREFIX}${id}.json`;
const marketMetadataKey="market_data/metadata.json";
const userKey=email=>`${USER_PREFIX}${email}.json`;
async function readJson(b,k){const o=await b.get(k);return o?o.json():null}
async function writeJson(b,k,v){await b.put(k,JSON.stringify(v),{httpMetadata:{contentType:"application/json"}})}
function adminAuthorized(r,e){const t=r.headers.get("x-admin-token");return !!(e.ADMIN_TOKEN&&t&&t===e.ADMIN_TOKEN)}
function safeFileName(n){return String(n||"portfolio.csv").replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,120)}
function normalizeEmail(v){const e=String(v||"").trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))throw new Error("Please provide a valid email address.");return e}
function cookieValue(r,name){return (r.headers.get("cookie")||"").split(/;\s*/).find(x=>x.startsWith(name+"="))?.slice(name.length+1)||null}
async function session(r,e){const token=cookieValue(r,"qv_session");if(!token)return null;const s=await readJson(e.QUANTVESTING_DATA,`${AUTH_PREFIX}sessions/${token}.json`);if(!s||new Date(s.expires_at)<=new Date())return null;return s}

async function createJob(env,{portfolioId,userId=null,inputBytes,originalFilename,kind="GUEST"}){
  const jobId=newId(),createdAt=nowIso();
  if(inputBytes)await env.QUANTVESTING_DATA.put(uploadKey(jobId),inputBytes,{httpMetadata:{contentType:"text/csv"}});
  const job={job_id:jobId,portfolio_id:portfolioId,user_id:userId,status:"PENDING",kind,original_filename:originalFilename,created_at:createdAt,updated_at:createdAt};
  await writeJson(env.QUANTVESTING_DATA,jobKey(jobId),job);return job;
}
async function parseUpload(request){
  if(Number(request.headers.get("content-length")||0)>MAX_UPLOAD_BYTES)throw Object.assign(new Error("Portfolio file is too large. Maximum size is 10 MB."),{status:413});
  const form=await request.formData(),file=form.get("file");
  if(!(file instanceof File))throw new Error("Please upload a CSV portfolio file.");
  if(file.size>MAX_UPLOAD_BYTES)throw Object.assign(new Error("Portfolio file is too large. Maximum size is 10 MB."),{status:413});
  const name=safeFileName(file.name);if(!name.toLowerCase().endsWith(".csv"))throw new Error("For this beta, please upload a CSV file.");
  return {bytes:await file.arrayBuffer(),name};
}

async function sendVerificationEmail(email,code,env){
  const subject="Your Quantvesting verification code";
  const text=`Your Quantvesting verification code is ${code}. It expires in 15 minutes.`;
  if(env.EMAIL_PROVIDER==="resend"){
    if(!env.RESEND_API_KEY||!env.RESEND_FROM)throw Object.assign(new Error("Resend email delivery is not configured."),{status:503});
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
    try{
      const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${env.RESEND_API_KEY}`},body:JSON.stringify({from:env.RESEND_FROM,to:[email],subject,text}),signal:controller.signal});
      const body=await r.text();
      if(!r.ok){console.error(`Resend returned ${r.status}: ${body.slice(0,500)}`);throw Object.assign(new Error("Verification email provider rejected the request."),{status:502});}
      return;
    }catch(err){console.error("Resend email delivery failed",err);if(err.status)throw err;throw Object.assign(new Error("Verification email delivery failed."),{status:502});}
    finally{clearTimeout(timeout);}
  }
  if(env.EMAIL_WEBHOOK_URL){
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await fetch(env.EMAIL_WEBHOOK_URL,{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${env.EMAIL_WEBHOOK_TOKEN||""}`},body:JSON.stringify({email,code,purpose:"quantvesting-login"}),signal:controller.signal});
      const body=await response.text();
      if(!response.ok){console.error(`Email webhook returned ${response.status}: ${body.slice(0,500)}`);throw Object.assign(new Error("Verification email provider rejected the request."),{status:502});}
      return;
    }catch(err){console.error("Email webhook delivery failed",err);if(err.status)throw err;throw Object.assign(new Error("Verification email delivery failed."),{status:502});}
    finally{clearTimeout(timeout);}
  }
  if(env.ALLOW_DEV_AUTH==="true")return "DEV";
  throw Object.assign(new Error("Email delivery is not configured. Set EMAIL_PROVIDER/RESEND secrets or EMAIL_WEBHOOK_URL."),{status:503});
}

async function handleRegister(request,env){
  let body;try{body=await request.json()}catch{return json({error:"Invalid request. Please enter your email address again."},400)}
  let email;try{email=normalizeEmail(body?.email)}catch(err){return json({error:err.message},400)}
  const code=String(Math.floor(100000+Math.random()*900000));
  await writeJson(env.QUANTVESTING_DATA,`${AUTH_PREFIX}codes/${email}.json`,{email,code,expires_at:new Date(Date.now()+15*60e3).toISOString()});
  try{
    const mode=await sendVerificationEmail(email,code,env);
    if(mode==="DEV")return json({message:"Development verification code generated.",dev_code:code},202);
    return json({message:"Verification code sent."},202);
  }catch(err){console.error("Verification delivery error",err);return json({error:err.message||"We couldn't send the verification code right now.",diagnostic_id:`AUTH-${newId().slice(0,8).toUpperCase()}`},err.status||502)}
}
async function handleVerify(request,env){
  let body;try{body=await request.json()}catch{return json({error:"Invalid verification request."},400)}
  const {email:raw,code}=body||{};let email;try{email=normalizeEmail(raw)}catch(err){return json({error:err.message},400)}
  const pending=await readJson(env.QUANTVESTING_DATA,`${AUTH_PREFIX}codes/${email}.json`);
  if(!pending||pending.code!==String(code)||new Date(pending.expires_at)<=new Date())return json({error:"Invalid or expired verification code."},401);
  const user=(await readJson(env.QUANTVESTING_DATA,userKey(email)))||{user_id:email,email,portfolio_id:email,created_at:nowIso()};
  user.verified_at=nowIso();await writeJson(env.QUANTVESTING_DATA,userKey(email),user);await env.QUANTVESTING_DATA.delete(`${AUTH_PREFIX}codes/${email}.json`);
  const token=newId(),expires=new Date(Date.now()+7*86400e3).toISOString();await writeJson(env.QUANTVESTING_DATA,`${AUTH_PREFIX}sessions/${token}.json`,{email,user_id:user.user_id,portfolio_id:user.portfolio_id,expires_at:expires});
  return new Response(JSON.stringify({email,verified:true}),{headers:{...JSON_HEADERS,"set-cookie":`qv_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`}});
}

async function handleRegisteredAssessment(request,env,ctx){
  const s=await session(request,env);if(!s)return json({error:"Sign in before saving a portfolio."},401);
  try{const {bytes,name}=await parseUpload(request);const email=normalizeEmail(s.email);await env.QUANTVESTING_DATA.put(portfolioKey(email),bytes,{httpMetadata:{contentType:"text/csv"}});const job=await createJob(env,{portfolioId:s.portfolio_id,userId:s.user_id,inputBytes:bytes,originalFilename:name,kind:"REGISTERED"});ctx.waitUntil(processAssessment(job.job_id,env));return json({job_id:job.job_id,portfolio_id:job.portfolio_id,status:job.status,persisted:true,processing:"cloudflare"},201)}catch(e){return json({error:e.message},e.status||400)}
}
async function handleGuestAssessment(request,env,ctx){try{const {bytes,name}=await parseUpload(request);const id=`guest-${newId().slice(0,8)}`,job=await createJob(env,{portfolioId:id,inputBytes:bytes,originalFilename:name,kind:"GUEST"});ctx.waitUntil(processAssessment(job.job_id,env));return json({job_id:job.job_id,portfolio_id:id,status:job.status,persisted:false,processing:"cloudflare"},201)}catch(e){return json({error:e.message},e.status||400)}}
async function handlePublicOpportunities(env){
  try{
    const marketSnapshot=await loadMarketSnapshotMetadata(env);
    if(!marketSnapshot?.snapshot_id)return json({error:"No active market snapshot is published."},503);
    const data=await loadMarketData(env,env.ASSETS);
    return json({opportunities:buildOpportunities(data,[]),meta:{market_snapshot_as_of:marketSnapshot.as_of||null,market_snapshot_status:marketSnapshot.as_of?(Date.now()-Date.parse(marketSnapshot.as_of)<=48*60*60*1000?"RECENT":"STALE"):"UNVERSIONED",market_snapshot_source:marketSnapshot.source||null}});
  }catch(e){console.error("Public opportunity universe error",e);return json({error:"Opportunity universe is currently unavailable."},503)}
}

async function getJob(id,env){return readJson(env.QUANTVESTING_DATA,jobKey(id));}
async function handleJobStatus(id,request,env){const j=await getJob(id,env);if(!j)return json({error:"Assessment not found."},404);const result=await readJson(env.QUANTVESTING_DATA,resultKey(id));return json({...j,result:result||null})}

async function processAssessment(id,env){
  const job=await getJob(id,env);if(!job)return;
  try{
    job.status="PROCESSING";job.updated_at=nowIso();job.processing_mode="cloudflare";await writeJson(env.QUANTVESTING_DATA,jobKey(id),job);
    const input=await env.QUANTVESTING_DATA.get(uploadKey(id));if(!input)throw new Error("Portfolio input not found.");
    const portfolio=csvParse(await input.text());
    const marketSnapshot=await loadMarketSnapshotMetadata(env);
    if(!marketSnapshot?.snapshot_id)throw new Error("No active market snapshot is published. Please refresh market data before running assessments.");
    const data=await loadMarketData(env,env.ASSETS);
    const old=job.kind==="REGISTERED"?(await readJson(env.QUANTVESTING_DATA,journeyKey(job.portfolio_id))||[]):[];
    const assessment=await assessPortfolio(portfolio,data,old,marketSnapshot);
    const publishedAt=nowIso();
    const published={status:"READY",portfolio_id:job.portfolio_id,run_id:newId(),engine_version:assessment.meta.engine_version,strategy_version:"0.5",terminal:assessment.terminal,portfolio:assessment.portfolio,decisions:assessment.decisions,opportunities:assessment.opportunities,journey:assessment.journey,meta:assessment.meta,published_at:publishedAt};
    await writeJson(env.QUANTVESTING_DATA,resultKey(id),published);await writeJson(env.QUANTVESTING_DATA,assessmentKey(id),published);
    if(job.kind==="REGISTERED"){
      await writeJson(env.QUANTVESTING_DATA,latestKey(job.portfolio_id),{assessment_id:id,updated_at:published.published_at});
      await writeJson(env.QUANTVESTING_DATA,journeyKey(job.portfolio_id),assessment.journey);
    }
    job.status="READY";job.updated_at=published.published_at;job.error=null;await writeJson(env.QUANTVESTING_DATA,jobKey(id),job);
  }catch(err){console.error(`Cloudflare assessment ${id} failed`,err);job.status="FAILED";job.error=String(err?.message||err).slice(0,1000);job.updated_at=nowIso();await writeJson(env.QUANTVESTING_DATA,jobKey(id),job);}
}

async function latestForSession(s,env){const p=await readJson(env.QUANTVESTING_DATA,latestKey(s.portfolio_id));if(!p?.assessment_id)return null;return readJson(env.QUANTVESTING_DATA,assessmentKey(p.assessment_id));}
function pdfEscape(value){return String(value??"").replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)").replace(/[^\x20-\x7E]/g,"?")}
function pdfMoney(value){if(value===null||value===undefined||Number.isNaN(Number(value)))return"N/A";const n=Number(value),a=Math.abs(n);if(a>=1e7)return`INR ${(n/1e7).toFixed(2)} Cr`;if(a>=1e5)return`INR ${(n/1e5).toFixed(2)} L`;if(a>=1e3)return`INR ${(n/1e3).toFixed(1)} K`;return`INR ${n.toLocaleString("en-IN",{maximumFractionDigits:0})}`}
function pdfPct(value){return value===null||value===undefined||Number.isNaN(Number(value))?"N/A":`${Number(value).toFixed(1)}%`}
function pdfDateTime(iso){if(!iso)return"Not available";try{return new Date(iso).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"long",year:"numeric",hour:"numeric",minute:"2-digit",hour12:true})+" IST"}catch{return String(iso)}}
export function buildAssessmentPdf(result){
  const lines=[];const add=(text="",size=9,bold=false)=>lines.push({text:String(text),size,bold});
  const t=result?.terminal||{},m=result?.meta||{};
  add("QUANTVESTING",18,true);add("Portfolio Assessment",13,true);add(`Assessment date: ${pdfDateTime(result?.published_at||m.generated_at)}`,9);add("");
  add("PORTFOLIO SUMMARY",11,true);
  add(`Current value: ${pdfMoney(t.current_value)}    Deployed value: ${pdfMoney(t.deployed_value)}`,9);
  add(`Target value: ${pdfMoney(t.target_value)}`,9);
  add(`Target profit: ${pdfMoney(t.target_profit)} (${pdfPct(t.target_profit_pct)})`,9);
  add(`Portfolio Health: ${pdfPct(t.in_portfolio_health_pct)}`,9);
  add("");
  add("MARKET DATA",11,true);add(`Updated: ${pdfDateTime(m.market_snapshot_as_of)}`,9);add(`Status: ${String(m.market_snapshot_status||"UNVERSIONED").toLowerCase()}`,9);add("");
  add("ALLOCATION & CONCENTRATION",11,true);add(`Core holdings: ${pdfPct(t.core_allocation_pct)}    Legacy holdings: ${pdfPct(t.legacy_allocation_pct)}    Outside universe: ${pdfPct(t.out_of_universe_allocation_pct)}`,9);add(`Top 5: ${pdfPct(t.top5_concentration_pct)}    Top 10: ${pdfPct(t.top10_concentration_pct)}    Top 20: ${pdfPct(t.top20_concentration_pct)}`,9);add("");
  const holdings=result?.portfolio?.holdings||[];
  const allocBase=holdings.reduce((sum,x)=>sum+(Number.isFinite(x.current_value)?x.current_value:0),0);
  add("HOLDINGS",11,true);add(`Total holdings: ${holdings.length}`,9);
  for(const x of holdings){const action=(result?.decisions?.portfolio_actions||[]).find(a=>a.symbol===x.symbol)?.action||"HOLD";const allocation=allocBase>0&&Number.isFinite(x.current_value)?(x.current_value*100/allocBase).toFixed(1)+"%":"N/A";add(`${x.symbol} | ${x.shares} shares | Avg ${pdfMoney(x.avg_cost)} | Current ${pdfMoney(x.current)} | Allocation ${allocation} | Target ${pdfMoney(x.target)} | Profit ${pdfPct(x.current_pnl_pct)} | Upside ${pdfPct(x.remaining_upside_pct)} | Review: ${customerPdfAction(action)}`,8)}
  add("");add("REVIEW AREAS",11,true);
  const pa=result?.decisions?.portfolio_actions||[];if(!pa.length)add("No portfolio actions at current thresholds.",9);else for(const x of pa)add(`${x.symbol} — ${customerPdfAction(x.action)} — ${x.reason||""}`,8);
  add("");add("CAPITAL ROTATION REVIEW",11,true);const ra=result?.decisions?.capital_rotation||[];if(!ra.length)add("No capital-rotation candidates at the current configured thresholds.",9);else for(const x of ra)add(`${x.symbol} — compare with ${x.alternative_symbol} — reference upside ${pdfPct(x.alternative_upside_pct)}`,8);
  add("");add("OPPORTUNITY UNIVERSE",11,true);add("Securities covered by the Quantvesting universe and ranked for review. Not investment recommendations.",8);for(const x of (result?.opportunities||[]))add(`${x.rank}. ${x.symbol} | ${x.conviction||""} | ${x.category||""} | CMP ${pdfMoney(x.cmp)} | Target ${pdfMoney(x.target)} | Upside ${pdfPct(x.upside_pct)}`,8);
  add("");add("MY JOURNEY",11,true);for(const x of (result?.journey||[]))add(`${x.date} | Value ${pdfMoney(x.current_value)} | Health ${pdfPct(x.health_pct)} | Core ${pdfPct(x.core_pct)} | Legacy ${pdfPct(x.legacy_pct)} | Outside ${pdfPct(x.out_of_universe_pct)}`,8);
  add("");add("IMPORTANT DISCLOSURE",11,true);add("Quantvesting is not a SEBI-registered Investment Adviser. This assessment is provided for educational and informational purposes only and is based on a rules-based analytical framework and data available at the stated time. It is not investment advice or a recommendation to buy, sell or hold any security. Quantvesting does not execute trades or manage client funds. Market data and analytical inputs may be delayed, incomplete or subject to error.",8);
  const pageH=842,margin=42,contentH=pageH-2*margin;let pages=[],page=[],used=0;
  for(const line of lines){const size=line.size||9;const chars=Math.max(45,Math.floor(92*(9/size)));const words=line.text.split(/\s+/);let chunk="";const chunks=[];for(const w of words){if((chunk+" "+w).trim().length>chars&&chunk){chunks.push(chunk);chunk=w}else chunk=(chunk+" "+w).trim()}if(chunk||!words.length)chunks.push(chunk);for(const c of chunks){const h=size+5;if(used+h>contentH){pages.push(page);page=[];used=0}page.push({text:c,size,bold:line.bold});used+=h}}
  if(page.length)pages.push(page);
  const objects=[];const addObj=x=>{objects.push(x);return objects.length};const catalog=addObj(null),pagesObj=addObj(null),font=addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");const pageRefs=[];
  for(const pg of pages){let stream="BT\n";let y=pageH-margin;for(const l of pg){const fs=l.size||9;y-=fs;stream+=`/F1 ${fs} Tf ${l.bold?"0.8":"0.25"} g 1 0 0 1 ${margin} ${y} Tm (${pdfEscape(l.text)}) Tj\n`;y-=5}stream+="ET";const content=addObj(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);const pageRef=addObj(null);pageRefs.push(pageRef);objects[pageRef-1]=`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${595} ${pageH}] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${content} 0 R >>`}
  objects[pagesObj-1]=`<< /Type /Pages /Kids [${pageRefs.map(r=>`${r} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`;objects[catalog-1]=`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
  let pdf="%PDF-1.4\n%Quantvesting\n";const offsets=[0];for(let n=0;n<objects.length;n++){offsets.push(pdf.length);pdf+=`${n+1} 0 obj\n${objects[n]}\nendobj\n`}const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let n=1;n<offsets.length;n++)pdf+=`${String(offsets[n]).padStart(10,"0")} 00000 n \n`;pdf+=`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;return pdf}
function customerPdfAction(a){return ({BUY_CANDIDATE:"Review candidate",EXIT_TARGET:"Target reached - review",WAIT_FOR_EXIT_WINDOW:"Legacy holding - review",REVIEW_ROTATION:"Rotation review",STRONG_ROTATION_REVIEW:"Strong rotation review",HOLD:"No current review"}[a]||String(a||""))}
async function handleAssessmentPdf(id,env){const j=await getJob(id,env);if(!j)return json({error:"Assessment not found."},404);const result=await readJson(env.QUANTVESTING_DATA,resultKey(id));if(!result||result.status!=="READY")return json({error:"Assessment PDF is not available until the assessment is complete."},409);const pdf=buildAssessmentPdf(result);return new Response(pdf,{headers:{"content-type":"application/pdf","content-disposition":`attachment; filename="quantvesting-assessment-${id.slice(0,8)}.pdf"`,"cache-control":"no-store"}})}
async function featureEndpoint(kind,request,env){
  const s=await session(request,env);if(!s)return json({error:"Sign in to view saved portfolio data."},401);
  const result=await latestForSession(s,env);if(!result)return json({error:"No completed assessment found."},404);
  if(kind==="portfolio")return json(result.portfolio);
  if(kind==="decisions")return json(result.decisions);
  if(kind==="opportunities")return json({opportunities:result.opportunities});
  return json({journey:result.journey});
}


async function handleClaim(request,env){
  if(!adminAuthorized(request,env))return json({error:"Unauthorized."},401);
  const workerId=(await request.json().catch(()=>({}))).worker_id||"worker";
  const listed=await env.QUANTVESTING_DATA.list({prefix:JOB_PREFIX,limit:1000});
  const now=Date.now(); const jobs=[];
  for(const x of listed.objects){
    if(!/^jobs\/[^/]+\.json$/.test(x.key))continue;
    const j=await readJson(env.QUANTVESTING_DATA,x.key); if(!j)continue;
    if(j.status==="PENDING" || (j.status==="PROCESSING"&&j.updated_at&&now-Date.parse(j.updated_at)>STALE_PROCESSING_MS))jobs.push(j);
  }
  jobs.sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));
  const j=jobs[0]; if(!j)return json({job:null});
  j.status="PROCESSING";j.claimed_by=workerId;j.claimed_at=j.updated_at=nowIso();
  await writeJson(env.QUANTVESTING_DATA,jobKey(j.job_id),j); return json({job:j});
}
async function handleAdminInput(id,request,env){
  if(!adminAuthorized(request,env))return json({error:"Unauthorized."},401);
  const j=await getJob(id,env);if(!j)return json({error:"Job not found."},404);
  const o=await env.QUANTVESTING_DATA.get(uploadKey(id));if(!o)return json({error:"Portfolio input not found."},404);
  return new Response(o.body,{headers:{"content-type":"text/csv","cache-control":"no-store"}});
}
async function handleAdminResult(id,request,env){
  if(!adminAuthorized(request,env))return json({error:"Unauthorized."},401);const j=await getJob(id,env);if(!j)return json({error:"Job not found."},404);
  const body=await request.json();if(body?.status!=="READY")return json({error:"Result payload must have status=READY."},400);
  const published=nowIso();await writeJson(env.QUANTVESTING_DATA,resultKey(id),{...body,job_id:id,portfolio_id:j.portfolio_id,published_at:published});
  j.status="READY";j.updated_at=published;await writeJson(env.QUANTVESTING_DATA,jobKey(id),j);return json({job_id:id,status:"READY"});
}
async function handleAdminFailure(id,request,env){
  if(!adminAuthorized(request,env))return json({error:"Unauthorized."},401);const j=await getJob(id,env);if(!j)return json({error:"Job not found."},404);
  const body=await request.json().catch(()=>({}));j.status="FAILED";j.error=String(body.error||"Assessment processing failed.").slice(0,1000);j.updated_at=nowIso();await writeJson(env.QUANTVESTING_DATA,jobKey(id),j);return json({job_id:id,status:"FAILED"});
}

async function handleAdminJobs(request,env){
  if(!adminAuthorized(request,env))return json({error:"Unauthorized."},401);const listed=await env.QUANTVESTING_DATA.list({prefix:JOB_PREFIX,limit:1000});const jobs=[];
  for(const x of listed.objects){if(!/^jobs\/[^/]+\.json$/.test(x.key))continue;const j=await readJson(env.QUANTVESTING_DATA,x.key);if(j)jobs.push(j)}jobs.sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));return json({jobs});
}
async function handleRetryStale(request,env){
  if(!adminAuthorized(request,env))return json({error:"Unauthorized."},401);const cutoff=Date.now()-STALE_PROCESSING_MS,listed=await env.QUANTVESTING_DATA.list({prefix:JOB_PREFIX,limit:1000}),requeued=[];
  for(const x of listed.objects){if(!/^jobs\/[^/]+\.json$/.test(x.key))continue;const j=await readJson(env.QUANTVESTING_DATA,x.key);if(j?.status!=="PROCESSING"||!j.updated_at||Date.parse(j.updated_at)>cutoff)continue;j.status="PENDING";j.requeued_at=nowIso();j.requeued_reason="manual-stale-retry";j.updated_at=j.requeued_at;await writeJson(env.QUANTVESTING_DATA,x.key,j);requeued.push(j.job_id)}return json({requeued,stale_after_minutes:STALE_PROCESSING_MS/60000});
}
async function handleAdminMarketData(request,env,name){
  if(!adminAuthorized(request,env))return json({error:"Unauthorized."},401);if(!Object.values(MARKET_FILES).includes(name))return json({error:"Unsupported market snapshot."},400);const text=await request.text();const rows=csvParse(text);if(!rows.length)return json({error:"CSV is empty."},400);await env.QUANTVESTING_DATA.put(`market_data/${name}`,text,{httpMetadata:{contentType:"text/csv"}});return json({status:"ok",file:name,rows:rows.length});
}
async function handleAdminMarketSnapshot(request,env){
  if(!adminAuthorized(request,env))return json({error:"Unauthorized."},401);
  const body=await request.json().catch(()=>null);
  if(!body?.snapshot_id||!body?.schema_version||!body?.files)return json({error:"Invalid market snapshot metadata."},400);
  await writeJson(env.QUANTVESTING_DATA,marketMetadataKey,body);
  return json({status:"ok",snapshot_id:body.snapshot_id,as_of:body.as_of||null});
}
async function getMarketMetadata(env){return readJson(env.QUANTVESTING_DATA,marketMetadataKey);}
async function route(r,e,ctx){
  const p=new URL(r.url).pathname;
  if(r.method==="GET"&&p==="/api/health")return json({service:"quantvesting",status:"ok",mode:"cloudflare-native",jupyter_independent:true});
  if(r.method==="POST"&&p==="/api/auth/register")return handleRegister(r,e);
  if(r.method==="POST"&&p==="/api/auth/verify")return handleVerify(r,e);
  if(r.method==="GET"&&p==="/api/auth/me"){const s=await session(r,e);return s?json({email:s.email,authenticated:true}):json({authenticated:false})}
  if(r.method==="POST"&&p==="/api/assessments")return handleRegisteredAssessment(r,e,ctx);
  if(r.method==="POST"&&p==="/api/guest/assessments")return handleGuestAssessment(r,e,ctx);
  if(r.method==="POST"&&p==="/api/jobs")return handleGuestAssessment(r,e,ctx);
  if(r.method==="GET"&&p==="/api/public/opportunities")return handlePublicOpportunities(e);
  let m=p.match(/^\/api\/(?:jobs|assessments)\/([^/]+)$/);if(r.method==="GET"&&m)return handleJobStatus(m[1],r,e);
  m=p.match(/^\/api\/jobs\/([^/]+)\/pdf$/);if(r.method==="GET"&&m)return handleAssessmentPdf(m[1],e);
  if(r.method==="GET"&&p==="/api/portfolio")return featureEndpoint("portfolio",r,e);
  if(r.method==="GET"&&p==="/api/decisions")return featureEndpoint("decisions",r,e);
  if(r.method==="GET"&&p==="/api/opportunities")return featureEndpoint("opportunities",r,e);
  if(r.method==="GET"&&p==="/api/journey")return featureEndpoint("journey",r,e);
  if(r.method==="GET"&&p==="/api/admin/jobs")return handleAdminJobs(r,e);
  if(r.method==="POST"&&p==="/api/admin/jobs/retry-stale")return handleRetryStale(r,e);if(r.method==="POST"&&p==="/api/admin/jobs/claim")return handleClaim(r,e);
  if(r.method==="PUT"&&p.startsWith("/api/admin/market-data/"))return handleAdminMarketData(r,e,p.split("/").pop());
  if(r.method==="PUT"&&p==="/api/admin/market-snapshot")return handleAdminMarketSnapshot(r,e);
  if(r.method==="GET"&&p==="/api/admin/market-snapshot"){
    if(!adminAuthorized(r,e))return json({error:"Unauthorized."},401);
    const metadata=await loadMarketSnapshotMetadata(e);
    if(!metadata?.snapshot_id)return json({snapshot_id:null,available:false,files:{}});
    const files={};
    for(const name of Object.values(MARKET_FILES)){
      const object=await e.QUANTVESTING_DATA.head(`market_data/${name}`);
      const expected=metadata.files?.[name]||null;
      files[name]={
        available:Boolean(object),
        rows:expected?.rows??null,
        sha256:expected?.sha256??null,
        size_bytes:object?.size??null,
      };
    }
    return json({...metadata,available:Object.values(files).every(x=>x.available),files});
  }
  m=p.match(/^\/api\/admin\/jobs\/([^/]+)\/input$/);if(r.method==="GET"&&m)return handleAdminInput(m[1],r,e);m=p.match(/^\/api\/admin\/jobs\/([^/]+)\/result$/);if(r.method==="POST"&&m)return handleAdminResult(m[1],r,e);m=p.match(/^\/api\/admin\/jobs\/([^/]+)\/failure$/);if(r.method==="POST"&&m)return handleAdminFailure(m[1],r,e);return e.ASSETS.fetch(r);
}
export class JobCoordinator {
  constructor(state,env){this.env=env}
  async fetch(request){
    if(request.method!=="POST")return new Response("Not found",{status:404});
    const body=await request.json().catch(()=>({})),workerId=body.workerId||"worker";
    const listed=await this.env.QUANTVESTING_DATA.list({prefix:JOB_PREFIX,limit:1000}),now=Date.now(),jobs=[];
    for(const x of listed.objects){if(!/^jobs\/[^/]+\.json$/.test(x.key))continue;const j=await readJson(this.env.QUANTVESTING_DATA,x.key);if(!j)continue;if(j.status==="PENDING"||(j.status==="PROCESSING"&&j.updated_at&&now-Date.parse(j.updated_at)>STALE_PROCESSING_MS)){if(j.status!=="PENDING"){j.status="PENDING";j.updated_at=nowIso();await writeJson(this.env.QUANTVESTING_DATA,x.key,j)}jobs.push(j)}}
    jobs.sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));const j=jobs[0];if(!j)return json({job:null});j.status="PROCESSING";j.claimed_by=workerId;j.claimed_at=j.updated_at=nowIso();await writeJson(this.env.QUANTVESTING_DATA,jobKey(j.job_id),j);return json({job:j});
  }
}

export default {async fetch(r,e,ctx){try{return await route(r,e,ctx)}catch(err){console.error(err);return json({error:"Unexpected server error.",details:String(err?.message||err)},500)}}};
