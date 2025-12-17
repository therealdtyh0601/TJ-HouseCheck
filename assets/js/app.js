// Lumi Free · 阳宅三部曲 Lite
// 逻辑：内挂(卧室) 60% + 外挂(常用) 25% + 空间(厕所/厨房/阳台) 15%
// 输出：按“家人”聚合点名，给出“先改谁/先看哪里”的行动建议

const BAGUA = [
  // 3x3 layout (like 九宫格方便用户）
  // NW, N, NE / W, C, E / SW, S, SE (C is placeholder)
  { key:"NW", name:"西北", gua:"乾", role:"爸爸/男主人", emoji:"🧔" },
  { key:"N",  name:"北",   gua:"坎", role:"中子",       emoji:"👦" },
  { key:"NE", name:"东北", gua:"艮", role:"幼子",       emoji:"🧒" },
  { key:"W",  name:"西",   gua:"兑", role:"幼女",       emoji:"👧" },
  { key:"C",  name:"中宫", gua:"—",  role:"—",          emoji:"🧭", center:true },
  { key:"E",  name:"东",   gua:"震", role:"长子",       emoji:"🧑‍🎓" },
  { key:"SW", name:"西南", gua:"坤", role:"妈妈/女主人", emoji:"👩" },
  { key:"S",  name:"南",   gua:"离", role:"中女",       emoji:"🧑‍🦰" },
  { key:"SE", name:"东南", gua:"巽", role:"长女",       emoji:"👩‍🎓" },
];

const PEOPLE = [
  { id:"none", label:"—（没有/不适用）" },
  { id:"dad", label:"🧔 爸爸 / 男主人（乾）" },
  { id:"mom", label:"👩 妈妈 / 女主人（坤）" },
  { id:"son1", label:"🧑‍🎓 长子（震）" },
  { id:"son2", label:"👦 中子（坎）" },
  { id:"son3", label:"🧒 幼子（艮）" },
  { id:"girl1", label:"👩‍🎓 长女（巽）" },
  { id:"girl2", label:"🧑‍🦰 中女（离）" },
  { id:"girl3", label:"👧 幼女（兑）" },
  { id:"other", label:"👤 其他成员/室友" },
];

const SPACES = [
  { id:"none", label:"—（没有/不适用）" },
  { id:"toilet", label:"🚽 厕所/浴室（消耗位）" },
  { id:"kitchen", label:"🍳 厨房（责任位）" },
  { id:"balcony", label:"🌞 阳台/大窗（放大位）" },
  { id:"door", label:"🚪 大门/出入口（触发位）" },
  { id:"store", label:"📦 储物/杂物（堆积位）" },
];

const WEIGHTS = { inside: 0.60, outside: 0.25, space: 0.15 };
const LS_KEY = "lumi_yangzhai_free_v1";

const state = loadState() || {
  inside: initMap("none"),
  outside: initMap("none"),
  space: initMap("none"),
};

function initMap(defaultVal){
  const m = {};
  BAGUA.forEach(b => { if(!b.center) m[b.key] = defaultVal; });
  return m;
}

function saveState(){
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

function el(tag, attrs={}, children=[]){
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
    if(k==="class") n.className = v;
    else if(k.startsWith("on") && typeof v==="function") n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  });
  children.forEach(c => n.appendChild(typeof c==="string" ? document.createTextNode(c) : c));
  return n;
}

function makeCell(b, type){
  if(b.center){
    return el("div", {class:"cell"}, [
      el("div", {class:"cellHead"}, [
        el("div", {class:"dir"}, [`${b.emoji} ${b.name}`]),
        el("div", {class:"meta"}, ["中心点"])
      ]),
      el("div", {class:"muted"}, ["这里不需要选。"])
    ]);
  }

  const options = type==="space" ? SPACES : PEOPLE;
  const current = state[type][b.key];

  const select = el("select", {
    "data-key": b.key,
    onchange: (e)=>{
      state[type][b.key] = e.target.value;
      saveState();
      renderResult();
    }
  }, options.map(o => {
    const opt = el("option", { value:o.id }, [o.label]);
    if(o.id === current) opt.selected = true;
    return opt;
  }));

  const headRight = type==="space"
    ? `${b.gua} · ${b.role}`
    : `${b.gua} · ${b.role}`;

  return el("div", {class:"cell"}, [
    el("div", {class:"cellHead"}, [
      el("div", {class:"dir"}, [`${b.emoji} ${b.name}`]),
      el("div", {class:"meta"}, [headRight])
    ]),
    select
  ]);
}

function renderGrid(containerId, type){
  const root = document.getElementById(containerId);
  root.innerHTML = "";
  BAGUA.forEach(b => root.appendChild(makeCell(b, type)));
}

function scorePeople(){
  // 聚合：每个人得到的点名分（按三部曲权重）
  const scores = {};
  PEOPLE.forEach(p => { if(p.id!=="none") scores[p.id] = 0; });

  // inside/outside：选到谁，给那个人加分
  Object.entries(state.inside).forEach(([dir, pid])=>{
    if(pid !== "none") scores[pid] = (scores[pid] || 0) + WEIGHTS.inside;
  });
  Object.entries(state.outside).forEach(([dir, pid])=>{
    if(pid !== "none") scores[pid] = (scores[pid] || 0) + WEIGHTS.outside;
  });

  // space：按空间类型对“该方位角色”加权解释（不是点名某个人选项）
  // 规则：厕所=消耗，厨房=责任，阳台=放大，门=触发，杂物=堆积
  // 这里我们把空间影响投射到“该方位角色”
  Object.entries(state.space).forEach(([dir, sid])=>{
    if(sid === "none") return;
    const bag = BAGUA.find(b => b.key===dir);
    const rolePerson = guessRolePersonId(bag); // 将方位角色映射到people id
    if(!rolePerson) return;
    scores[rolePerson] = (scores[rolePerson] || 0) + WEIGHTS.space;
  });

  return scores;
}

function guessRolePersonId(bag){
  if(!bag || bag.center) return null;
  switch(bag.gua){
    case "乾": return "dad";
    case "坤": return "mom";
    case "震": return "son1";
    case "坎": return "son2";
    case "艮": return "son3";
    case "巽": return "girl1";
    case "离": return "girl2";
    case "兑": return "girl3";
    default: return null;
  }
}

function spaceMeaning(spaceId){
  switch(spaceId){
    case "toilet": return { label:"🚽 消耗位", tip:"容易漏气、累、情绪波动。优先保持干净干燥、门常关、通风好。" };
    case "kitchen": return { label:"🍳 责任位", tip:"容易扛事操心。优先做到收纳清爽、动线顺、火水分离。" };
    case "balcony": return { label:"🌞 放大位", tip:"事情多、曝光度高。适合放“你希望被看见的状态”，避免杂乱。" };
    case "door": return { label:"🚪 触发位", tip:"进出触发情绪与关系。保持明亮、不要一进门就见乱/冲煞感。" };
    case "store": return { label:"📦 堆积位", tip:"卡住、拖延、心烦。清理=最便宜的风水改法。" };
    default: return { label:"—", tip:"" };
  }
}

function renderResult(){
  const box = document.getElementById("result");
  box.innerHTML = "";

  // 1) 家人点名排行
  const scores = scorePeople();
  const ranking = Object.entries(scores)
    .filter(([pid])=>pid!=="none")
    .map(([pid, s])=>({ pid, s }))
    .sort((a,b)=>b.s-a.s);

  const top = ranking[0];
  const top2 = ranking[1];

  const toLabel = (pid)=> (PEOPLE.find(p=>p.id===pid)?.label || pid);

  // 2) 找“破口方位”（space 里非 none 的方位）
  const spaceHits = Object.entries(state.space)
    .filter(([_,sid])=>sid!=="none")
    .map(([dir,sid])=>{
      const bag = BAGUA.find(b=>b.key===dir);
      const meaning = spaceMeaning(sid);
      return { dir, sid, bag, meaning };
    });

  // 3) 输出块：总览
  const summaryTags = [];
  if(top && top.s>0) summaryTags.push(`🎯 最被点名：${toLabel(top.pid)}`);
  if(top2 && top2.s>0) summaryTags.push(`🥈 第二：${toLabel(top2.pid)}`);
  summaryTags.push(`🧠 内挂优先（卧室）`);
  summaryTags.push(`🧩 外挂其次（常用位置）`);
  summaryTags.push(`🧯 破口在厨房/厕所/阳台`);

  box.appendChild(el("div",{class:"block"},[
    el("h3",{},["📍 总览"]),
    el("div",{class:"kv"}, summaryTags.map(t=>el("span",{class:"tag"},[t]))),
    el("p",{class:"muted"},[
      "建议你先看：①谁的分数最高 ②他/她对应方位有没有厕所/厨房/堆积 ③能不能先做“最小改动”。"
    ])
  ]));

  // 4) 输出块：按家人解释（前三名）
  ranking.slice(0,3).forEach((r, idx)=>{
    if(r.s<=0) return;

    const pid = r.pid;
    const insideDirs = Object.entries(state.inside).filter(([d,p])=>p===pid).map(([d])=>d);
    const outsideDirs = Object.entries(state.outside).filter(([d,p])=>p===pid).map(([d])=>d);

    const insideText = insideDirs.length ? insideDirs.map(d=>dirLabel(d)).join("、") : "—";
    const outsideText = outsideDirs.length ? outsideDirs.map(d=>dirLabel(d)).join("、") : "—";

    const hints = [];
    if(insideDirs.length) hints.push("🛏️ 这位成员的“卧室位”最关键：先从睡眠与静区入手。");
    if(outsideDirs.length) hints.push("🛋️ 这位成员有“外挂触发点”：换座位/换办公角，常常立刻见效。");

    // 关联空间破口（按方位角色）
    const roleDirs = BAGUA.filter(b=>!b.center && guessRolePersonId(b)===pid).map(b=>b.key);
    const roleSpace = roleDirs
      .map(d=>({ d, sid: state.space[d] }))
      .filter(x=>x.sid && x.sid!=="none");

    if(roleSpace.length){
      hints.push("🚽🍳🌞 这位成员的“角色方位”存在空间放大/消耗：先做清理与动线优化。");
    }

    box.appendChild(el("div",{class:"block"},[
      el("h3",{},[`${idx===0?"🥇":"👤"} 重点成员：${toLabel(pid)}`]),
      el("div",{class:"kv"},[
        el("span",{class:"tag"},[`📊 影响分：${r.s.toFixed(2)}`]),
        el("span",{class:"tag"},[`🛏️ 卧室方位：${insideText}`]),
        el("span",{class:"tag"},[`🛋️ 常用方位：${outsideText}`]),
      ]),
      el("ul",{class:"muted"}, hints.map(t=>el("li",{},[t])))
    ]));
  });

  // 5) 输出块：空间破口清单
  box.appendChild(el("div",{class:"block"},[
    el("h3",{},["🧯 空间破口（第三部曲）"]),
    spaceHits.length ? el("div",{class:"muted"},[
      ...spaceHits.map(x=>{
        return el("div",{class:"kv", style:"margin:8px 0"},[
          el("span",{class:"tag"},[`🧭 ${x.bag.name} · ${x.bag.gua} · ${x.bag.role}`]),
          el("span",{class:"tag"},[x.meaning.label]),
          el("span",{class:"tag"},[x.meaning.tip])
        ]);
      })
    ]) : el("p",{class:"muted"},["你还没标任何厕所/厨房/阳台等空间。标出来后，这里会给你“最小改动”建议。"])
  ]));

  // 6) 输出块：最小改动建议（行动）
  const actions = [];
  if(spaceHits.some(x=>x.sid==="store")) actions.push("🧽 先清一个“堆积位”（最便宜、见效最快）。");
  if(spaceHits.some(x=>x.sid==="toilet")) actions.push("🚽 厕所位：保持干燥+除味+门常关（先做到 7 天）。");
  if(spaceHits.some(x=>x.sid==="kitchen")) actions.push("🍳 厨房位：收纳归位+动线通（先做到“台面空”）。");
  if(top && top.s>0) actions.push(`🎯 优先照顾 ${toLabel(top.pid)}：从卧室舒适度/睡眠质量开始。`);

  box.appendChild(el("div",{class:"block"},[
    el("h3",{},["✅ 先做这个（最小改动）"]),
    actions.length ? el("ol",{class:"muted"}, actions.map(a=>el("li",{},[a])))
                   : el("p",{class:"muted"},["先完成三部曲选择，系统就会给你“先改哪里”的行动清单。"])
  ]));
}

function dirLabel(key){
  const b = BAGUA.find(x=>x.key===key);
  return b ? `${b.emoji}${b.name}` : key;
}

// Buttons
document.getElementById("btnReset").addEventListener("click", ()=>{
  state.inside = initMap("none");
  state.outside = initMap("none");
  state.space = initMap("none");
  saveState();
  boot();
});

document.getElementById("btnDemo").addEventListener("click", ()=>{
  // 一个典型 demo：妈住坤、爸常用乾、震位厨房、坤位厕所、东北堆积
  state.inside = initMap("none");
  state.outside = initMap("none");
  state.space = initMap("none");

  state.inside.SW = "mom";   // 坤位卧室：妈妈
  state.outside.NW = "dad";  // 乾位常用：爸爸
  state.outside.SW = "mom";  // 妈妈也常在坤位
  state.inside.E  = "son1";  // 长子在震位住

  state.space.E  = "kitchen"; // 东=厨房（责任位压长子）
  state.space.SW = "toilet";  // 西南=厕所（消耗位压妈妈）
  state.space.NE = "store";   // 东北=堆积（幼子位卡）

  saveState();
  boot();
});

document.getElementById("btnExport").addEventListener("click", ()=>{
  const text = exportSummaryText();
  navigator.clipboard.writeText(text).then(()=>{
    alert("✅ 摘要已复制到剪贴板，可以直接贴到 WhatsApp/IG/Notion。");
  }).catch(()=>{
    // fallback
    prompt("复制下面内容：", text);
  });
});

function exportSummaryText(){
  const scores = scorePeople();
  const ranking = Object.entries(scores)
    .filter(([pid])=>pid!=="none")
    .map(([pid, s])=>({ pid, s }))
    .sort((a,b)=>b.s-a.s);

  const toLabel = (pid)=> (PEOPLE.find(p=>p.id===pid)?.label || pid);

  const spaceHits = Object.entries(state.space)
    .filter(([_,sid])=>sid!=="none")
    .map(([dir,sid])=>{
      const bag = BAGUA.find(b=>b.key===dir);
      const meaning = spaceMeaning(sid);
      return `- ${bag.name}（${bag.gua}·${bag.role}）：${meaning.label}｜${meaning.tip}`;
    });

  const top = ranking[0];
  const lines = [];
  lines.push("🏠 阳宅三部曲 Lite · 摘要");
  lines.push("—");
  if(top && top.s>0) lines.push(`🎯 最被点名：${toLabel(top.pid)}（${top.s.toFixed(2)}）`);
  if(ranking[1] && ranking[1].s>0) lines.push(`🥈 第二：${toLabel(ranking[1].pid)}（${ranking[1].s.toFixed(2)}）`);
  lines.push("—");
  lines.push("🧭 权重：卧室60% / 外挂25% / 空间15%");
  lines.push("✅ 先做：优先照顾分数最高的人，从卧室舒适度与清理空间破口开始。");
  lines.push("—");
  lines.push("🧯 空间破口：");
  lines.push(spaceHits.length ? spaceHits.join("\n") : "- （未标）");
  lines.push("—");
  lines.push("ℹ️ 本工具用于生活观察与空间整理，不替代专业建议。");
  return lines.join("\n");
}

function boot(){
  renderGrid("gridInside", "inside");
  renderGrid("gridOutside", "outside");
  renderGrid("gridSpaces", "space");
  renderResult();
}

boot();
