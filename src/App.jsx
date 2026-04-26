import { useState, useMemo } from "react";

// ─── AR por laboratorio ───────────────────────────────────────────────────────
const AR_LABEL = {
  freelens: { verde:'AR Verde', azul:'AR Azul' },
  aliens:   { verde:'Defenser Standar', azul:'Cyan HD' },
  servi:    { verde:'AR Estándar', azul:'AR Clarity Blue',
    28200:'AR Estándar', 35200:'AR Supreme', 40900:'AR Clarity',
    44100:'AR Clarity Blue', 101200:'AR Crizal Easy Pro UV', 135900:'AR Crizal Sapphire HR UV' },
};
const AR_COSTO = { verde:40000,azul:50000,28200:28200,35200:35200,40900:40900,44100:44100,101200:101200,135900:135900 };
const AR_PV    = { verde:70000,azul:130000,28200:70000,35200:130000,40900:130000,44100:130000,101200:340000,135900:340000 };
const AR_SERVI_OPTS = [
  {label:'AR Estándar',value:28200},{label:'AR Supreme',value:35200},
  {label:'AR Clarity',value:40900},{label:'AR Clarity Blue',value:44100},
  {label:'AR Crizal Easy Pro UV',value:101200},{label:'AR Crizal Sapphire HR UV',value:135900},
];

function getArLabel(lab, key) {
  if (!key) return '';
  return (AR_LABEL[lab]||{})[key] || '';
}
function arAplicaParaLab(lab, arKey) {
  if (!arKey) return false;
  if (typeof arKey === 'number') return lab === 'servi';
  return true;
}

// ─── Factores precio ──────────────────────────────────────────────────────────
function pvF(c) { return c < 50000 ? Math.round(c*6.5) : Math.round(c*5); }   // Freelens
function pvA(c) { return c < 100000 ? Math.round(c*5) : Math.round(c*3.5); }  // Aliens
function pvS(c) { return c < 50000 ? Math.round(c*6) : Math.round(c*4); }     // Servi
function fmt(n) { return '$'+Math.round(n).toLocaleString('es-CO'); }
function r2(v)  { return Math.round(v*4)/4; }

// ─── Parseo inteligente ───────────────────────────────────────────────────────
function parseFormula(raw, forceNeg=false) {
  if (!raw && raw!==0) return 0;
  let s = String(raw).replace(',','.');
  if (!s.includes('.')) {
    const abs = Math.abs(parseFloat(s));
    if (!isNaN(abs) && abs>14) {
      const sign = s.startsWith('-')?'-':'';
      const digits = s.replace(/[+-]/g,'');
      s = sign+digits[0]+'.'+digits.slice(1);
    }
  }
  let n = parseFloat(s);
  if (isNaN(n)) return 0;
  if (forceNeg && n>0) n=-n;
  return r2(n);
}

function getArKey(activo, color, otros, otrosVal) {
  if (!activo) return null;
  if (otros) return otrosVal>0?otrosVal:null;
  return color;
}

// ─── Material mínimo según potencia máxima ────────────────────────────────────
// potMax = max(|ESF OD|, |ESF OI|, |CIL OD|, |CIL OI|)
// ≤2.00 → cr (CR-39 / 1.56)
// >2.00 ≤4.00 → m156 (desde 1.56 — NUNCA Poly para monofocal)
// >4.00 ≤7.00 → m160 (desde 1.60)  [Poly solo en este rango o superior]
// >7.00 → m167+ (1.67 / 1.74)
function getMatNivel(potMax) {
  if (potMax <= 2.00) return 'cr';
  if (potMax <= 4.00) return 'm156';
  if (potMax <= 7.00) return 'm160';
  return 'm167';
}

// ─── Inputs ───────────────────────────────────────────────────────────────────
const inp = {width:'100%',boxSizing:'border-box',textAlign:'center',fontSize:'13px',padding:'7px 4px',borderRadius:'8px',border:'1px solid #ccc',background:'#fff',color:'#000',outline:'none'};

function FormulaInput({value,onChange,label,forceNeg=false}) {
  const [editing,setEditing] = useState(false);
  const [raw,setRaw] = useState('');
  const display = () => (value>0&&!forceNeg?'+':'')+value.toFixed(2);
  function onFocus(e){setEditing(true);setRaw('');setTimeout(()=>e.target.select(),0);}
  function onBlur(){setEditing(false);onChange(parseFormula(raw,forceNeg));setRaw('');}
  function onKeyDown(e){
    if(e.key==='ArrowUp'){e.preventDefault();onChange(r2(Math.min(forceNeg?0:20,value+0.25)));}
    if(e.key==='ArrowDown'){e.preventDefault();onChange(r2(Math.max(forceNeg?-6:-20,value-0.25)));}
    if(e.key==='Enter')e.target.blur();
  }
  return (
    <div>
      {label&&<div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>{label}</div>}
      <input type="text" value={editing?raw:display()} onChange={e=>{if(editing)setRaw(e.target.value);}} onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown} style={inp}/>
    </div>
  );
}

function AddInput({value,onChange}) {
  const [editing,setEditing] = useState(false);
  const [raw,setRaw] = useState('');
  function onFocus(e){setEditing(true);setRaw('');setTimeout(()=>e.target.select(),0);}
  function onBlur(){
    setEditing(false);
    if(!raw||raw==='0'||raw==='N/A'){onChange(0);}
    else{const n=parseFloat(raw.replace(',','.'));onChange(!isNaN(n)?r2(Math.min(3,Math.max(0,n))):value);}
    setRaw('');
  }
  function onKeyDown(e){
    if(e.key==='ArrowUp'){e.preventDefault();onChange(r2(Math.min(3,value+0.25)));}
    if(e.key==='ArrowDown'){e.preventDefault();onChange(r2(Math.max(0,value-0.25)));}
    if(e.key==='Enter')e.target.blur();
  }
  return (
    <div>
      <div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>Adición</div>
      <input type="text" value={editing?raw:(value===0?'N/A':'+'+value.toFixed(2))} onChange={e=>{if(editing)setRaw(e.target.value);}} onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown} style={inp}/>
    </div>
  );
}

function EyeFields({label,state,setState}) {
  return (
    <div style={{background:'#f8f9fa',borderRadius:'12px',padding:'12px',border:'1px solid #eee'}}>
      <p style={{fontSize:'13px',fontWeight:'600',margin:'0 0 10px',color:'#222'}}>{label}</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'8px'}}>
        <FormulaInput label="Esfera"   value={state.esf} onChange={v=>setState({...state,esf:v})} forceNeg={false}/>
        <FormulaInput label="Cilindro" value={state.cil} onChange={v=>setState({...state,cil:v})} forceNeg={true}/>
        <div>
          <div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>Eje (0-180)</div>
          <input type="number" min={0} max={180} placeholder="°" value={state.eje||''} onChange={e=>setState({...state,eje:e.target.value})} style={{...inp,color:'#000'}}/>
        </div>
        <AddInput value={state.add} onChange={v=>setState({...state,add:v})}/>
      </div>
    </div>
  );
}

function Toggle({checked,onChange}) {
  return (
    <div onClick={()=>onChange(!checked)} style={{width:'36px',height:'20px',borderRadius:'10px',background:checked?'#185FA5':'#ccc',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}>
      <div style={{position:'absolute',top:'3px',left:checked?'19px':'3px',width:'14px',height:'14px',borderRadius:'50%',background:'white',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.3)'}}/>
    </div>
  );
}

const tierPal = {
  'Económica':{bg:'#f0f0f0',txt:'#555'},
  'Estándar': {bg:'#E6F1FB',txt:'#0C447C'},
  'Premium':  {bg:'#EAF3DE',txt:'#27500A'},
  'Superior': {bg:'#FAEEDA',txt:'#633806'},
  'Top':      {bg:'#E1F5EE',txt:'#085041'},
};

const LAB_COLORS = { freelens:'#0066CC', aliens:'#CC0000', servi:'#185FA5' };
const LAB_NAMES  = { freelens:'Freelens', aliens:'Aliens', servi:'Servioptica' };

function OptionCard({op,arKey}) {
  const tc = tierPal[op.tier]||tierPal['Estándar'];
  const lab = op.freelens?'freelens':op.aliens?'aliens':'servi';
  const aplicaAR = op.tallado && !op.arIncluido && arKey!==null && arAplicaParaLab(lab,arKey);
  const arCosto  = aplicaAR?(AR_COSTO[arKey]||0):0;
  const arPv     = aplicaAR?(AR_PV[arKey]||0):0;
  const arNom    = aplicaAR&&arCosto>0?getArLabel(lab,arKey):'';
  const costoT   = op.costoBase+arCosto;
  const pvT      = op.pvBase+arPv;
  const labColor = LAB_COLORS[lab];
  return (
    <div style={{background:'#fff',border:op.rec?`2px solid ${labColor}`:'1px solid #eee',borderRadius:'14px',padding:'14px',display:'flex',flexDirection:'column',gap:'7px',boxShadow:op.rec?`0 2px 12px ${labColor}22`:'none'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'4px',flexWrap:'wrap',rowGap:'4px'}}>
        <span style={{fontSize:'10px',padding:'2px 7px',borderRadius:'20px',background:labColor+'18',color:labColor,fontWeight:'700'}}>{LAB_NAMES[lab]}</span>
        <span style={{fontSize:'11px',padding:'3px 8px',borderRadius:'20px',background:tc.bg,color:tc.txt,fontWeight:'600'}}>{op.tier}</span>
      </div>
      {op.rec&&<span style={{fontSize:'10px',padding:'3px 8px',borderRadius:'20px',background:labColor,color:'white',fontWeight:'600',alignSelf:'flex-start'}}>⭐ Recomendado</span>}
      <div style={{fontSize:'13px',fontWeight:'600',color:'#222',lineHeight:'1.3'}}>{op.nombre}</div>
      <div style={{fontSize:'11px',color:'#666',lineHeight:'1.5',flexGrow:1}}>{op.desc}</div>
      <div style={{borderTop:'1px solid #eee',paddingTop:'7px'}}>
        {op.features.map((f,i)=>(
          <div key={i} style={{fontSize:'11px',color:'#666',padding:'2px 0',display:'flex',gap:'5px'}}>
            <span style={{color:labColor,fontWeight:'700'}}>·</span>{f}
          </div>
        ))}
        {op.arIncluido&&<div style={{fontSize:'11px',color:'#27500A',padding:'2px 0',display:'flex',gap:'5px',marginTop:'2px'}}><span style={{color:'#27500A',fontWeight:'700'}}>·</span>AR incluido en el lente</div>}
        {aplicaAR&&arCosto>0&&<div style={{fontSize:'11px',color:'#0C447C',padding:'2px 0',display:'flex',gap:'5px',marginTop:'2px'}}><span style={{color:'#0C447C',fontWeight:'700'}}>·</span>+ {arNom}</div>}
      </div>
      <div style={{marginTop:'4px',background:'#f8f9fa',borderRadius:'10px',padding:'10px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
          <span style={{fontSize:'10px',color:'#999'}}>Costo</span>
          <span style={{fontSize:'11px',color:'#999'}}>{fmt(costoT)}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:'12px',fontWeight:'600',color:'#333'}}>Precio cliente</span>
          <span style={{fontSize:'18px',fontWeight:'700',color:labColor}}>{fmt(pvT)}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Opciones por laboratorio y categoría
// Cada función retorna { eco, std, prem, sup, top }
// ─────────────────────────────────────────────────────────────────────────────

// ── FREELENS ──────────────────────────────────────────────────────────────────
function optsFreelens(ctx) {
  const {esProg,potMax,matNivel,freeTermOk,maxCil,transitions,blue,tieneAR,arColor} = ctx;

  if (esProg) {
    const usaTerm = freeTermOk && maxCil===0 && potMax<=3;
    return {
      eco: usaTerm
        ?{tier:'Económica',rec:false,tallado:false,arIncluido:false,freelens:true,aliens:false,nombre:'CR Progresivo terminado',desc:'Progresivo terminado para fórmulas esféricas bajas.',costoBase:25000,pvBase:pvF(25000),features:['Solo esfera sin cilindro','Adición +1.00 a +3.00']}
        :{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,nombre:'Progresivo Digital 1.56',desc:'Progresivo digital 1.56. Apto para astigmatismo.',costoBase:100000,pvBase:pvF(100000),features:['Digital 1.56','Adición hasta +3.00','Apto para astigmatismo']},
      std: {tier:'Estándar',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,nombre:'Progresivo Poly FTC Blue',desc:'Progresivo fotosensible con Blue Block en Poly.',costoBase:280000,pvBase:pvF(280000),features:['Fotosensible + filtro azul','Material Poly','Adición hasta +3.00']},
      prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,nombre:'Gris Gen•S Poly Progresivo',desc:'Progresivo fotosensible Transitions Gen S en Poly.',costoBase:300000,pvBase:pvF(300000),features:['Transitions Gen S','Material Poly','Adición hasta +3.00']},
    };
  }

  if (transitions) {
    const eco = freeTermOk
      ?{tier:'Económica',rec:false,tallado:false,arIncluido:true,freelens:true,aliens:false,nombre:'CR Foto AR Verde terminado',desc:'Fotosensible terminado con AR incluido.',costoBase:30000,pvBase:pvF(30000),features:['Fotosensible básico','AR verde incluido','Esfera +/-4.00']}
      :{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,nombre:'CR Foto Free digital',desc:'Fotosensible digital para astigmatismo.',costoBase:99000,pvBase:pvF(99000),features:['Fotosensible digital','Apto para astigmatismo']};
    const mat156 = matNivel==='cr'||matNivel==='m156';
    return {
      eco,
      std:{tier:'Estándar',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,nombre:mat156?'CR Foto Blue':'Poly Foto Blue',desc:'Fotosensible con filtro azul.',costoBase:mat156?36000:80000,pvBase:pvF(mat156?36000:80000),features:['Fotosensible + filtro azul',mat156?'Material CR':'Material 1.56/Poly']},
      prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,nombre:mat156?'CR Transitions Gen S':'Poly Transitions Gen S',desc:'Fotosensible Transitions Gen S.',costoBase:mat156?140000:150000,pvBase:pvF(mat156?140000:150000),features:['Transitions Gen S',mat156?'Material CR':'Material 1.56/Poly','Bloqueo UV 100%']},
    };
  }

  if (blue) {
    const eco = freeTermOk
      ?(tieneAR
        ?{tier:'Económica',rec:false,tallado:false,arIncluido:true,freelens:true,aliens:false,nombre:'CR Blue Block AR terminado',desc:'Filtro azul terminado con AR incluido.',costoBase:15000,pvBase:pvF(15000),features:['Filtro luz azul','AR incluido','Esfera +/-4.00']}
        :{tier:'Económica',rec:false,tallado:false,arIncluido:true,freelens:true,aliens:false,nombre:'CR Blue Block AR Verde terminado',desc:'Filtro azul terminado con AR incluido.',costoBase:15000,pvBase:pvF(15000),features:['Filtro luz azul','AR verde incluido','Esfera +/-4.00']})
      :{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,nombre:'CR Blue Block digital',desc:'Filtro azul digital.',costoBase:36000,pvBase:pvF(36000),features:['Filtro azul','Digital']};
    return {
      eco,
      std:{tier:'Estándar',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,nombre:'1.56 Blue Block',desc:'1.56 con filtro azul.',costoBase:59000,pvBase:pvF(59000),features:['Índice 1.56','Filtro azul','Digital']},
      prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,nombre:'Poly Blue Block',desc:'Poly 1.59 con filtro azul.',costoBase:89000,pvBase:pvF(89000),features:['Poly 1.59','Filtro azul digital','Resistente a impactos']},
    };
  }

  // Claros — NUNCA Poly para matNivel cr o m156
  const usaTerm = freeTermOk;
  let ecoNom,ecoCosto,ecoTall,ecoAR;
  if (usaTerm && tieneAR && arColor) {
    const esAzul=arColor==='azul';
    ecoNom=esAzul?'CR Blanco AR Azul terminado':'CR Blanco AR Verde terminado';
    ecoCosto=10000; ecoTall=false; ecoAR=true;
  } else if (usaTerm) {
    ecoNom='CR Blanco terminado'; ecoCosto=6000; ecoTall=false; ecoAR=false;
  } else {
    ecoNom='1.56 Digital Monofocal'; ecoCosto=59000; ecoTall=true; ecoAR=false;
  }

  if (matNivel==='cr') {
    return {
      eco:{tier:'Económica',rec:false,tallado:ecoTall,arIncluido:ecoAR,freelens:true,aliens:false,nombre:ecoNom,desc:'Lente claro CR-39 terminado para fórmulas básicas.',costoBase:ecoCosto,pvBase:pvF(ecoCosto),features:['Material CR-39','Esfera +/-4.00','Cilindro hasta -2.00']},
      std:{tier:'Estándar',rec:false,tallado:false,arIncluido:true,freelens:true,aliens:false,nombre:'CR AR Verde terminado',desc:'CR-39 terminado con AR verde incluido.',costoBase:10000,pvBase:pvF(10000),features:['Material CR-39','AR verde incluido','Esfera +/-4.00']},
      prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,nombre:'1.56 Digital Monofocal',desc:'1.56 digital para mayor precisión óptica.',costoBase:59000,pvBase:pvF(59000),features:['Índice 1.56','Digital','Mayor precisión óptica']},
    };
  }
  if (matNivel==='m156') {
    return {
      eco:{tier:'Económica',rec:false,tallado:ecoTall,arIncluido:ecoAR,freelens:true,aliens:false,nombre:ecoNom,desc:'Lente claro de entrada para esta fórmula.',costoBase:ecoCosto,pvBase:pvF(ecoCosto),features:['CR-39 o 1.56','Esfera +/-4.00']},
      std:{tier:'Estándar',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,nombre:'1.56 Digital Monofocal',desc:'1.56 digital. Recomendado para esta graduación.',costoBase:59000,pvBase:pvF(59000),features:['Índice 1.56','Digital','Esfera hasta +/-4.00']},
      prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,nombre:'Poly Monofocal Single',desc:'Poly (1.59) digital para fórmulas más exigentes.',costoBase:89000,pvBase:pvF(89000),features:['Poly 1.59','Digital','Mayor resistencia']},
    };
  }
  // m160+
  return {
    eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,nombre:'Poly Digital Monofocal',desc:'Poly (1.59) digital para fórmulas altas.',costoBase:89000,pvBase:pvF(89000),features:['Poly 1.59','Digital']},
    std:{tier:'Estándar',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,nombre:'1.60 MR8 Digital',desc:'1.60 digital para fórmulas entre ±4 y ±5.',costoBase:139000,pvBase:pvF(139000),features:['Índice 1.60','Digital','Más delgado']},
    prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,nombre:'1.67 Digital',desc:'1.67 digital. Muy delgado para fórmulas altas.',costoBase:189000,pvBase:pvF(189000),features:['Índice 1.67','Digital','Para fórmulas hasta ±7']},
  };
}

// ── ALIENS ────────────────────────────────────────────────────────────────────
function optsAliens(ctx) {
  const {esProg,matNivel,transitions,blue} = ctx;

  if (esProg) {
    if (transitions) {
      return {
        eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,nombre:'Photo CR Natural NA',desc:'Progresivo fotosensible CR. Diseño Natural NA.',costoBase:110000,pvBase:pvA(110000),features:['Photo CR','Progresivo NaturalNA','Adición 0.50 a 2.75']},
        std:{tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:true,nombre:'Gris Gen•S CR (PrecisaHDV)',desc:'Progresivo Transitions Gen S CR. Gama media Aliens.',costoBase:340000,pvBase:pvA(340000),features:['Transitions Gen S','PrecisaHDV','Adición 0.50 a 3.50']},
        prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,nombre:'Gris Gen•S Poly (AilensHDC)',desc:'Progresivo Transitions Gen S Poly. Diseño premium Aliens.',costoBase:590000,pvBase:pvA(590000),features:['Transitions Gen S Poly','AilensHDC premium','Adición 0.75 a 3.75']},
      };
    }
    return {
      eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,nombre:'CR-39 Progresivo (NaturalNA)',desc:'Progresivo digital CR de entrada Aliens.',costoBase:70000,pvBase:pvA(70000),features:['Progresivo CR','NaturalNA','Adición 0.50 a 2.75']},
      std:{tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:true,nombre:'Poly Progresivo (PrecisaHDV)',desc:'Progresivo digital Poly de gama media Aliens.',costoBase:120000,pvBase:pvA(120000),features:['Progresivo Poly','PrecisaHDV','Adición 0.50 a 3.50']},
      prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,nombre:'Poly Progresivo (EvolutionHDC)',desc:'Progresivo digital Poly. Diseño avanzado Aliens.',costoBase:165000,pvBase:pvA(165000),features:['Progresivo Poly','EvolutionHDC','Adición 0.50 a 3.50']},
    };
  }

  if (transitions) {
    // Visión sencilla fotosensible — productos de tabla VS de Aliens
    const mat156 = matNivel==='cr'||matNivel==='m156';
    return {
      eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,
        nombre:mat156?'CR Fotocromático':'Poly Fotocromático',
        desc:'Fotosensible visión sencilla. Gama entrada Aliens.',
        costoBase:mat156?90000:125000,pvBase:pvA(mat156?90000:125000),
        features:['Fotosensible',mat156?'Material CR':'Material Poly','Protección UV']},
      std:{tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:true,
        nombre:mat156?'CR Transitions Gen S':'Poly Transitions Gen S',
        desc:'Transitions Gen S visión sencilla. Gama media Aliens.',
        costoBase:mat156?240000:260000,pvBase:pvA(mat156?240000:260000),
        features:['Transitions Gen S',mat156?'CR-39':'Poly 1.59','Bloqueo UV 100%']},
      prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,
        nombre:'Photofusion X Poly',
        desc:'Fotosensible Zeiss visión sencilla. Alta calidad.',
        costoBase:200000,pvBase:pvA(200000),
        features:['Fotosensible Zeiss Photofusion','Poly 1.59','Alta calidad óptica']},
    };
  }

  if (blue) {
    // Visión sencilla con filtro azul — productos de tabla VS de Aliens
    if (matNivel==='cr') {
      return {
        eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,
          nombre:'Blue Cut CR',desc:'CR con filtro azul. Visión sencilla Aliens.',
          costoBase:70000,pvBase:pvA(70000),features:['Filtro luz azul','Material CR','Visión sencilla']},
        std:{tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:true,
          nombre:'Blue Cut 1.56',desc:'1.56 con filtro azul. Visión sencilla Aliens.',
          costoBase:90000,pvBase:pvA(90000),features:['Filtro luz azul','Índice 1.56','Visión sencilla']},
        prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,
          nombre:'Blue Cut Photo CR',desc:'CR fotosensible con filtro azul. Visión sencilla.',
          costoBase:105000,pvBase:pvA(105000),features:['Fotosensible + filtro azul','Material CR','Visión sencilla']},
      };
    }
    if (matNivel==='m156') {
      return {
        eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,
          nombre:'Blue Cut CR',desc:'CR con filtro azul. Opción entrada.',
          costoBase:70000,pvBase:pvA(70000),features:['Filtro luz azul','Material CR','Visión sencilla']},
        std:{tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:true,
          nombre:'Blue Cut Poly',desc:'Poly con filtro azul. Recomendado para esta graduación.',
          costoBase:90000,pvBase:pvA(90000),features:['Filtro luz azul','Poly 1.59','Visión sencilla']},
        prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,
          nombre:'1.60 Blue Cut',desc:'1.60 con filtro azul. Mayor delgadez.',
          costoBase:105000,pvBase:pvA(105000),features:['Índice 1.60','Filtro azul','Visión sencilla']},
      };
    }
    // m160+
    return {
      eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,
        nombre:'Blue Cut Poly',desc:'Poly con filtro azul. Visión sencilla.',
        costoBase:90000,pvBase:pvA(90000),features:['Filtro luz azul','Poly 1.59','Visión sencilla']},
      std:{tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:true,
        nombre:'1.60 Blue Cut',desc:'1.60 con filtro azul Aliens.',
        costoBase:105000,pvBase:pvA(105000),features:['Índice 1.60','Filtro azul','Visión sencilla']},
      prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,
        nombre:'Photo Sun Relax Poly',desc:'Poly fotosensible. Para exteriores y pantallas.',
        costoBase:140000,pvBase:pvA(140000),features:['Fotosensible','Poly 1.59','Visión sencilla']},
    };
  }

  // ── CLAROS VS (visión sencilla sin tratamiento) ────────────────────────────
  // Productos de tabla Visión Sencilla de Aliens — NUNCA referencias de progresivo
  if (matNivel==='cr') {
    return {
      eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,
        nombre:'CR 39',desc:'CR-39 visión sencilla Aliens.',
        costoBase:40000,pvBase:pvA(40000),features:['Material CR-39','Visión sencilla']},
      std:{tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:true,
        nombre:'Blue Cut CR',desc:'CR con filtro azul. Recomendado para uso con pantallas.',
        costoBase:70000,pvBase:pvA(70000),features:['CR-39','Filtro luz azul','Visión sencilla']},
      prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,
        nombre:'Blue Cut 1.56',desc:'1.56 con filtro azul. Mayor precisión óptica.',
        costoBase:90000,pvBase:pvA(90000),features:['Índice 1.56','Filtro luz azul','Visión sencilla']},
    };
  }
  if (matNivel==='m156') {
    return {
      eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,
        nombre:'CR 39',desc:'CR-39 visión sencilla. Opción económica.',
        costoBase:40000,pvBase:pvA(40000),features:['Material CR-39','Visión sencilla']},
      std:{tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:true,
        nombre:'Blue Cut Poly',desc:'Poly con filtro azul. Recomendado para esta graduación.',
        costoBase:90000,pvBase:pvA(90000),features:['Poly 1.59','Filtro luz azul','Visión sencilla']},
      prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,
        nombre:'1.60 Blue Cut',desc:'1.60 con filtro azul. Más delgado para fórmulas ±2 a ±4.',
        costoBase:105000,pvBase:pvA(105000),features:['Índice 1.60','Filtro azul','Visión sencilla']},
    };
  }
  // m160+
  return {
    eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,
      nombre:'Poly VS',desc:'Poly visión sencilla Aliens.',
      costoBase:50000,pvBase:pvA(50000),features:['Poly 1.59','Visión sencilla']},
    std:{tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:true,
      nombre:'1.60 Blue Cut',desc:'1.60 con filtro azul Aliens.',
      costoBase:105000,pvBase:pvA(105000),features:['Índice 1.60','Filtro azul','Visión sencilla']},
    prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:true,
      nombre:'Photofusion X Poly',desc:'Poly fotosensible Zeiss para fórmulas altas.',
      costoBase:200000,pvBase:pvA(200000),features:['Fotosensible Zeiss','Poly 1.59','Visión sencilla']},
  };
}

// ── SERVIOPTICA ───────────────────────────────────────────────────────────────
function optsServi(ctx) {
  const {esProg,matNivel,transitions,blue,esExterior} = ctx;

  if (esProg) {
    if (transitions||esExterior) {
      const mat156 = matNivel==='cr'||matNivel==='m156';
      return {
        eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:mat156?'Essilor — Ovation DS/FIT ***Airwear *Transitions GEN S':'Essilor — Ovation DS/FIT ***Airwear *Transitions GEN S',desc:'Progresivo Ovation Essilor con Transitions Gen S.',costoBase:281100,pvBase:pvS(281100),features:['Ovation Essilor','Transitions Gen S','Airwear']},
        std:{tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:'Shamir — Autograph III D ***Poly *Transitions GEN S',desc:'Progresivo freeform Shamir con Transitions Gen S.',costoBase:523600,pvBase:pvS(523600),features:['Transitions Gen S','Freeform Shamir','Adición 0.50 a 3.50']},
        prem:{tier:'Premium',rec:false,tallado:true,arIncluido:true,freelens:false,aliens:false,nombre:'Essilor — Varilux Physio Extensee ***Airwear *Transitions GEN S',desc:'El más avanzado de Varilux con Transitions Gen S. AR Crizal Sapphire HR incluido.',costoBase:644400,pvBase:pvS(644400),features:['Airwear liviano','Transitions Gen S','AR Crizal Sapphire HR incluido']},
      };
    }
    return {
      eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:'Essilor — Ovation DS/FIT ***Airwear',desc:'Progresivo Ovation Essilor en Airwear. Gama de entrada.',costoBase:136900,pvBase:pvS(136900),features:['Material Airwear','Progresivo Ovation Essilor','Incluye bisel']},
      std:{tier:'Estándar',rec:true,tallado:true,arIncluido:true,freelens:false,aliens:false,nombre:'Essilor — Varilux Comfort Max/FIT ***Airwear',desc:'Varilux Comfort Max. Visión estable en todas las distancias.',costoBase:273500,pvBase:pvS(273500),features:['Varilux Comfort Max','Material Airwear','Visión estable']},
      prem:{tier:'Premium',rec:false,tallado:true,arIncluido:true,freelens:false,aliens:false,nombre:'Essilor — Varilux Physio Extensee/FIT ***Airwear',desc:'El más avanzado de Varilux. AR Crizal Sapphire HR incluido.',costoBase:430700,pvBase:pvS(430700),features:['Airwear liviano','AR Crizal Sapphire HR incluido','Visión nítida todas las distancias']},
    };
  }

  if (transitions||esExterior) {
    const mat156 = matNivel==='cr'||matNivel==='m156';
    return {
      eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:mat156?'Essilor — CR 39 *Transitions GEN S Gris':'Essilor — ***Poly *Acclimates Gris',desc:mat156?'Transitions Gen S en CR-39.':'Fotosensible Acclimates en Poly.',costoBase:mat156?81100:74100,pvBase:pvS(mat156?81100:74100),features:[mat156?'CR-39':'Poly 1.59','Transitions/Acclimates','Bloqueo UV 100%']},
      std:{tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:mat156?'Essilor — ***Airwear *Transitions GEN S Gris':'Essilor — ***Poly *Transitions GEN S Gris',desc:'Transitions Gen S en material recomendado.',costoBase:mat156?164500:120500,pvBase:pvS(mat156?164500:120500),features:['Transitions Gen S',mat156?'Airwear liviano':'Poly 1.59','Bloqueo UV 100%']},
      prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:'Essilor — ***Poly *Transitions Xtractive NG Gris',desc:'Se activa dentro del vehículo. Mayor oscurecimiento.',costoBase:139600,pvBase:pvS(139600),features:['Funciona dentro del auto','Mayor % oscurecimiento','Bloqueo UV y luz azul']},
    };
  }

  if (blue) {
    return {
      eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:'Essilor — Eyezen Start/FIT ***Airwear *Blue UV',desc:'Diseñado para uso digital. Filtra luz azul-violeta.',costoBase:114000,pvBase:pvS(114000),features:['Filtro luz azul-violeta','Material Airwear','Protección UV 100%']},
      std:{tier:'Estándar',rec:true,tallado:true,arIncluido:true,freelens:false,aliens:false,nombre:'Essilor — Eyezen Start/FIT ***Airwear +Crizal Easy Pro',desc:'Eyezen con AR Crizal Easy Pro incluido.',costoBase:180700,pvBase:pvS(180700),features:['AR Crizal Easy Pro incluido','Filtro luz azul-violeta','Airwear']},
      prem:{tier:'Premium',rec:false,tallado:true,arIncluido:true,freelens:false,aliens:false,nombre:'Essilor — Eyezen Boost ***Airwear +Crizal Easy Pro',desc:'Soporte visual + AR Crizal Easy Pro.',costoBase:180700,pvBase:pvS(180700),features:['Soporte visual integrado','AR Crizal Easy Pro incluido']},
    };
  }

  // Claros — según matNivel
  if (matNivel==='cr') {
    return {
      eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:'Essilor — CR 39 V.S Tallado',desc:'CR-39 tallado. Buena calidad óptica para fórmulas bajas.',costoBase:20800,pvBase:pvS(20800),features:['CR-39 tallado','Calidad óptica precisa']},
      std:{tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:'Essilor — ***Airwear *Blue UV',desc:'Airwear con filtro azul. Liviano y de alta calidad.',costoBase:71300,pvBase:pvS(71300),features:['Material Airwear','Filtro luz azul-violeta','UV 100%']},
      prem:{tier:'Premium',rec:false,tallado:true,arIncluido:true,freelens:false,aliens:false,nombre:'Essilor — ***Airwear *Crizal Sapphire HR UV',desc:'Airwear con AR Crizal Sapphire HR. Máxima calidad.',costoBase:95300,pvBase:pvS(95300),features:['Material Airwear','AR Crizal Sapphire HR incluido','Máxima calidad óptica']},
    };
  }
  if (matNivel==='m156') {
    return {
      eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:'Essilor — 1.56 *Blue Tallado',desc:'1.56 tallado con filtro azul integrado.',costoBase:51000,pvBase:pvS(51000),features:['Índice 1.56','Filtro luz azul-violeta','UV 100%']},
      std:{tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:'Essilor — ***Airwear *Blue UV',desc:'Airwear con filtro azul. Liviano y de alta calidad.',costoBase:71300,pvBase:pvS(71300),features:['Material Airwear','Filtro luz azul-violeta','UV 100%']},
      prem:{tier:'Premium',rec:false,tallado:true,arIncluido:true,freelens:false,aliens:false,nombre:'Essilor — ***Airwear *Crizal Sapphire HR UV',desc:'Airwear con AR Crizal Sapphire HR. Máxima calidad.',costoBase:95300,pvBase:pvS(95300),features:['Material Airwear','AR Crizal Sapphire HR incluido']},
    };
  }
  if (matNivel==='m160') {
    return {
      eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:'Essilor — Poly Esférico — Asférico Tallado',desc:'Poly asférico. Mayor nitidez y menor grosor.',costoBase:36400,pvBase:pvS(36400),features:['Poly 1.59 asférico','Más delgado que esférico','Rango +13.00 a -16.00']},
      std:{tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:'Essilor — 1.60 *Blue UV Tallado',desc:'Alto índice 1.60 con filtro azul.',costoBase:104500,pvBase:pvS(104500),features:['Índice 1.60','Filtro luz azul-violeta','Ideal monturas delgadas']},
      prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:'Essilor — Trivex Esférico Tallado',desc:'Trivex. Liviano y resistente, garantía 1 año.',costoBase:63500,pvBase:pvS(63500),features:['Material Trivex','Más liviano que Poly','Garantía 1 año']},
    };
  }
  // m167+
  return {
    eco:{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:'Essilor — Thin & Lite 1.67 *Blue UV Tallado',desc:'1.67 con filtro azul. Excelente para fórmulas altas.',costoBase:149900,pvBase:pvS(149900),features:['Índice 1.67 ultrafino','Filtro azul UV','Para fórmulas hasta ±7']},
    std:{tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:'Essilor — Alto Índice 1.74 AR Clarity Tallado',desc:'El índice más alto. Para fórmulas extremadamente altas.',costoBase:208100,pvBase:pvS(208100),features:['Índice 1.74 ultra delgado','AR Clarity incluido','Esfera hasta ±18.00']},
    prem:{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,nombre:'Essilor — Trivex Esférico Tallado',desc:'Trivex para fórmulas altas. Liviano con garantía 1 año.',costoBase:63500,pvBase:pvS(63500),features:['Material Trivex','Garantía 1 año','Liviano y resistente']},
  };
}

// ─── Build grupos por gama ────────────────────────────────────────────────────
function buildOps(ctx, labs) {
  const f = labs.freelens ? optsFreelens(ctx) : null;
  const a = labs.aliens   ? optsAliens(ctx)   : null;
  const s = labs.servi    ? optsServi(ctx)     : null;

  const grupo1 = [f?.eco, a?.std, s?.prem].filter(Boolean);
  const grupo2 = [f?.prem, a?.prem, s?.std].filter(Boolean);

  // Si solo hay un lab activo, mostrar sus 3 opciones en grupo1
  const labsActivos = [f,a,s].filter(Boolean).length;
  if (labsActivos===1) {
    const solo = f||a||s;
    return [[solo.eco,solo.std,solo.prem].filter(Boolean), []];
  }

  return [grupo1, grupo2];
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [od,setOd] = useState({esf:0,cil:0,eje:'',add:0});
  const [oi,setOi] = useState({esf:0,cil:0,eje:'',add:0});
  const [edad,setEdad] = useState('');
  const [prof,setProf] = useState('');
  const [primerVez,setPrimerVez] = useState(false);
  const [transitions,setTransitions] = useState(false);
  const [blue,setBlue] = useState(false);
  const [arActivo,setArActivo] = useState(false);
  const [arColor,setArColor] = useState('verde');
  const [arOtros,setArOtros] = useState(false);
  const [arOtrosVal,setArOtrosVal] = useState(0);
  const [mostrar,setMostrar] = useState(false);
  const [grupo,setGrupo] = useState(0);
  const [showConfig,setShowConfig] = useState(false);
  const [labs,setLabs] = useState({freelens:true,aliens:true,servi:true});

  const tieneAdd = od.add>0||oi.add>0;
  const esProg = tieneAdd;
  const potMax = Math.max(Math.abs(od.esf),Math.abs(oi.esf),Math.abs(od.cil),Math.abs(oi.cil));
  const maxEsf = Math.max(Math.abs(od.esf),Math.abs(oi.esf));
  const maxCil = Math.max(Math.abs(od.cil),Math.abs(oi.cil));
  const edadN = parseInt(edad)||0;
  const esNino = edadN>0&&edadN<14;
  const esExterior = prof==='exterior'||prof==='conductor';
  const freeTermOk = maxEsf<=4&&maxCil<=2;
  const necesitaTallado = maxEsf>4||maxCil>2;
  const matNivel = getMatNivel(potMax);
  const arKey = getArKey(arActivo,arColor,arOtros,arOtrosVal);
  const arColor_ = (arKey==='verde'||arKey==='azul')?arKey:null;
  const tieneAR = arKey!==null;

  const ctx = {esProg,potMax,matNivel,freeTermOk,maxCil,transitions,blue,esExterior,tieneAR,arColor:arColor_};

  const grupos = useMemo(()=>
    buildOps(ctx,labs),
    [esProg,potMax,matNivel,freeTermOk,maxCil,transitions,blue,esExterior,tieneAR,arColor_,labs]
  );

  const grupoSafe = grupo < grupos.length ? grupo : 0;
  const grupoData = grupos[grupoSafe] || [];
  const grupo2Tiene = (grupos[1]||[]).length>0;

  const matInfo = {cr:'≤ 2.00 D — CR-39 o 1.56',m156:'>2.00 a 4.00 D — desde 1.56',m160:'>4.00 a 7.00 D — desde 1.60',m167:'>7.00 D — 1.67 o 1.74'}[matNivel];

  const labsConfig = [
    {key:'freelens',label:'Freelens',color:'#0066CC',desc:'Económico'},
    {key:'aliens',  label:'Aliens',  color:'#CC0000',desc:'Gama media'},
    {key:'servi',   label:'Servioptica',color:'#185FA5',desc:'Premium / Essilor / Shamir'},
  ];
  const chip=(label,active,onClick)=>(
    <button onClick={onClick} style={{padding:'5px 12px',borderRadius:'20px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:'600',background:active?'#185FA5':'#f0f0f0',color:active?'white':'#555',transition:'all 0.15s'}}>{label}</button>
  );
  const tratRow=(label,val,fn)=>(
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #eee'}}>
      <span style={{fontSize:'13px',color:'#333'}}>{label}</span>
      <Toggle checked={val} onChange={fn}/>
    </div>
  );

  return (
    <div style={{maxWidth:'960px',margin:'0 auto',padding:'1.5rem',fontFamily:'system-ui,sans-serif'}}>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h2 style={{fontSize:'20px',fontWeight:'700',color:'#185FA5',margin:0}}>Cotizador de Lentes</h2>
        <button onClick={()=>setShowConfig(!showConfig)} style={{fontSize:'12px',padding:'6px 14px',borderRadius:'8px',border:'1px solid #ddd',cursor:'pointer',background:showConfig?'#185FA5':'#f8f9fa',color:showConfig?'white':'#555',fontWeight:'600'}}>
          ⚙ Laboratorios
        </button>
      </div>

      {showConfig&&(
        <div style={{marginBottom:'1.5rem',background:'#f8f9fa',borderRadius:'12px',padding:'14px',border:'1px solid #eee'}}>
          <div style={{fontSize:'11px',fontWeight:'600',color:'#888',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'12px'}}>Laboratorios activos</div>
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {labsConfig.map(lab=>(
              <div key={lab.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fff',borderRadius:'10px',padding:'10px 14px',border:`1.5px solid ${labs[lab.key]?lab.color:'#eee'}`,opacity:labs[lab.key]?1:0.5,transition:'all 0.2s'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'10px',height:'10px',borderRadius:'50%',background:labs[lab.key]?lab.color:'#ccc'}}/>
                  <div>
                    <div style={{fontSize:'13px',fontWeight:'600',color:'#222'}}>{lab.label}</div>
                    <div style={{fontSize:'11px',color:'#888'}}>{lab.desc}</div>
                  </div>
                </div>
                <Toggle checked={labs[lab.key]} onChange={()=>setLabs(p=>({...p,[lab.key]:!p[lab.key]}))}/>
              </div>
            ))}
          </div>
          {!labs.freelens&&!labs.aliens&&!labs.servi&&<div style={{marginTop:'10px',background:'#FAEEDA',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:'#633806'}}>⚠ Activa al menos un laboratorio.</div>}
        </div>
      )}

      <div style={{marginBottom:'1.5rem'}}>
        <div style={{fontSize:'11px',fontWeight:'600',color:'#888',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'10px'}}>Datos del paciente</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
          <div>
            <div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>Edad</div>
            <input type="number" min={1} max={100} placeholder="Ej: 45" value={edad} onChange={e=>setEdad(e.target.value)} style={{width:'100%',boxSizing:'border-box',padding:'7px 10px',borderRadius:'8px',border:'1px solid #ccc',fontSize:'13px',outline:'none',color:'#000'}}/>
          </div>
          <div>
            <div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>Profesión</div>
            <select value={prof} onChange={e=>setProf(e.target.value)} style={{width:'100%',padding:'7px 10px',borderRadius:'8px',border:'1px solid #ccc',fontSize:'13px',outline:'none',color:'#000'}}>
              <option value="">Seleccionar...</option>
              <option value="oficina">Oficina / computador</option>
              <option value="conductor">Conductor</option>
              <option value="deportista">Deportista</option>
              <option value="estudiante">Estudiante</option>
              <option value="exterior">Trabajo al aire libre</option>
              <option value="otro">Otra</option>
            </select>
          </div>
        </div>
        <label style={{display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',fontSize:'13px',color:'#333'}}>
          <input type="checkbox" checked={primerVez} onChange={e=>setPrimerVez(e.target.checked)} style={{width:'16px',height:'16px'}}/>
          Primera vez con gafas
        </label>
        {esNino&&<div style={{marginTop:'8px',background:'#E6F1FB',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:'#0C447C'}}>👶 Paciente menor de 14 años — productos pediátricos activados.</div>}
      </div>

      <div style={{marginBottom:'1.5rem'}}>
        <div style={{fontSize:'11px',fontWeight:'600',color:'#888',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'10px'}}>Fórmula óptica</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <EyeFields label="Ojo derecho (OD)" state={od} setState={setOd}/>
          <EyeFields label="Ojo izquierdo (OI)" state={oi} setState={setOi}/>
        </div>
        {potMax>0&&<div style={{marginTop:'8px',background:'#f0f4ff',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:'#3C3489'}}>
          📊 Potencia máxima: <strong>{potMax.toFixed(2)} D</strong> — {matInfo}
        </div>}
        {necesitaTallado&&<div style={{marginTop:'6px',background:'#FAEEDA',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:'#633806'}}>
          ⚠ Fórmula requiere lentes tallados o digitales.
        </div>}
      </div>

      <div style={{marginBottom:'1.5rem'}}>
        <div style={{fontSize:'11px',fontWeight:'600',color:'#888',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'10px'}}>Tratamientos</div>
        <div style={{background:'#fff',border:'1px solid #eee',borderRadius:'12px',padding:'0 14px'}}>
          {tratRow('Fotosensible (Transitions Gen S)',transitions,v=>{setTransitions(v);if(v)setBlue(false);})}
          {tratRow('Filtro luz azul-violeta',blue,v=>{setBlue(v);if(v)setTransitions(false);})}
          <div style={{padding:'10px 0'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:arActivo?'12px':'0'}}>
              <span style={{fontSize:'13px',color:'#333'}}>Antirreflejo (AR)</span>
              <Toggle checked={arActivo} onChange={v=>{setArActivo(v);if(!v){setArOtros(false);setArOtrosVal(0);}}}/>
            </div>
            {arActivo&&<div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'8px'}}>
                {chip('AR Verde',!arOtros&&arColor==='verde',()=>{setArColor('verde');setArOtros(false);})}
                {chip('AR Azul',!arOtros&&arColor==='azul',()=>{setArColor('azul');setArOtros(false);})}
                {labs.servi&&chip('Otros tipos (Servi)',arOtros,()=>setArOtros(!arOtros))}
              </div>
              {arOtros&&labs.servi&&<select value={arOtrosVal} onChange={e=>setArOtrosVal(parseInt(e.target.value))} style={{width:'100%',fontSize:'13px',padding:'7px',borderRadius:'8px',border:'1px solid #ccc',outline:'none',color:'#000'}}>
                <option value={0}>Seleccionar AR Servioptica...</option>
                {AR_SERVI_OPTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>}
              <div style={{marginTop:'6px',fontSize:'11px',color:'#999'}}>AR Verde/Azul usa nombre propio por laboratorio. "Otros tipos" solo aplica en Servioptica.</div>
            </div>}
          </div>
        </div>
      </div>

      <button onClick={()=>{setMostrar(true);setGrupo(0);}} style={{width:'100%',background:'#185FA5',color:'white',border:'none',borderRadius:'10px',padding:'12px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
        Generar opciones para el paciente
      </button>

      {mostrar&&<div style={{marginTop:'2rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={{fontSize:'11px',fontWeight:'600',color:'#888',letterSpacing:'0.06em',textTransform:'uppercase'}}>
            {grupoSafe===0?'Opciones principales':'Más opciones'}
          </div>
          <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
            {grupoSafe===1&&<button onClick={()=>setGrupo(0)} style={{fontSize:'12px',padding:'5px 12px',borderRadius:'8px',cursor:'pointer',background:'#f0f0f0',border:'none',color:'#333',fontWeight:'600'}}>Volver</button>}
            {grupoSafe===0&&grupo2Tiene&&<button onClick={()=>setGrupo(1)} style={{fontSize:'12px',padding:'5px 12px',borderRadius:'8px',cursor:'pointer',background:'#185FA5',border:'none',color:'white',fontWeight:'600'}}>Ver más opciones</button>}
          </div>
        </div>
        {grupoData.length===0
          ?<div style={{background:'#FAEEDA',borderRadius:'10px',padding:'20px',textAlign:'center',fontSize:'13px',color:'#633806'}}>No hay opciones con los laboratorios activos. Activa al menos uno en ⚙ Laboratorios.</div>
          :<div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(grupoData.length,3)},minmax(0,1fr))`,gap:'12px'}}>
            {grupoData.map((op,i)=><OptionCard key={i} op={op} arKey={arKey}/>)}
          </div>
        }
        {primerVez&&<div style={{marginTop:'12px',background:'#E6F1FB',borderRadius:'8px',padding:'10px 14px',fontSize:'12px',color:'#0C447C'}}>Aviso: paciente sin experiencia previa. Explicar período de adaptación.</div>}
        <div style={{marginTop:'10px',fontSize:'11px',color:'#aaa'}}>Precios por par. No incluyen montaje ni IVA.</div>
      </div>}
    </div>
  );
}