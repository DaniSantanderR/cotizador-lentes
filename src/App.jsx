import { useState, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// AR por laboratorio — NUNCA se mezclan
// Freelens : AR Verde / AR Azul
// Aliens   : Defenser Standar / Cyan HD  (solo estos dos)
// Servi    : AR Estándar / AR Clarity Blue / AR Supreme / etc.
// ─────────────────────────────────────────────────────────────────────────────
const AR_LABEL_FREELENS = { verde: 'AR Verde', azul: 'AR Azul' };
const AR_LABEL_ALIENS   = { verde: 'Defenser Standar', azul: 'Cyan HD' };
const AR_LABEL_SERVI    = {
  verde: 'AR Estándar', azul: 'AR Clarity Blue',
  28200: 'AR Estándar', 35200: 'AR Supreme',
  40900: 'AR Clarity',  44100: 'AR Clarity Blue',
  101200: 'AR Crizal Easy Pro UV', 135900: 'AR Crizal Sapphire HR UV',
};
const AR_COSTO = {
  verde:40000, azul:50000,
  28200:28200, 35200:35200, 40900:40900, 44100:44100,
  101200:101200, 135900:135900,
};
const AR_PV = {
  verde:70000, azul:130000,
  28200:70000, 35200:130000, 40900:130000, 44100:130000,
  101200:340000, 135900:340000,
};
const AR_SERVI_OPTS = [
  { label:'AR Estándar', value:28200 },
  { label:'AR Supreme', value:35200 },
  { label:'AR Clarity', value:40900 },
  { label:'AR Clarity Blue', value:44100 },
  { label:'AR Crizal Easy Pro UV', value:101200 },
  { label:'AR Crizal Sapphire HR UV', value:135900 },
];

function getArLabel(lab, key) {
  if (!key) return '';
  if (lab === 'freelens') return AR_LABEL_FREELENS[key] || '';
  if (lab === 'aliens')   return AR_LABEL_ALIENS[key]   || '';
  return AR_LABEL_SERVI[key] || '';
}
function arAplicaParaLab(lab, arKey) {
  if (!arKey) return false;
  if (typeof arKey === 'number') return lab === 'servi';
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Factores precio al cliente
// ─────────────────────────────────────────────────────────────────────────────
function pvS(c) { return c < 50000 ? Math.round(c*6) : Math.round(c*4); }
function pvA(c) { return c < 100000 ? Math.round(c*5) : Math.round(c*3.5); }
function fmt(n) { return '$' + Math.round(n).toLocaleString('es-CO'); }
function r2(v)  { return Math.round(v*4)/4; }

// ─────────────────────────────────────────────────────────────────────────────
// Parseo inteligente de fórmula
// ─────────────────────────────────────────────────────────────────────────────
function parseFormula(raw, forceNeg=false) {
  if (!raw && raw!==0) return 0;
  let s = String(raw).replace(',','.');
  if (!s.includes('.')) {
    const abs = Math.abs(parseFloat(s));
    if (!isNaN(abs) && abs>14) {
      const sign = s.startsWith('-') ? '-' : '';
      const digits = s.replace(/[+-]/g,'');
      s = sign + digits[0] + '.' + digits.slice(1);
    }
  }
  let n = parseFloat(s);
  if (isNaN(n)) return 0;
  if (forceNeg && n>0) n=-n;
  return r2(n);
}

function getArKey(activo, color, otros, otrosVal) {
  if (!activo) return null;
  if (otros) return otrosVal>0 ? otrosVal : null;
  return color;
}

// ─────────────────────────────────────────────────────────────────────────────
// Material mínimo según potencia máxima (base de conocimiento óptico)
// potMax = max(|ESF_OD|, |ESF_OI|, |CIL_OD|, |CIL_OI|)
// ≤2.00 → 1.50 (CR-39) o 1.56
// >2.00 y ≤3.00 → desde 1.56
// >3.00 y ≤5.00 → desde 1.60
// >5.00 y ≤7.00 → desde 1.67
// >7.00 → 1.74
// ─────────────────────────────────────────────────────────────────────────────
function getMatNivel(potMax) {
  if (potMax <= 2.00) return 'cr';      // CR-39 / 1.56
  if (potMax <= 3.00) return '1_56';    // desde 1.56
  if (potMax <= 5.00) return '1_60';    // desde 1.60
  if (potMax <= 7.00) return '1_67';    // desde 1.67
  return '1_74';                         // 1.74
}

// ─────────────────────────────────────────────────────────────────────────────
// Inputs
// ─────────────────────────────────────────────────────────────────────────────
const inp = {
  width:'100%', boxSizing:'border-box', textAlign:'center', fontSize:'13px',
  padding:'7px 4px', borderRadius:'8px', border:'1px solid #ccc',
  background:'#fff', color:'#000', outline:'none',
};

function FormulaInput({ value, onChange, label, forceNeg=false }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');
  const display = () => (value>0 && !forceNeg ? '+' : '') + value.toFixed(2);
  function onFocus(e) { setEditing(true); setRaw(''); setTimeout(() => e.target.select(), 0); }
  function onBlur() { setEditing(false); onChange(parseFormula(raw, forceNeg)); setRaw(''); }
  function onKeyDown(e) {
    if (e.key==='ArrowUp')   { e.preventDefault(); onChange(r2(Math.min(forceNeg?0:20, value+0.25))); }
    if (e.key==='ArrowDown') { e.preventDefault(); onChange(r2(Math.max(forceNeg?-6:-20, value-0.25))); }
    if (e.key==='Enter') e.target.blur();
  }
  return (
    <div>
      {label && <div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>{label}</div>}
      <input type="text" value={editing ? raw : display()}
        onChange={e => { if(editing) setRaw(e.target.value); }}
        onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown} style={inp} />
    </div>
  );
}

function AddInput({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');
  function onFocus(e) { setEditing(true); setRaw(''); setTimeout(() => e.target.select(), 0); }
  function onBlur() {
    setEditing(false);
    if (!raw || raw==='0' || raw==='N/A') { onChange(0); }
    else { const n=parseFloat(raw.replace(',','.')); onChange(!isNaN(n)?r2(Math.min(3,Math.max(0,n))):value); }
    setRaw('');
  }
  function onKeyDown(e) {
    if (e.key==='ArrowUp')   { e.preventDefault(); onChange(r2(Math.min(3, value+0.25))); }
    if (e.key==='ArrowDown') { e.preventDefault(); onChange(r2(Math.max(0, value-0.25))); }
    if (e.key==='Enter') e.target.blur();
  }
  return (
    <div>
      <div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>Adición</div>
      <input type="text" value={editing ? raw : (value===0 ? 'N/A' : '+'+value.toFixed(2))}
        onChange={e => { if(editing) setRaw(e.target.value); }}
        onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown} style={inp} />
    </div>
  );
}

function EyeFields({ label, state, setState }) {
  return (
    <div style={{background:'#f8f9fa',borderRadius:'12px',padding:'12px',border:'1px solid #eee'}}>
      <p style={{fontSize:'13px',fontWeight:'600',margin:'0 0 10px',color:'#222'}}>{label}</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'8px'}}>
        <FormulaInput label="Esfera"   value={state.esf} onChange={v=>setState({...state,esf:v})} forceNeg={false}/>
        <FormulaInput label="Cilindro" value={state.cil} onChange={v=>setState({...state,cil:v})} forceNeg={true}/>
        <div>
          <div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>Eje (0-180)</div>
          <input type="number" min={0} max={180} placeholder="°"
            value={state.eje||''} onChange={e=>setState({...state,eje:e.target.value})}
            style={{...inp,color:'#000'}}/>
        </div>
        <AddInput value={state.add} onChange={v=>setState({...state,add:v})}/>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <div onClick={()=>onChange(!checked)} style={{
      width:'36px',height:'20px',borderRadius:'10px',
      background:checked?'#185FA5':'#ccc',cursor:'pointer',
      position:'relative',transition:'background 0.2s',flexShrink:0,
    }}>
      <div style={{
        position:'absolute',top:'3px',left:checked?'19px':'3px',
        width:'14px',height:'14px',borderRadius:'50%',background:'white',
        transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.3)',
      }}/>
    </div>
  );
}

const tierPal = {
  'Económica': {bg:'#f0f0f0',txt:'#555'},
  'Estándar':  {bg:'#E6F1FB',txt:'#0C447C'},
  'Premium':   {bg:'#EAF3DE',txt:'#27500A'},
  'Avanzada':  {bg:'#EEEDFE',txt:'#3C3489'},
  'Superior':  {bg:'#FAEEDA',txt:'#633806'},
  'Top':       {bg:'#E1F5EE',txt:'#085041'},
};

function OptionCard({ op, arKey }) {
  const tc = tierPal[op.tier] || tierPal['Estándar'];
  const lab = op.freelens?'freelens':op.aliens?'aliens':'servi';
  const aplicaAR = op.tallado && !op.arIncluido && arKey!==null && arAplicaParaLab(lab,arKey);
  const arCosto = aplicaAR ? (AR_COSTO[arKey]||0) : 0;
  const arPv    = aplicaAR ? (AR_PV[arKey]||0) : 0;
  const arNom   = aplicaAR&&arCosto>0 ? getArLabel(lab,arKey) : '';
  const costoT  = op.costoBase + arCosto;
  const pvT     = op.pvBase + arPv;
  return (
    <div style={{
      background:'#fff',
      border:op.rec?'2px solid #185FA5':'1px solid #eee',
      borderRadius:'14px',padding:'14px',
      display:'flex',flexDirection:'column',gap:'7px',
      boxShadow:op.rec?'0 2px 12px rgba(24,95,165,0.12)':'none',
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'4px',flexWrap:'wrap',rowGap:'4px'}}>
        <span style={{fontSize:'11px',padding:'3px 8px',borderRadius:'20px',background:tc.bg,color:tc.txt,fontWeight:'600'}}>{op.tier}</span>
        {op.rec && <span style={{fontSize:'10px',padding:'3px 8px',borderRadius:'20px',background:'#185FA5',color:'white',fontWeight:'600'}}>Recomendado</span>}
      </div>
      <div style={{fontSize:'13px',fontWeight:'600',color:'#222',lineHeight:'1.3'}}>{op.nombre}</div>
      <div style={{fontSize:'11px',color:'#666',lineHeight:'1.5',flexGrow:1}}>{op.desc}</div>
      <div style={{borderTop:'1px solid #eee',paddingTop:'7px'}}>
        {op.features.map((f,i)=>(
          <div key={i} style={{fontSize:'11px',color:'#666',padding:'2px 0',display:'flex',gap:'5px'}}>
            <span style={{color:'#185FA5',fontWeight:'700'}}>·</span>{f}
          </div>
        ))}
        {op.arIncluido && (
          <div style={{fontSize:'11px',color:'#27500A',padding:'2px 0',display:'flex',gap:'5px',marginTop:'2px'}}>
            <span style={{color:'#27500A',fontWeight:'700'}}>·</span>AR incluido en el lente
          </div>
        )}
        {aplicaAR && arCosto>0 && (
          <div style={{fontSize:'11px',color:'#0C447C',padding:'2px 0',display:'flex',gap:'5px',marginTop:'2px'}}>
            <span style={{color:'#0C447C',fontWeight:'700'}}>·</span>+ {arNom}
          </div>
        )}
      </div>
      <div style={{marginTop:'4px',background:'#f8f9fa',borderRadius:'10px',padding:'10px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
          <span style={{fontSize:'10px',color:'#999'}}>Costo</span>
          <span style={{fontSize:'11px',color:'#999'}}>{fmt(costoT)}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:'12px',fontWeight:'600',color:'#333'}}>Precio cliente</span>
          <span style={{fontSize:'18px',fontWeight:'700',color:'#185FA5'}}>{fmt(pvT)}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Terminado económico con AR
// ─────────────────────────────────────────────────────────────────────────────
function ecoTermConAR(arColor, tipo) {
  const esAzul = arColor==='azul';
  if (tipo==='claro') return {
    tallado:false, arIncluido:true, freelens:true, aliens:false,
    nombre: esAzul?'CR Blanco AR Azul terminado':'CR Blanco AR Verde terminado',
    desc:'Lente claro CR-39 terminado con AR incluido.',
    costoBase:10000, pvBase:60000,
    features:['Material CR-39', esAzul?'AR azul incluido':'AR verde incluido', 'Esfera +/-4.00'],
  };
  if (tipo==='foto') return {
    tallado:false, arIncluido:true, freelens:true, aliens:false,
    nombre:'CR Foto AR Verde terminado',
    desc:'Fotosensible terminado con AR incluido.',
    costoBase:30000, pvBase:160000,
    features:['Fotosensible básico','AR verde incluido','Esfera +/-4.00'],
  };
  if (tipo==='blue') return {
    tallado:false, arIncluido:true, freelens:true, aliens:false,
    nombre:'CR Blue Block AR Verde terminado',
    desc:'Filtro azul terminado con AR incluido.',
    costoBase:15000, pvBase:90000,
    features:['Filtro luz azul','AR verde incluido','Esfera +/-4.00'],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Construcción de opciones
// ─────────────────────────────────────────────────────────────────────────────
function buildOps(esProg, potMax, maxEsf, maxCil, transitions, blue, esExterior, esNino, edadN, arKey) {
  const matNivel = getMatNivel(potMax);
  const freeTermOk = maxEsf<=4 && maxCil<=2; // terminado posible
  const arColor = (arKey==='verde'||arKey==='azul') ? arKey : null;
  const tieneAR = arKey!==null;

  // ── NIÑOS (<14 años) ───────────────────────────────────────────────────────
  if (esNino) {
    const puedeStellest = edadN>=6;
    if (esProg) {
      return [[
        {tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,
          nombre:'Progresivo Digital Profesional Free 1.56',
          desc:'Progresivo digital pediátrico de entrada.',
          costoBase:100000,pvBase:100000*4,features:['Progresivo digital 1.56','Apto para astigmatismo']},
        {tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:false,
          nombre:'Shamir — Shamir Cool (Progresivo Pediátrico) ***Poly',
          desc:'Progresivo diseñado para niños. Adaptación rápida.',
          costoBase:94900,pvBase:pvS(94900),features:['Diseño pediátrico especializado','Adaptación rápida en niños']},
        {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
          nombre:'Essilor — Eyezen Start/FIT ***Airwear *Blue UV',
          desc:'Lente digital para niños con pantallas.',
          costoBase:114000,pvBase:pvS(114000),features:['Filtro luz azul-violeta','Material Airwear']},
      ],[
        {tier:'Avanzada',rec:false,tallado:true,arIncluido:true,freelens:false,aliens:false,
          nombre:'Essilor — Eyezen Start/FIT ***Airwear +Crizal Easy Pro',
          desc:'Máxima protección digital. AR Crizal Easy Pro incluido.',
          costoBase:180700,pvBase:pvS(180700),features:['AR Crizal Easy Pro incluido','Filtro luz azul-violeta']},
        puedeStellest
          ?{tier:'Superior',rec:true,tallado:true,arIncluido:true,freelens:false,aliens:false,
            nombre:'Essilor — Stellest ***Airwear +Crizal Rock',
            desc:'Control progresión miopía en niños (6-14 años).',
            costoBase:216600,pvBase:pvS(216600),features:['Control progresión miopía','AR Crizal Rock incluido','Tecnología Stellest']}
          :{tier:'Superior',rec:true,tallado:true,arIncluido:true,freelens:false,aliens:false,
            nombre:'Essilor — Eyezen Boost ***Airwear +Crizal Easy Pro',
            desc:'Soporte visual adicional para niños.',
            costoBase:180700,pvBase:pvS(180700),features:['Soporte visual integrado','AR Crizal Easy Pro incluido']},
        {tier:'Top',rec:false,tallado:true,arIncluido:false,aliens:true,freelens:false,
          nombre:'Aliens — Myofix Kids',
          desc:'Control de miopía pediátrico hasta 12 años.',
          costoBase:350000,pvBase:pvA(350000),features:['Control miopía pediátrico','Diseño Myofix','Uso terapéutico 2h/día']},
      ]];
    }
    // niños visión sencilla — material mínimo 1.59 poly por resistencia a impactos
    const ecoN = {tier:'Económica',rec:false,tallado:false,arIncluido:false,freelens:true,aliens:false,
      nombre:'CR Blanco terminado',desc:'Lente claro CR para niños con fórmulas básicas.',
      costoBase:6000,pvBase:36000,features:['Material CR-39','Liviano y seguro']};
    return [[
      ecoN,
      {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:true,freelens:false,
        nombre:'Aliens — Blue Cut (Visión Sencilla)',
        desc:'Filtro azul para niños. Uso escolar y pantallas.',
        costoBase:90000,pvBase:pvA(90000),features:['Filtro luz azul','Protección UV']},
      {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — Eyezen Start/FIT ***Airwear *Blue UV',
        desc:'Diseñado para niños con uso digital.',
        costoBase:114000,pvBase:pvS(114000),features:['Filtro luz azul-violeta','Material Airwear']},
    ],[
      {tier:'Avanzada',rec:false,tallado:true,arIncluido:true,freelens:false,aliens:false,
        nombre:'Essilor — Eyezen Start/FIT ***Airwear +Crizal Easy Pro',
        desc:'Eyezen con AR Crizal Easy Pro para niños.',
        costoBase:180700,pvBase:pvS(180700),features:['AR Crizal Easy Pro incluido','Filtro luz azul-violeta']},
      {tier:'Superior',rec:true,tallado:true,arIncluido:true,freelens:false,aliens:false,
        nombre:puedeStellest?'Essilor — Stellest ***Airwear +Crizal Rock':'Essilor — Eyezen Boost ***Airwear +Crizal Easy Pro',
        desc:puedeStellest?'Control de miopía (6-14 años).':'Soporte visual + AR para niños.',
        costoBase:puedeStellest?216600:180700,pvBase:pvS(puedeStellest?216600:180700),
        features:puedeStellest?['Control progresión miopía','Tecnología Stellest','AR Crizal Rock incluido']:['Soporte visual integrado','AR Crizal Easy Pro incluido']},
      {tier:'Top',rec:false,tallado:true,arIncluido:false,aliens:true,freelens:false,
        nombre:'Aliens — Myofix Kids',
        desc:'Control de miopía pediátrico.',
        costoBase:350000,pvBase:pvA(350000),features:['Control miopía pediátrico','Diseño Myofix']},
    ]];
  }

  // ── PROGRESIVOS (ADD > 0) ──────────────────────────────────────────────────
  if (esProg) {
    const usaTerm = freeTermOk && maxCil===0 && maxEsf<=3;
    const ecoBase = usaTerm
      ?{tallado:false,arIncluido:false,freelens:true,aliens:false,nombre:'CR Progresivo terminado',
        desc:'Progresivo terminado para fórmulas esféricas bajas.',costoBase:25000,pvBase:120000,
        features:['Solo esfera sin cilindro','Adición +1.00 a +3.00']}
      :{tallado:true,arIncluido:false,freelens:true,aliens:false,nombre:'Progresivo Digital Profesional Free 1.56',
        desc:'Progresivo digital apto para astigmatismo.',costoBase:100000,pvBase:100000*4,
        features:['Digital 1.56','Apto para astigmatismo']};

    if (transitions||esExterior) {
      // Selección de material+tratamiento según potencia
      const alienNom = matNivel==='cr'?'Gris Gen•S CR (Aliens PrecisaHDV)':'Gris Gen•S Poly (Aliens PrecisaHDV)';
      const alienCosto = matNivel==='cr'?340000:360000;
      const serviPremNom = matNivel==='cr'
        ?'Essilor — Ovation DS/FIT ***Airwear *Transitions GEN S Gris/Café'
        :'Essilor — Ovation DS/FIT ***Airwear *Transitions GEN S Gris/Café';
      return [[
        {...ecoBase,tier:'Económica',rec:false},
        {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:true,freelens:false,
          nombre:`Aliens — ${alienNom}`,desc:'Progresivo fotosensible Transitions Gen S. Gama media Aliens.',
          costoBase:alienCosto,pvBase:pvA(alienCosto),features:['Transitions Gen S incluido','Progresivo digital']},
        {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
          nombre:serviPremNom,desc:'Progresivo Ovation Essilor con Transitions Gen S.',
          costoBase:281100,pvBase:pvS(281100),features:['Ovation Essilor','Transitions Gen S incluido','Material Airwear']},
      ],[
        {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
          nombre:'Shamir — Shamir Autograph III D ***Poly *Transitions GEN S',
          desc:'Progresivo freeform Shamir con Transitions Gen S.',
          costoBase:523600,pvBase:pvS(523600),features:['Transitions Gen S incluido','Freeform Shamir']},
        {tier:'Superior',rec:true,tallado:true,arIncluido:true,freelens:false,aliens:false,
          nombre:'Essilor — Varilux Physio Extensee/FIT ***Airwear *Transitions GEN S',
          desc:'El más avanzado de Varilux con Transitions Gen S. AR Crizal Sapphire HR incluido.',
          costoBase:644400,pvBase:pvS(644400),features:['Airwear liviano','Transitions Gen S incluido','AR Crizal Sapphire HR incluido']},
        {tier:'Top',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
          nombre:'Essilor — Varilux Physio Extensee/FIT ***Airwear *Transitions Xtractive Polarized',
          desc:'Varilux con Transitions Xtractive Polarized. Activa en el auto.',
          costoBase:677900,pvBase:pvS(677900),features:['Transitions Xtractive Polarized','Activa dentro del vehículo','Airwear liviano']},
      ]];
    }

    // Progresivos claros — material según potencia
    const alienProgNom = matNivel==='cr'?'CR-39 Progresivo (Aliens NaturalNA)':'Progresivo Poly Natural NA (Aliens)';
    const alienProgCosto = matNivel==='cr'?70000:80000;
    const serviPremNom2 = matNivel==='cr'||matNivel==='1_56'
      ?'Essilor — Ovation DS/FIT ***Airwear'
      :'Essilor — Varilux Liberty 3.0/FIT ***Airwear';
    const serviPremCosto2 = matNivel==='cr'||matNivel==='1_56'?136900:226900;
    return [[
      {...ecoBase,tier:'Económica',rec:false},
      {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:true,freelens:false,
        nombre:`Aliens — ${alienProgNom}`,desc:'Progresivo digital de gama media Aliens.',
        costoBase:alienProgCosto,pvBase:pvA(alienProgCosto),features:['Progresivo digital','Buena amplitud visual']},
      {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:serviPremNom2,desc:'Progresivo Essilor en Airwear. Gama de entrada.',
        costoBase:serviPremCosto2,pvBase:pvS(serviPremCosto2),features:['Material Airwear','Progresivo Essilor','Incluye bisel']},
    ],[
      {tier:'Avanzada',rec:false,tallado:true,arIncluido:true,freelens:false,aliens:false,
        nombre:'Shamir — Shamir Autograph III D ***Poly',
        desc:'Progresivo freeform Shamir. AR Crizal Sapphire incluido.',
        costoBase:375800,pvBase:pvS(375800),features:['Freeform personalizado','AR Crizal Sapphire incluido']},
      {tier:'Superior',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — Varilux Comfort Max/FIT ***Airwear',
        desc:'Varilux Comfort Max. Visión estable en todas las distancias.',
        costoBase:273500,pvBase:pvS(273500),features:['Varilux Comfort Max','Material Airwear','Visión estable']},
      {tier:'Top',rec:false,tallado:true,arIncluido:true,freelens:false,aliens:false,
        nombre:'Essilor — Varilux Physio Extensee/FIT ***Airwear',
        desc:'El más avanzado de Varilux. AR Crizal Sapphire HR incluido.',
        costoBase:430700,pvBase:pvS(430700),features:['Airwear liviano','AR Crizal Sapphire HR incluido','Visión nítida todas las distancias']},
    ]];
  }

  // ── FOTOSENSIBLES visión sencilla ──────────────────────────────────────────
  if (transitions||esExterior) {
    const usaTerm = freeTermOk;
    const ecoFoto = usaTerm
      ?(tieneAR
        ?{...ecoTermConAR(arColor,'foto'),tier:'Económica',rec:false}
        :{tier:'Económica',rec:false,tallado:false,arIncluido:true,freelens:true,aliens:false,
          nombre:'CR Foto AR Verde terminado',desc:'Fotosensible terminado con AR incluido.',
          costoBase:30000,pvBase:160000,features:['Fotosensible básico','AR verde incluido','Esfera +/-4.00']})
      :{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,
        nombre:'CR Foto Free digital',desc:'Fotosensible digital para astigmatismo.',
        costoBase:99000,pvBase:99000*4,features:['Fotosensible digital','Apto para astigmatismo']};
    // Material según potencia
    const alienFotoNom = (matNivel==='cr'||matNivel==='1_56') ? 'Blue Cut Photo CR (Aliens)' : 'Blue Cut Photo Poly (Aliens)';
    const serviPremFotoNom = (matNivel==='cr'||matNivel==='1_56')
      ? 'Essilor — CR 39 *Transitions GEN S Gris'
      : 'Essilor — ***Poly *Transitions GEN S Gris';
    const serviPremFotoCosto = (matNivel==='cr'||matNivel==='1_56') ? 81100 : 120500;
    return [[
      ecoFoto,
      {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:true,freelens:false,
        nombre:`Aliens — ${alienFotoNom}`,desc:'Fotosensible con filtro azul. Gama media Aliens.',
        costoBase:125000,pvBase:pvA(125000),features:['Fotosensible + filtro azul','Protección UV completa']},
      {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:serviPremFotoNom,desc:'Fotosensible Transitions Gen S. Material según graduación.',
        costoBase:serviPremFotoCosto,pvBase:pvS(serviPremFotoCosto),features:['Transitions Gen S','Bloqueo UV 100%']},
    ],[
      {tier:'Avanzada',rec:false,tallado:true,arIncluido:true,freelens:false,aliens:false,
        nombre:'Essilor — ***Airwear *Transitions GEN S Gris +Crizal Sapphire HR UV',
        desc:'Transitions en Airwear con AR Crizal Sapphire HR incluido.',
        costoBase:164500,pvBase:pvS(164500),features:['Material Airwear liviano','Transitions Gen S']},
      {tier:'Superior',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — ***Poly *Transitions Xtractive NG Gris',
        desc:'Se activa dentro del vehículo. Mayor oscurecimiento.',
        costoBase:139600,pvBase:pvS(139600),features:['Funciona dentro del auto','Mayor % oscurecimiento','Bloqueo UV y luz azul']},
      {tier:'Top',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — ***Poly *Transitions Xtractive Polarized Gris',
        desc:'Oscurece en el auto y elimina reflejos polarizados.',
        costoBase:180700,pvBase:pvS(180700),features:['Efecto polarizado activo','Dentro y fuera del vehículo','Máxima protección solar']},
    ]];
  }

  // ── FILTRO AZUL ────────────────────────────────────────────────────────────
  if (blue) {
    const usaTerm = freeTermOk;
    const ecoBlue = usaTerm
      ?(tieneAR
        ?{...ecoTermConAR(arColor,'blue'),tier:'Económica',rec:false}
        :{tier:'Económica',rec:false,tallado:false,arIncluido:true,freelens:true,aliens:false,
          nombre:'CR Blue Block AR Verde terminado',desc:'Filtro azul terminado con AR incluido.',
          costoBase:15000,pvBase:90000,features:['Filtro luz azul','AR verde incluido','Esfera +/-4.00']})
      :{tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,
        nombre:'CR Blue Block Free digital',desc:'Filtro azul digital para astigmatismo.',
        costoBase:36000,pvBase:pvA(36000),features:['Filtro azul digital','Apto para astigmatismo']};
    // Material según potencia
    const alienBlueNom = (matNivel==='cr'||matNivel==='1_56') ? 'Blue Cut CR (Aliens VS)' : 'Blue Cut Poly (Aliens VS)';
    const alienBlueCosto = (matNivel==='cr'||matNivel==='1_56') ? 90000 : 109000;
    const serviBlueNom = (matNivel==='cr'||matNivel==='1_56')
      ? 'Essilor — Eyezen Start/FIT ***Airwear *Blue UV'
      : 'Essilor — Eyezen Start/FIT ***Airwear *Blue UV';
    return [[
      ecoBlue,
      {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:true,freelens:false,
        nombre:`Aliens — ${alienBlueNom}`,desc:'Filtro azul visión sencilla. Material según graduación.',
        costoBase:alienBlueCosto,pvBase:pvA(alienBlueCosto),features:['Filtro luz azul','Visión sencilla','Protección UV']},
      {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — Eyezen Start/FIT ***Airwear *Blue UV',
        desc:'Diseñado para uso digital. Filtra luz azul-violeta en Airwear.',
        costoBase:114000,pvBase:pvS(114000),features:['Filtro luz azul-violeta','Material Airwear','Protección UV 100%']},
    ],[
      {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — Eyezen Boost/FIT ***Airwear *Blue UV',
        desc:'Eyezen con soporte adicional. Menor fatiga en pantallas.',
        costoBase:114000,pvBase:pvS(114000),features:['Soporte +0.40/0.60/0.85','Filtro luz azul-violeta','Airwear']},
      {tier:'Superior',rec:true,tallado:true,arIncluido:true,freelens:false,aliens:false,
        nombre:'Essilor — Eyezen Start/FIT ***Airwear +Crizal Easy Pro',
        desc:'Eyezen con AR Crizal Easy Pro incluido.',
        costoBase:180700,pvBase:pvS(180700),features:['AR Crizal Easy Pro incluido','Filtro luz azul-violeta']},
      {tier:'Top',rec:false,tallado:true,arIncluido:true,freelens:false,aliens:false,
        nombre:'Essilor — Eyezen Boost ***Airwear +Crizal Easy Pro',
        desc:'Soporte visual + AR Crizal Easy Pro. Uso digital intensivo.',
        costoBase:180700,pvBase:pvS(180700),features:['Soporte visual integrado','AR Crizal Easy Pro incluido']},
    ]];
  }

  // ── CLAROS (monofocal sin tratamiento especial) ────────────────────────────
  // Regla de material: según potMax (base de conocimiento óptico)
  // cr   (≤2.00):  CR-39 / 1.56 — NUNCA Poly
  // 1_56 (≤3.00):  desde 1.56
  // 1_60 (≤5.00):  desde 1.60
  // 1_67 (≤7.00):  desde 1.67
  // 1_74 (>7.00):  1.74

  if (matNivel==='cr') {
    // Solo CR-39 o 1.56. Potencia máxima ≤ 2.00 D.
    // Económica: SIEMPRE CR Blanco terminado de Freelens ($6.000)
    // El terminado cubre esfera +/-4 con cilindros hasta -2, que es exactamente este rango.
    let eco;
    if (freeTermOk && tieneAR && arColor) {
      eco = {...ecoTermConAR(arColor,'claro'), tier:'Económica', rec:false};
    } else {
      // CR blanco terminado para cualquier fórmula con potMax ≤ 2.00
      // (el lente terminado cubre estos rangos en Freelens)
      eco = {tier:'Económica',rec:false,tallado:false,arIncluido:false,freelens:true,aliens:false,
        nombre:'CR Blanco terminado',desc:'Lente claro CR-39 terminado. Para fórmulas hasta ±2.00 D.',
        costoBase:6000,pvBase:36000,features:['Material CR-39','Esfera +/-4.00','Cilindro hasta -2.00']};
    }
    return [[
      eco,
      {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:true,freelens:false,
        nombre:'Aliens — CR 39 (Visión Sencilla)',
        desc:'Lente claro CR-39 visión sencilla Aliens. Gama media.',
        costoBase:40000,pvBase:pvA(40000),features:['Material CR-39','Visión sencilla','Diseño digital Aliens']},
      {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — ***Airwear *Blue UV',
        desc:'Material Airwear liviano con filtro azul. Calidad superior.',
        costoBase:71300,pvBase:pvS(71300),features:['Material Airwear liviano','Filtro luz azul-violeta','Protección UV 100%']},
    ],[
      {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — CR 39 V.S Tallado',
        desc:'CR-39 tallado. Precisión óptica para fórmulas bajas.',
        costoBase:20800,pvBase:pvS(20800),features:['CR-39 tallado','Calidad óptica precisa']},
      {tier:'Superior',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — 1.56 *Blue Tallado',
        desc:'1.56 tallado con filtro azul integrado.',
        costoBase:51000,pvBase:pvS(51000),features:['Índice 1.56','Filtro luz azul-violeta','UV 100%']},
      {tier:'Top',rec:false,tallado:true,arIncluido:true,freelens:false,aliens:false,
        nombre:'Essilor — ***Airwear *Crizal Sapphire HR UV',
        desc:'Airwear con AR Crizal Sapphire HR. Máxima calidad.',
        costoBase:95300,pvBase:pvS(95300),features:['Material Airwear','AR Crizal Sapphire HR incluido','Máxima calidad óptica']},
    ]];
  }

  if (matNivel==='1_56') {
    // Desde 1.56 — potMax 2-3
    let eco;
    if (freeTermOk && tieneAR && arColor) {
      eco = {...ecoTermConAR(arColor,'claro'), tier:'Económica', rec:false};
    } else if (freeTermOk) {
      // CR blanco terminado cubre esfera +/-4 y cilindro hasta -2
      eco = {tier:'Económica',rec:false,tallado:false,arIncluido:false,freelens:true,aliens:false,
        nombre:'CR Blanco terminado',desc:'Lente claro CR-39 terminado. Fórmulas hasta ±3.00 D.',
        costoBase:6000,pvBase:36000,features:['Material CR-39','Esfera +/-4.00','Cilindro hasta -2.00']};
    } else {
      // Fuera de rango terminado → 1.56 digital
      eco = {tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,
        nombre:'1.56 Digital Monofocal Single (Freelens)',
        desc:'Lente 1.56 digital para fórmulas fuera de rango terminado.',
        costoBase:59000,pvBase:pvA(59000),features:['Material 1.56','Digital','Apto para astigmatismo']};
    }
    return [[
      eco,
      {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:true,freelens:false,
        nombre:'Aliens — CR 39 (Visión Sencilla)',
        desc:'Lente claro CR-39 visión sencilla Aliens.',
        costoBase:40000,pvBase:pvA(40000),features:['Material CR-39','Visión sencilla','Diseño Aliens']},
      {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — 1.56 *Blue Tallado',
        desc:'1.56 tallado con filtro azul integrado.',
        costoBase:51000,pvBase:pvS(51000),features:['Índice 1.56','Filtro luz azul-violeta','UV 100%']},
    ],[
      {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — ***Airwear *Blue UV',
        desc:'Airwear con filtro azul. Liviano y de alta calidad.',
        costoBase:71300,pvBase:pvS(71300),features:['Material Airwear liviano','Filtro luz azul-violeta','Protección UV 100%']},
      {tier:'Superior',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — Poly Esférico — Asférico Tallado',
        desc:'Poly asférico. Mayor nitidez y menor grosor.',
        costoBase:36400,pvBase:pvS(36400),features:['Diseño asférico','Poly (1.59)','Más delgado que esférico']},
      {tier:'Top',rec:false,tallado:true,arIncluido:true,freelens:false,aliens:false,
        nombre:'Essilor — ***Airwear *Crizal Sapphire HR UV',
        desc:'Airwear con AR Crizal Sapphire HR. Máxima calidad.',
        costoBase:95300,pvBase:pvS(95300),features:['Material Airwear','AR Crizal Sapphire HR incluido']},
    ]];
  }

  if (matNivel==='1_60') {
    // Desde 1.60 — potMax 3-5
    return [[
      {tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,
        nombre:'Poly Digital Monofocal Single (Freelens)',
        desc:'Lente Poly (1.59) digital para fórmulas medias-altas.',
        costoBase:89000,pvBase:89000*4,features:['Material Poly 1.59','Digital','Apto para astigmatismo']},
      {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:true,freelens:false,
        nombre:'Aliens — Poly VS (Visión Sencilla)',
        desc:'Lente claro Poly visión sencilla Aliens.',
        costoBase:50000,pvBase:pvA(50000),features:['Material Poly (1.59)','Visión sencilla','Diseño Aliens']},
      {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — 1.60 *Blue UV Tallado',
        desc:'Alto índice 1.60 con filtro azul. Más delgado.',
        costoBase:104500,pvBase:pvS(104500),features:['Índice 1.60','Filtro luz azul-violeta','Ideal monturas delgadas']},
    ],[
      {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — Poly Esférico — Asférico Tallado',
        desc:'Poly asférico. Mayor nitidez y menor grosor.',
        costoBase:36400,pvBase:pvS(36400),features:['Diseño asférico','Poly (1.59)','Más delgado']},
      {tier:'Superior',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — 1.60 *Blue UV Tallado',
        desc:'Alto índice 1.60 con filtro azul. Ideal para fórmulas entre ±3 y ±5.',
        costoBase:104500,pvBase:pvS(104500),features:['Índice 1.60 ultrafino','Filtro luz azul-violeta','Ideal monturas delgadas']},
      {tier:'Top',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — Trivex Esférico Tallado',
        desc:'Material Trivex. Liviano, resistente, garantía 1 año.',
        costoBase:63500,pvBase:pvS(63500),features:['Material Trivex premium','Más liviano que Poly','Garantía 1 año']},
    ]];
  }

  if (matNivel==='1_67') {
    // Desde 1.67 — potMax 5-7
    return [[
      {tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,
        nombre:'Poly Digital Monofocal Single (Freelens)',
        desc:'Poly (1.59) digital. Opción de entrada para fórmulas altas.',
        costoBase:89000,pvBase:89000*4,features:['Material Poly 1.59','Digital']},
      {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:true,freelens:false,
        nombre:'Aliens — 1.60 Blue Cut (Visión Sencilla)',
        desc:'Lente 1.60 con filtro azul. Gama media Aliens para fórmulas altas.',
        costoBase:105000,pvBase:pvA(105000),features:['Índice 1.60','Filtro luz azul','Diseño Aliens']},
      {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — Thin & Lite 1.67 *Blue UV Tallado',
        desc:'Índice 1.67 con filtro azul. Excelente para fórmulas altas.',
        costoBase:149900,pvBase:pvS(149900),features:['Índice 1.67 ultrafino','Filtro azul UV integrado','Para fórmulas hasta ±7']},
    ],[
      {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — 1.60 *Blue UV Tallado',
        desc:'1.60 con filtro azul. Buena relación precio/delgadez.',
        costoBase:104500,pvBase:pvS(104500),features:['Índice 1.60','Filtro azul UV','Más delgado']},
      {tier:'Superior',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — Thin & Lite 1.67 *Blue UV Tallado',
        desc:'Índice 1.67. Para fórmulas entre ±5 y ±7.',
        costoBase:149900,pvBase:pvS(149900),features:['Índice 1.67 ultrafino','Para fórmulas altas','Filtro azul UV integrado']},
      {tier:'Top',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
        nombre:'Essilor — Alto Índice 1.74 AR Clarity Tallado',
        desc:'El índice más alto. Para fórmulas extremadamente altas.',
        costoBase:208100,pvBase:pvS(208100),features:['Índice 1.74 ultra delgado','AR Clarity incluido','Esfera hasta ±18.00']},
    ]];
  }

  // 1_74 — potMax > 7
  return [[
    {tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:true,aliens:false,
      nombre:'Poly Digital Monofocal Single (Freelens)',
      desc:'Poly (1.59) digital. Opción de entrada para fórmulas muy altas.',
      costoBase:89000,pvBase:89000*4,features:['Material Poly 1.59','Digital']},
    {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:true,freelens:false,
      nombre:'Aliens — 1.60 Blue Cut (Visión Sencilla)',
      desc:'1.60 con filtro azul Aliens. Gama media para fórmulas muy altas.',
      costoBase:105000,pvBase:pvA(105000),features:['Índice 1.60','Filtro azul','Diseño Aliens']},
    {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
      nombre:'Essilor — Alto Índice 1.74 AR Clarity Tallado',
      desc:'El índice más alto disponible. Para fórmulas extremadamente altas.',
      costoBase:208100,pvBase:pvS(208100),features:['Índice 1.74 ultra delgado','AR Clarity incluido','Esfera hasta ±18.00']},
  ],[
    {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
      nombre:'Essilor — Thin & Lite 1.67 *Blue UV Tallado',
      desc:'1.67 con filtro azul. Excelente para fórmulas muy altas.',
      costoBase:149900,pvBase:pvS(149900),features:['Índice 1.67 ultrafino','Filtro azul UV integrado']},
    {tier:'Superior',rec:true,tallado:true,arIncluido:false,freelens:false,aliens:false,
      nombre:'Essilor — Alto Índice 1.74 AR Clarity Tallado',
      desc:'El más delgado del mercado. Esencial para graduaciones superiores a ±7.',
      costoBase:208100,pvBase:pvS(208100),features:['Índice 1.74 ultra delgado','AR Clarity incluido','Máxima estética']},
    {tier:'Top',rec:false,tallado:true,arIncluido:false,freelens:false,aliens:false,
      nombre:'Essilor — Trivex Esférico Tallado',
      desc:'Trivex para fórmulas altas. Liviano y con garantía 1 año.',
      costoBase:63500,pvBase:pvS(63500),features:['Material Trivex','Garantía 1 año','Liviano y resistente']},
  ]];
}

// ── Filtra opciones según labs activos ────────────────────────────────────────
// Si un lab está desactivado, esa tarjeta se omite del array.
// Si quedan menos de 3, rellena desde los demás labs activos.
function filtrarPorLabs(grupos, labs) {
  return grupos.map(grupo => {
    // Filtra cards cuyo lab está activo
    const activas = grupo.filter(op => {
      if (op.freelens && !labs.freelens) return false;
      if (op.aliens   && !labs.aliens)   return false;
      if (!op.freelens && !op.aliens && !labs.servi) return false;
      return true;
    });
    return activas;
  });
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [od, setOd] = useState({esf:0,cil:0,eje:'',add:0});
  const [oi, setOi] = useState({esf:0,cil:0,eje:'',add:0});
  const [edad, setEdad] = useState('');
  const [prof, setProf] = useState('');
  const [primerVez, setPrimerVez] = useState(false);
  const [transitions, setTransitions] = useState(false);
  const [blue, setBlue] = useState(false);
  const [arActivo, setArActivo] = useState(false);
  const [arColor, setArColor] = useState('verde');
  const [arOtros, setArOtros] = useState(false);
  const [arOtrosVal, setArOtrosVal] = useState(0);
  const [mostrar, setMostrar] = useState(false);
  const [grupo, setGrupo] = useState(0);
  const [showConfig, setShowConfig] = useState(false);

  // Laboratorios activos — todos activados por defecto
  const [labs, setLabs] = useState({ freelens: true, aliens: true, servi: true });
  const toggleLab = (lab) => setLabs(prev => ({...prev, [lab]: !prev[lab]}));

  const tieneAdd = od.add>0 || oi.add>0;
  const esProg = tieneAdd;
  const potMax = Math.max(Math.abs(od.esf), Math.abs(oi.esf), Math.abs(od.cil), Math.abs(oi.cil));
  const maxEsf = Math.max(Math.abs(od.esf), Math.abs(oi.esf));
  const maxCil = Math.max(Math.abs(od.cil), Math.abs(oi.cil));
  const edadN = parseInt(edad)||0;
  const esNino = edadN>0 && edadN<14;
  const esExterior = prof==='exterior' || prof==='conductor';
  const necesitaTallado = maxEsf>4 || maxCil>2;
  const arKey = getArKey(arActivo, arColor, arOtros, arOtrosVal);
  const matNivel = getMatNivel(potMax);

  const matInfo = {
    cr:     '≤ 2.00 D — Material: CR-39 o 1.56',
    '1_56': '2.00-3.00 D — Material mínimo: 1.56',
    '1_60': '3.00-5.00 D — Material mínimo: 1.60',
    '1_67': '5.00-7.00 D — Material mínimo: 1.67',
    '1_74': '> 7.00 D — Material mínimo: 1.74',
  }[matNivel];

  const gruposRaw = useMemo(() =>
    buildOps(esProg, potMax, maxEsf, maxCil, transitions, blue, esExterior, esNino, edadN, arKey),
    [esProg, potMax, maxEsf, maxCil, transitions, blue, esExterior, esNino, edadN, arKey]
  );

  const grupos = useMemo(() =>
    filtrarPorLabs(gruposRaw, labs),
    [gruposRaw, labs]
  );

  // Si el grupo actual queda vacío, volver al 0
  const grupoActual = grupos[grupo]?.length > 0 ? grupo : 0;
  const grupoData = grupos[grupoActual] || [];
  const grupo2Tiene = grupos[1]?.length > 0;

  const labsConfig = [
    { key: 'freelens', label: 'Freelens', color: '#0066CC', desc: 'Económico' },
    { key: 'aliens',   label: 'Aliens',   color: '#CC0000', desc: 'Gama media' },
    { key: 'servi',    label: 'Servioptica', color: '#185FA5', desc: 'Premium / Essilor / Shamir' },
  ];

  const chip = (label, active, onClick) => (
    <button onClick={onClick} style={{padding:'5px 12px',borderRadius:'20px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:'600',background:active?'#185FA5':'#f0f0f0',color:active?'white':'#555',transition:'all 0.15s'}}>{label}</button>
  );
  const tratRow = (label, val, fn) => (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #eee'}}>
      <span style={{fontSize:'13px',color:'#333'}}>{label}</span>
      <Toggle checked={val} onChange={fn}/>
    </div>
  );

  return (
    <div style={{maxWidth:'900px',margin:'0 auto',padding:'1.5rem',fontFamily:'system-ui,sans-serif'}}>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h2 style={{fontSize:'20px',fontWeight:'700',color:'#185FA5',margin:0}}>Cotizador de Lentes</h2>
        <button onClick={()=>setShowConfig(!showConfig)} style={{
          fontSize:'12px',padding:'6px 14px',borderRadius:'8px',border:'1px solid #ddd',
          cursor:'pointer',background:showConfig?'#185FA5':'#f8f9fa',
          color:showConfig?'white':'#555',fontWeight:'600',display:'flex',alignItems:'center',gap:'6px'
        }}>
          ⚙ Laboratorios
        </button>
      </div>

      {/* Configuración de laboratorios */}
      {showConfig && (
        <div style={{marginBottom:'1.5rem',background:'#f8f9fa',borderRadius:'12px',padding:'14px',border:'1px solid #eee'}}>
          <div style={{fontSize:'11px',fontWeight:'600',color:'#888',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'12px'}}>
            Laboratorios activos
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {labsConfig.map(lab => (
              <div key={lab.key} style={{
                display:'flex',alignItems:'center',justifyContent:'space-between',
                background:'#fff',borderRadius:'10px',padding:'10px 14px',
                border:`1.5px solid ${labs[lab.key] ? lab.color : '#eee'}`,
                opacity: labs[lab.key] ? 1 : 0.5,
                transition:'all 0.2s',
              }}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'10px',height:'10px',borderRadius:'50%',background:labs[lab.key]?lab.color:'#ccc'}}/>
                  <div>
                    <div style={{fontSize:'13px',fontWeight:'600',color:'#222'}}>{lab.label}</div>
                    <div style={{fontSize:'11px',color:'#888'}}>{lab.desc}</div>
                  </div>
                </div>
                <Toggle checked={labs[lab.key]} onChange={()=>toggleLab(lab.key)}/>
              </div>
            ))}
          </div>
          {!labs.freelens && !labs.aliens && !labs.servi && (
            <div style={{marginTop:'10px',background:'#FAEEDA',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:'#633806'}}>
              ⚠ Ningún laboratorio activo — activa al menos uno para ver recomendaciones.
            </div>
          )}
          {(!labs.servi) && (
            <div style={{marginTop:'8px',background:'#E6F1FB',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:'#0C447C'}}>
              ℹ Sin Servioptica: no se mostrarán opciones Essilor, Varilux, Shamir ni Eyezen.
            </div>
          )}
        </div>
      )}

      {/* Datos paciente */}
      <div style={{marginBottom:'1.5rem'}}>
        <div style={{fontSize:'11px',fontWeight:'600',color:'#888',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'10px'}}>Datos del paciente</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
          <div>
            <div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>Edad</div>
            <input type="number" min={1} max={100} placeholder="Ej: 45" value={edad}
              onChange={e=>setEdad(e.target.value)}
              style={{width:'100%',boxSizing:'border-box',padding:'7px 10px',borderRadius:'8px',border:'1px solid #ccc',fontSize:'13px',outline:'none',color:'#000'}}/>
          </div>
          <div>
            <div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>Profesión</div>
            <select value={prof} onChange={e=>setProf(e.target.value)}
              style={{width:'100%',padding:'7px 10px',borderRadius:'8px',border:'1px solid #ccc',fontSize:'13px',outline:'none',color:'#000'}}>
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
        {esNino && <div style={{marginTop:'8px',background:'#E6F1FB',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:'#0C447C'}}>👶 Paciente menor de 14 años — productos pediátricos activados.</div>}
      </div>

      {/* Fórmula */}
      <div style={{marginBottom:'1.5rem'}}>
        <div style={{fontSize:'11px',fontWeight:'600',color:'#888',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'10px'}}>Fórmula óptica</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <EyeFields label="Ojo derecho (OD)" state={od} setState={setOd}/>
          <EyeFields label="Ojo izquierdo (OI)" state={oi} setState={setOi}/>
        </div>
        {potMax>0 && <div style={{marginTop:'8px',background:'#f0f4ff',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:'#3C3489'}}>
          📊 Potencia máxima: <strong>{potMax.toFixed(2)} D</strong> — {matInfo}
        </div>}
        {necesitaTallado && <div style={{marginTop:'6px',background:'#FAEEDA',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:'#633806'}}>
          ⚠ Fórmula fuera de rango terminado — se usarán lentes tallados o digitales.
        </div>}
      </div>

      {/* Tratamientos */}
      <div style={{marginBottom:'1.5rem'}}>
        <div style={{fontSize:'11px',fontWeight:'600',color:'#888',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'10px'}}>Tratamientos</div>
        <div style={{background:'#fff',border:'1px solid #eee',borderRadius:'12px',padding:'0 14px'}}>
          {tratRow('Fotosensible (Transitions Gen S)', transitions, v=>{setTransitions(v);if(v)setBlue(false);})}
          {tratRow('Filtro luz azul-violeta', blue, v=>{setBlue(v);if(v)setTransitions(false);})}
          <div style={{padding:'10px 0'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:arActivo?'12px':'0'}}>
              <span style={{fontSize:'13px',color:'#333'}}>Antirreflejo (AR)</span>
              <Toggle checked={arActivo} onChange={v=>{setArActivo(v);if(!v){setArOtros(false);setArOtrosVal(0);}}}/>
            </div>
            {arActivo && <div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'8px'}}>
                {chip('AR Verde',!arOtros&&arColor==='verde',()=>{setArColor('verde');setArOtros(false);})}
                {chip('AR Azul',!arOtros&&arColor==='azul',()=>{setArColor('azul');setArOtros(false);})}
                {labs.servi && chip('Otros tipos (Servi)',arOtros,()=>setArOtros(!arOtros))}
              </div>
              {arOtros && labs.servi && <select value={arOtrosVal} onChange={e=>setArOtrosVal(parseInt(e.target.value))}
                style={{width:'100%',fontSize:'13px',padding:'7px',borderRadius:'8px',border:'1px solid #ccc',outline:'none',color:'#000'}}>
                <option value={0}>Seleccionar AR Servioptica...</option>
                {AR_SERVI_OPTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>}
              <div style={{marginTop:'6px',fontSize:'11px',color:'#999'}}>
                AR Verde/Azul aplica con nombre propio según laboratorio. "Otros tipos" solo para Servioptica.
              </div>
            </div>}
          </div>
        </div>
      </div>

      <button onClick={()=>{setMostrar(true);setGrupo(0);}}
        style={{width:'100%',background:'#185FA5',color:'white',border:'none',borderRadius:'10px',padding:'12px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
        Generar opciones para el paciente
      </button>

      {mostrar && <div style={{marginTop:'2rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={{fontSize:'11px',fontWeight:'600',color:'#888',letterSpacing:'0.06em',textTransform:'uppercase'}}>
            {grupoActual===0?'Opciones principales':'Opciones premium'}
          </div>
          <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
            {grupo2Tiene && <span style={{fontSize:'11px',color:'#aaa'}}>{grupoActual+1} de 2</span>}
            {grupoActual===1 && <button onClick={()=>setGrupo(0)} style={{fontSize:'12px',padding:'5px 12px',borderRadius:'8px',cursor:'pointer',background:'#f0f0f0',border:'none',color:'#333',fontWeight:'600'}}>Volver</button>}
            {grupoActual===0 && grupo2Tiene && <button onClick={()=>setGrupo(1)} style={{fontSize:'12px',padding:'5px 12px',borderRadius:'8px',cursor:'pointer',background:'#185FA5',border:'none',color:'white',fontWeight:'600'}}>Ver opciones premium</button>}
          </div>
        </div>

        {grupoData.length === 0 ? (
          <div style={{background:'#FAEEDA',borderRadius:'10px',padding:'20px',textAlign:'center',fontSize:'13px',color:'#633806'}}>
            No hay opciones disponibles con los laboratorios activos. Activa al menos un laboratorio en ⚙ Laboratorios.
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(grupoData.length,3)},minmax(0,1fr))`,gap:'12px'}}>
            {grupoData.map((op,i)=><OptionCard key={i} op={op} arKey={arKey}/>)}
          </div>
        )}

        {primerVez && <div style={{marginTop:'12px',background:'#E6F1FB',borderRadius:'8px',padding:'10px 14px',fontSize:'12px',color:'#0C447C'}}>
          Aviso: paciente sin experiencia previa. Explicar período de adaptación, especialmente en progresivos.
        </div>}
        <div style={{marginTop:'10px',fontSize:'11px',color:'#aaa'}}>Precios por par. No incluyen montaje ni IVA.</div>
      </div>}
    </div>
  );
}