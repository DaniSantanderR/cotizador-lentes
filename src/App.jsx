import { useState, useMemo } from "react";

const AR_PV={verde:70000,azul:130000,28200:70000,35200:130000,40900:130000,44100:130000,101200:340000,135900:340000};
const AR_COSTO={verde:40000,azul:50000,28200:28200,35200:35200,40900:40900,44100:44100,101200:101200,135900:135900};
const AR_LABEL={verde:'Defenser Standar',azul:'Cyan HD',28200:'AR Estándar',35200:'AR Supreme',40900:'AR Clarity',44100:'AR Clarity Blue',101200:'AR Crizal Easy Pro UV',135900:'AR Crizal Sapphire HR UV'};
const AR_SERVI_OPTS=[{label:'AR Estándar',value:28200},{label:'AR Supreme',value:35200},{label:'AR Clarity',value:40900},{label:'AR Clarity Blue',value:44100},{label:'AR Crizal Easy Pro UV',value:101200},{label:'AR Crizal Sapphire HR UV',value:135900}];

function pvS(c){return c<50000?Math.round(c*6):Math.round(c*4);}
function pvA(c){return c<100000?Math.round(c*5):Math.round(c*3.5);}
function fmt(n){return '$'+Math.round(n).toLocaleString('es-CO');}
function r2(v){return Math.round(v*4)/4;}

function parseFormula(raw,forceNeg=false){
  if(raw===''||raw==='-'||raw==='+'||raw===undefined)return 0;
  let s=String(raw).replace(',','.');
  if(!s.includes('.')){
    const absVal=Math.abs(parseFloat(s));
    if(!isNaN(absVal)&&absVal>14){
      const sign=s.startsWith('-')?'-':'';
      const digits=s.replace(/[+-]/g,'');
      s=sign+digits[0]+'.'+digits.slice(1);
    }
  }
  let n=parseFloat(s);
  if(isNaN(n))return 0;
  if(forceNeg&&n>0)n=-n;
  return r2(n);
}

function getArKey(activo,color,otros,otrosVal){
  if(!activo)return null;
  if(otros)return otrosVal>0?otrosVal:null;
  return color;
}

function getMaterialTier(maxEsf,maxCil){
  const max=Math.max(maxEsf,maxCil);
  if(max<2)return'bajo';
  if(max<=4)return'medio';
  return'alto';
}

const inputStyle={width:'100%',boxSizing:'border-box',textAlign:'center',fontSize:'13px',padding:'7px 4px',borderRadius:'8px',border:'1px solid #ccc',background:'#fff',color:'#000',outline:'none'};

function FormulaInput({value,onChange,label,forceNeg=false}){
  const[editing,setEditing]=useState(false);
  const[raw,setRaw]=useState('');
  function display(){if(value===0)return'0.00';return(value>0&&!forceNeg?'+':'')+value.toFixed(2);}
  function onFocus(e){setEditing(true);setRaw('');setTimeout(()=>e.target.select(),0);}
  function onBlur(){setEditing(false);onChange(parseFormula(raw,forceNeg));setRaw('');}
  function onKeyDown(e){
    if(e.key==='ArrowUp'){e.preventDefault();const max=forceNeg?0:20;onChange(r2(Math.min(max,value+0.25)));}
    if(e.key==='ArrowDown'){e.preventDefault();const min=forceNeg?-6:-20;onChange(r2(Math.max(min,value-0.25)));}
    if(e.key==='Enter')e.target.blur();
  }
  return(
    <div>
      {label&&<div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>{label}</div>}
      <input type="text" value={editing?raw:display()} onChange={e=>{if(editing)setRaw(e.target.value);}} onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown} style={inputStyle}/>
    </div>
  );
}

function AddInput({value,onChange}){
  const[editing,setEditing]=useState(false);
  const[raw,setRaw]=useState('');
  function onFocus(e){setEditing(true);setRaw('');setTimeout(()=>e.target.select(),0);}
  function onBlur(){
    setEditing(false);
    if(raw===''||raw==='0'||raw==='N/A'){onChange(0);}
    else{const n=parseFloat(raw.replace(',','.'));onChange(!isNaN(n)?r2(Math.min(3,Math.max(0,n))):value);}
    setRaw('');
  }
  function onKeyDown(e){
    if(e.key==='ArrowUp'){e.preventDefault();onChange(r2(Math.min(3,value+0.25)));}
    if(e.key==='ArrowDown'){e.preventDefault();onChange(r2(Math.max(0,value-0.25)));}
    if(e.key==='Enter')e.target.blur();
  }
  return(
    <div>
      <div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>Adición</div>
      <input type="text" value={editing?raw:(value===0?'N/A':'+'+value.toFixed(2))} onChange={e=>{if(editing)setRaw(e.target.value);}} onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown} style={inputStyle}/>
    </div>
  );
}

function EyeFields({label,state,setState}){
  return(
    <div style={{background:'#f8f9fa',borderRadius:'12px',padding:'12px',border:'1px solid #eee'}}>
      <p style={{fontSize:'13px',fontWeight:'600',margin:'0 0 10px',color:'#222'}}>{label}</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'8px'}}>
        <FormulaInput label="Esfera" value={state.esf} onChange={v=>setState({...state,esf:v})} forceNeg={false}/>
        <FormulaInput label="Cilindro" value={state.cil} onChange={v=>setState({...state,cil:v})} forceNeg={true}/>
        <div>
          <div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>Eje (0-180)</div>
          <input type="number" min={0} max={180} placeholder="°" value={state.eje||''} onChange={e=>setState({...state,eje:e.target.value})} style={{...inputStyle,color:'#000'}}/>
        </div>
        <AddInput value={state.add} onChange={v=>setState({...state,add:v})}/>
      </div>
    </div>
  );
}

function Toggle({checked,onChange}){
  return(
    <div onClick={()=>onChange(!checked)} style={{width:'36px',height:'20px',borderRadius:'10px',background:checked?'#185FA5':'#ccc',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}>
      <div style={{position:'absolute',top:'3px',left:checked?'19px':'3px',width:'14px',height:'14px',borderRadius:'50%',background:'white',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.3)'}}/>
    </div>
  );
}

const tierPalette={'Económica':{bg:'#f0f0f0',txt:'#555'},'Estándar':{bg:'#E6F1FB',txt:'#0C447C'},'Premium':{bg:'#EAF3DE',txt:'#27500A'},'Avanzada':{bg:'#EEEDFE',txt:'#3C3489'},'Superior':{bg:'#FAEEDA',txt:'#633806'},'Top':{bg:'#E1F5EE',txt:'#085041'}};

function OptionCard({op,arKey}){
  const tc=tierPalette[op.tier]||tierPalette['Estándar'];
  const aplicaAR=op.tallado&&!op.arIncluido&&arKey!==null;
  const arCosto=aplicaAR?(AR_COSTO[arKey]||0):0;
  const arPv=aplicaAR?(AR_PV[arKey]||0):0;
  const arNombre=aplicaAR&&arCosto>0?(AR_LABEL[arKey]||'AR seleccionado'):'';
  const costoTotal=op.costoBase+arCosto;
  const pvTotal=op.pvBase+arPv;
  return(
    <div style={{background:'#fff',border:op.rec?'2px solid #185FA5':'1px solid #eee',borderRadius:'14px',padding:'14px',display:'flex',flexDirection:'column',gap:'7px',boxShadow:op.rec?'0 2px 12px rgba(24,95,165,0.12)':'none'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'4px'}}>
        <span style={{fontSize:'11px',padding:'3px 8px',borderRadius:'20px',background:tc.bg,color:tc.txt,fontWeight:'600'}}>{op.tier}</span>
        {op.rec&&<span style={{fontSize:'10px',padding:'3px 8px',borderRadius:'20px',background:'#185FA5',color:'white',fontWeight:'600'}}>Recomendado</span>}
      </div>
      <div style={{fontSize:'13px',fontWeight:'600',color:'#222',lineHeight:'1.3'}}>{op.nombre}</div>
      <div style={{fontSize:'11px',color:'#666',lineHeight:'1.5',flexGrow:1}}>{op.desc}</div>
      <div style={{borderTop:'1px solid #eee',paddingTop:'7px'}}>
        {op.features.map((f,i)=>(
          <div key={i} style={{fontSize:'11px',color:'#666',padding:'2px 0',display:'flex',gap:'5px'}}>
            <span style={{color:'#185FA5',fontWeight:'700'}}>·</span>{f}
          </div>
        ))}
        {op.arIncluido&&<div style={{fontSize:'11px',color:'#27500A',padding:'2px 0',display:'flex',gap:'5px',marginTop:'2px'}}><span style={{color:'#27500A',fontWeight:'700'}}>·</span>AR incluido en el lente</div>}
        {aplicaAR&&arCosto>0&&<div style={{fontSize:'11px',color:'#0C447C',padding:'2px 0',display:'flex',gap:'5px',marginTop:'2px'}}><span style={{color:'#0C447C',fontWeight:'700'}}>·</span>+ {arNombre}</div>}
      </div>
      <div style={{marginTop:'4px',background:'#f8f9fa',borderRadius:'10px',padding:'10px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
          <span style={{fontSize:'10px',color:'#999'}}>Costo</span>
          <span style={{fontSize:'11px',color:'#999'}}>{fmt(costoTotal)}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:'12px',fontWeight:'600',color:'#333'}}>Precio cliente</span>
          <span style={{fontSize:'18px',fontWeight:'700',color:'#185FA5'}}>{fmt(pvTotal)}</span>
        </div>
      </div>
    </div>
  );
}

function buildOps(esProg,maxEsf,maxCil,transitions,polarizado,esExterior,esOficina,blue,esNino){
  const freeTermOk=maxEsf<=4&&maxCil<=2;
  const mat=getMaterialTier(maxEsf,maxCil);

  if(esNino){
    if(esProg){
      return[[
        {tier:'Económica',rec:false,tallado:true,arIncluido:false,aliens:false,nombre:'Progresivo Digital Profesional Free 1.56',desc:'Progresivo digital pediátrico de entrada. Apto para astigmatismo.',costoBase:100000,pvBase:100000*4,features:['Progresivo digital 1.56','Apto para astigmatismo']},
        {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:false,nombre:'* Shamir Cool (Progresivo Pediátrico) ***Poly',desc:'Progresivo diseñado para niños. Adaptación rápida y amplia zona visual.',costoBase:94900,pvBase:pvS(94900),features:['Diseño pediátrico especializado','Adaptación rápida en niños']},
        {tier:'Premium',rec:false,tallado:true,arIncluido:false,aliens:false,nombre:'* Shamir Cool ***Poly *Blue 1.56',desc:'Progresivo pediátrico con filtro luz azul.',costoBase:110200,pvBase:pvS(110200),features:['Diseño pediátrico','Filtro luz azul-violeta','Protección UV']},
      ],[
        {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,aliens:false,nombre:'* Eyezen Start/FIT ***Airwear *Blue UV',desc:'Lente digital para niños con pantallas.',costoBase:114000,pvBase:pvS(114000),features:['Filtro luz azul-violeta','Material Airwear']},
        {tier:'Superior',rec:true,tallado:true,arIncluido:true,aliens:false,nombre:'* Eyezen Start/FIT ***Airwear +Crizal Easy Pro',desc:'Máxima protección digital. AR Crizal Easy Pro incluido.',costoBase:180700,pvBase:pvS(180700),features:['AR Crizal Easy Pro incluido','Filtro luz azul-violeta']},
        {tier:'Top',rec:false,tallado:true,arIncluido:true,aliens:false,nombre:'* Stellest ***Airwear +Crizal Rock',desc:'Control progresión miopía en niños.',costoBase:216600,pvBase:pvS(216600),features:['Control progresión miopía','AR Crizal Rock incluido']},
      ]];
    }
    const ecoN=freeTermOk?{costoBase:11000,pvBase:66000,tallado:false,arIncluido:false,aliens:false,nombre:'Poly Blanco terminado',desc:'Lente claro Poly para niños con fórmulas básicas.',features:['Material Poly resistente','Liviano y seguro']}:{costoBase:89000,pvBase:89000*4,tallado:true,arIncluido:false,aliens:false,nombre:'Poly Digital Monofocal Single',desc:'Digital en Poly para niños con astigmatismo.',features:['Digital personalizado','Apto para astigmatismo']};
    return[[
      {...ecoN,tier:'Económica',rec:false},
      {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:true,nombre:'Blue Cut Poly (Aliens PerfectionHD)',desc:'Filtro azul en Poly para uso escolar y pantallas.',costoBase:135000,pvBase:pvA(135000),features:['Filtro luz azul','Material Poly']},
      {tier:'Premium',rec:false,tallado:true,arIncluido:false,aliens:false,nombre:'* Eyezen Start/FIT ***Airwear *Blue UV',desc:'Diseñado para niños con uso digital intensivo.',costoBase:114000,pvBase:pvS(114000),features:['Filtro luz azul-violeta','Material Airwear']},
    ],[
      {tier:'Avanzada',rec:false,tallado:true,arIncluido:true,aliens:false,nombre:'* Eyezen Start/FIT ***Airwear +Crizal Easy Pro',desc:'Eyezen con AR Crizal Easy Pro.',costoBase:180700,pvBase:pvS(180700),features:['AR Crizal Easy Pro incluido','Filtro luz azul-violeta']},
      {tier:'Superior',rec:true,tallado:true,arIncluido:true,aliens:false,nombre:'* Stellest ***Airwear +Crizal Rock',desc:'Control de miopía. La opción más avanzada para niños.',costoBase:216600,pvBase:pvS(216600),features:['Control progresión miopía','Tecnología Stellest','AR Crizal Rock incluido']},
      {tier:'Top',rec:false,tallado:true,arIncluido:false,aliens:true,nombre:'Myofix Kids (Aliens)',desc:'Control de miopía pediátrico hasta 12 años.',costoBase:350000,pvBase:pvA(350000),features:['Control miopía pediátrico','Diseño Myofix','Uso terapéutico 2h/día']},
    ]];
  }

  if(esProg){
    const usaTerm=freeTermOk&&maxCil===0&&maxEsf<=3;
    const ecoBase=usaTerm
      ?{costoBase:25000,pvBase:120000,tallado:false,arIncluido:false,aliens:false,nombre:'CR Progresivo terminado',desc:'Progresivo terminado para fórmulas esféricas bajas.',features:['Solo esfera sin cilindro','Adición +1.00 a +3.00']}
      :{costoBase:100000,pvBase:100000*4,tallado:true,arIncluido:false,aliens:false,nombre:'Progresivo Digital Profesional Free 1.56',desc:'Progresivo digital apto para astigmatismo.',features:['Digital 1.56','Apto para astigmatismo']};

    if(transitions||esExterior){
      // Progresivos fotosensibles: material + tratamiento transitions
      const matFoto=mat==='bajo'
        ?{alienNom:'Gris Gen•S CR (Aliens PrecisaHDV)',alienCosto:340000,alienPv:pvA(340000),serviNom:'***CR 39 *Transitions GEN S Gris',serviCosto:81100,serviPv:pvS(81100),topNom:'***Airwear *Transitions GEN S Gris +Crizal Sapphire HR UV',topCosto:164500,topPv:pvS(164500),topAR:true}
        :mat==='medio'
        ?{alienNom:'Gris Gen•S CR (Aliens PrecisaHDV)',alienCosto:340000,alienPv:pvA(340000),serviNom:'***Poly *Transitions GEN S Gris',serviCosto:120500,serviPv:pvS(120500),topNom:'***Airwear *Transitions GEN S Gris +Crizal Sapphire HR UV',topCosto:164500,topPv:pvS(164500),topAR:true}
        :{alienNom:'Gris Gen•S Poly (Aliens PrecisaHDV)',alienCosto:360000,alienPv:pvA(360000),serviNom:'***Poly *Transitions GEN S Gris',serviCosto:120500,serviPv:pvS(120500),topNom:'***Poly *Transitions Xtractive NG Gris',topCosto:139600,topPv:pvS(139600),topAR:false};
      return[[
        {...ecoBase,tier:'Económica',rec:false},
        {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:true,nombre:matFoto.alienNom,desc:'Progresivo fotosensible Transitions Gen S. Gama media Aliens.',costoBase:matFoto.alienCosto,pvBase:matFoto.alienPv,features:['Transitions Gen S incluido','Progresivo digital','Adición 0.50 a 3.50']},
        {tier:'Premium',rec:false,tallado:true,arIncluido:false,aliens:false,nombre:matFoto.serviNom,desc:'Progresivo con Transitions Gen S. Material según fórmula.',costoBase:matFoto.serviCosto,pvBase:matFoto.serviPv,features:['Transitions Gen S','Bloqueo UV 100%','Decoloración rápida']},
      ],[
        {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,aliens:true,nombre:'Gris Gen•S Poly (Aliens AilensHDC)',desc:'Progresivo Transitions Gen S Poly. Diseño premium Aliens.',costoBase:590000,pvBase:pvA(590000),features:['Transitions Gen S Poly','Diseño AilensHDC','Adición 0.75 a 3.75']},
        {tier:'Superior',rec:true,tallado:true,arIncluido:matFoto.topAR,aliens:false,nombre:matFoto.topNom,desc:'Progresivo fotosensible de alta gama Servioptica.',costoBase:matFoto.topCosto,pvBase:matFoto.topPv,features:[matFoto.topAR?'AR Crizal Sapphire HR incluido':'Transitions Xtractive — activa en el auto','Material premium']},
        {tier:'Top',rec:false,tallado:true,arIncluido:true,aliens:false,nombre:'* Varilux Physio Extensee/FIT ***Airwear *Transitions GEN S Gris/Café',desc:'El más avanzado de Varilux con Transitions Gen S. AR Crizal Sapphire HR incluido.',costoBase:644400,pvBase:pvS(644400),features:['Airwear liviano','Transitions Gen S incluido','AR Crizal Sapphire HR incluido']},
      ]];
    }

    // Progresivos claros — material según fórmula
    const matPC=mat==='bajo'
      ?{alienNom:'CR-39 Progresivo (Aliens NaturalNA)',alienCosto:70000,alienPv:pvA(70000),serviMedNom:'* Ovation DS/FIT ***Airwear',serviMedCosto:136900,serviMedPv:pvS(136900)}
      :mat==='medio'
      ?{alienNom:'Progresivo Poly Natural NA (Aliens)',alienCosto:80000,alienPv:pvA(80000),serviMedNom:'* Ovation DS/FIT ***Airwear',serviMedCosto:136900,serviMedPv:pvS(136900)}
      :{alienNom:'Progresivo Poly Natural NA (Aliens)',alienCosto:80000,alienPv:pvA(80000),serviMedNom:'* Varilux Liberty 3.0/FIT ***Airwear',serviMedCosto:226900,serviMedPv:pvS(226900)};
    return[[
      {...ecoBase,tier:'Económica',rec:false},
      {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:true,nombre:matPC.alienNom,desc:'Progresivo digital de gama media Aliens.',costoBase:matPC.alienCosto,pvBase:matPC.alienPv,features:['Progresivo digital','Buena amplitud visual']},
      {tier:'Premium',rec:false,tallado:true,arIncluido:false,aliens:false,nombre:matPC.serviMedNom,desc:'Progresivo Essilor de gama media en Airwear.',costoBase:matPC.serviMedCosto,pvBase:matPC.serviMedPv,features:['Material Airwear','Progresivo Essilor','Incluye bisel']},
    ],[
      {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,aliens:false,nombre:'* Varilux Comfort Max/FIT ***Airwear',desc:'Varilux Comfort Max. Visión estable en todas las distancias.',costoBase:273500,pvBase:pvS(273500),features:['Varilux Comfort Max','Material Airwear','Visión estable']},
      {tier:'Superior',rec:true,tallado:true,arIncluido:true,aliens:false,nombre:'* Varilux Physio Extensee/FIT ***Airwear',desc:'El más avanzado de Varilux. AR Crizal Sapphire HR incluido.',costoBase:430700,pvBase:pvS(430700),features:['Airwear liviano','AR Crizal Sapphire HR incluido','Visión nítida todas las distancias']},
      {tier:'Top',rec:false,tallado:true,arIncluido:true,aliens:false,nombre:'* Shamir Autograph III D ***Poly',desc:'Progresivo freeform Shamir. AR Crizal Sapphire incluido.',costoBase:375800,pvBase:pvS(375800),features:['Freeform personalizado','AR Crizal Sapphire incluido','Sin restricción de montura']},
    ]];
  }

  if(transitions||polarizado||esExterior){
    const usaTerm=freeTermOk;
    const ecoF=usaTerm
      ?{costoBase:30000,pvBase:160000,tallado:false,arIncluido:true,aliens:false,nombre:'CR Foto AR Verde terminado',desc:'Fotosensible terminado con AR incluido.',features:['Fotosensible básico','AR verde incluido','Esfera +/-4.00']}
      :{costoBase:99000,pvBase:99000*4,tallado:true,arIncluido:false,aliens:false,nombre:'CR Foto Free digital',desc:'Fotosensible digital para astigmatismo.',features:['Fotosensible digital','Apto para astigmatismo']};
    const matF=mat==='bajo'
      ?{alienNom:'Blue Cut Photo CR (Aliens)',alienCosto:125000,alienPv:pvA(125000),serviNom:'***CR 39 *Transitions GEN S Gris',serviCosto:81100,serviPv:pvS(81100)}
      :mat==='medio'
      ?{alienNom:'Blue Cut Photo Poly (Aliens)',alienCosto:125000,alienPv:pvA(125000),serviNom:'***Poly *Acclimates Gris',serviCosto:74100,serviPv:pvS(74100)}
      :{alienNom:'Blue Cut Photo Poly (Aliens)',alienCosto:125000,alienPv:pvA(125000),serviNom:'***Poly *Transitions GEN S Gris',serviCosto:120500,serviPv:pvS(120500)};
    return[[
      {...ecoF,tier:'Económica',rec:false},
      {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:true,nombre:matF.alienNom,desc:'Fotosensible con filtro azul. Gama media Aliens.',costoBase:matF.alienCosto,pvBase:matF.alienPv,features:['Fotosensible + filtro azul','Protección UV completa']},
      {tier:'Premium',rec:false,tallado:true,arIncluido:false,aliens:false,nombre:matF.serviNom,desc:'Fotosensible Servioptica. Material según fórmula.',costoBase:matF.serviCosto,pvBase:matF.serviPv,features:['Material adecuado a la fórmula','Bloqueo UV 100%']},
    ],[
      {tier:'Avanzada',rec:false,tallado:true,arIncluido:true,aliens:false,nombre:'***Airwear *Transitions GEN S Gris +Crizal Sapphire HR UV',desc:'Transitions en Airwear. AR Crizal Sapphire HR incluido.',costoBase:164500,pvBase:pvS(164500),features:['Material Airwear liviano','Transitions Gen S']},
      {tier:'Superior',rec:true,tallado:true,arIncluido:false,aliens:false,nombre:'***Poly *Transitions Xtractive NG Gris',desc:'Se activa dentro del vehículo. Mayor oscurecimiento.',costoBase:139600,pvBase:pvS(139600),features:['Funciona dentro del auto','Mayor % oscurecimiento','Bloqueo UV y luz azul']},
      {tier:'Top',rec:false,tallado:true,arIncluido:false,aliens:false,nombre:'***Poly *Transitions Xtractive Polarized Gris',desc:'Oscurece en el auto y elimina reflejos polarizados.',costoBase:180700,pvBase:pvS(180700),features:['Efecto polarizado activo','Dentro y fuera del vehículo','Máxima protección solar']},
    ]];
  }

  if(blue){
    const usaTerm=freeTermOk;
    const ecoB=usaTerm
      ?{costoBase:15000,pvBase:90000,tallado:false,arIncluido:true,aliens:false,nombre:'CR Blue Block AR Verde terminado',desc:'Filtro azul terminado con AR incluido.',features:['Filtro luz azul','AR verde incluido','Esfera +/-4.00']}
      :{costoBase:95000,pvBase:95000*4,tallado:true,arIncluido:false,aliens:false,nombre:'Poly Blue Block digital',desc:'Filtro azul digital para astigmatismo.',features:['Filtro azul digital','Apto para astigmatismo']};
    const matB=mat==='bajo'
      ?{alienNom:'CR Blue Cut (Aliens PerfectionHD)',alienCosto:100000,alienPv:pvA(100000)}
      :{alienNom:'Blue Cut Poly (Aliens PerfectionHD)',alienCosto:135000,alienPv:pvA(135000)};
    return[[
      {...ecoB,tier:'Económica',rec:false},
      {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:true,nombre:matB.alienNom,desc:'Filtro azul. Material según fórmula. Gama media Aliens.',costoBase:matB.alienCosto,pvBase:matB.alienPv,features:['Filtro luz azul','Diseño PerfectionHD']},
      {tier:'Premium',rec:false,tallado:true,arIncluido:false,aliens:false,nombre:'* Eyezen Start/FIT ***Airwear *Blue UV',desc:'Diseñado para uso digital. Filtra luz azul-violeta.',costoBase:114000,pvBase:pvS(114000),features:['Filtro luz azul-violeta','Material Airwear','Protección UV 100%']},
    ],[
      {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,aliens:false,nombre:'* Eyezen Boost/FIT ***Airwear *Blue UV',desc:'Eyezen con soporte adicional. Menor fatiga en pantallas.',costoBase:114000,pvBase:pvS(114000),features:['Soporte +0.40/0.60/0.85','Filtro luz azul-violeta','Airwear']},
      {tier:'Superior',rec:true,tallado:true,arIncluido:true,aliens:false,nombre:'* Eyezen Start/FIT ***Airwear +Crizal Easy Pro',desc:'Eyezen con AR Crizal Easy Pro incluido.',costoBase:180700,pvBase:pvS(180700),features:['AR Crizal Easy Pro incluido','Filtro luz azul-violeta']},
      {tier:'Top',rec:false,tallado:true,arIncluido:true,aliens:false,nombre:'* Stellest ***Airwear +Crizal Rock',desc:'Control de miopía con AR Crizal Rock incluido.',costoBase:216600,pvBase:pvS(216600),features:['Control progresión miopía','AR Crizal Rock incluido']},
    ]];
  }

  // Claros — material según fórmula
  const usaTerm=freeTermOk;
  const eco=usaTerm
    ?{costoBase:11000,pvBase:66000,tallado:false,arIncluido:false,aliens:false,nombre:'Poly Blanco terminado',desc:'Lente claro Poly terminado para fórmulas básicas.',features:['Material Poly','Esfera +/-4.00 sin cilindro']}
    :{costoBase:89000,pvBase:89000*4,tallado:true,arIncluido:false,aliens:false,nombre:'Poly Digital Monofocal Single',desc:'Lente claro digital en Poly.',features:['Digital personalizado','Apto para astigmatismo']};
  const matC=mat==='bajo'
    ?{alienNom:'CR-39 (Aliens PerfectionHD)',alienCosto:80000,alienPv:pvA(80000),serviNom:'* CR 39 V.S 70MM / 75MM Tallado',serviCosto:20800,serviPv:pvS(20800),topNom:'* Poly Esférico — Asférico Tallado',topCosto:36400,topPv:pvS(36400)}
    :mat==='medio'
    ?{alienNom:'Poly (Aliens PerfectionHD)',alienCosto:100000,alienPv:pvA(100000),serviNom:'* Poly Esférico — Asférico Tallado',serviCosto:36400,serviPv:pvS(36400),topNom:'*** Trivex Esférico Tallado',topCosto:63500,topPv:pvS(63500)}
    :{alienNom:'Poly (Aliens PerfectionHD)',alienCosto:100000,alienPv:pvA(100000),serviNom:'* 1.60 *Blue UV Tallado',serviCosto:104500,serviPv:pvS(104500),topNom:'* Thin & Lite 1.67 Tallado',topCosto:149900,topPv:pvS(149900)};
  return[[
    {...eco,tier:'Económica',rec:false},
    {tier:'Estándar',rec:true,tallado:true,arIncluido:false,aliens:true,nombre:matC.alienNom,desc:'Lente claro digital Aliens. Material según fórmula.',costoBase:matC.alienCosto,pvBase:matC.alienPv,features:['Diseño digital Aliens','Material adecuado a la fórmula']},
    {tier:'Premium',rec:false,tallado:true,arIncluido:false,aliens:false,nombre:matC.serviNom,desc:'Lente tallado Servioptica. Material óptimo para la fórmula.',costoBase:matC.serviCosto,pvBase:matC.serviPv,features:['Tallado personalizado','Material según fórmula']},
  ],[
    {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,aliens:false,nombre:'* 1.56 *Blue Tallado',desc:'Índice 1.56 con filtro azul integrado.',costoBase:51000,pvBase:pvS(51000),features:['Índice 1.56','Filtro luz azul-violeta','UV 100%']},
    {tier:'Superior',rec:true,tallado:true,arIncluido:false,aliens:false,nombre:'* 1.60 *Blue UV Tallado',desc:'Alto índice 1.60 con filtro azul. Más delgado para fórmulas altas.',costoBase:104500,pvBase:pvS(104500),features:['Índice 1.60 ultrafino','Filtro luz azul-violeta','Ideal monturas delgadas']},
    {tier:'Top',rec:false,tallado:true,arIncluido:false,aliens:false,nombre:matC.topNom,desc:'El material más delgado disponible para la fórmula.',costoBase:matC.topCosto,pvBase:matC.topPv,features:['Material premium','Máxima estética y delgadez']},
  ]];
}

export default function App(){
  const[od,setOd]=useState({esf:0,cil:0,eje:'',add:0});
  const[oi,setOi]=useState({esf:0,cil:0,eje:'',add:0});
  const[edad,setEdad]=useState('');
  const[prof,setProf]=useState('');
  const[primerVez,setPrimerVez]=useState(false);
  const[transitions,setTransitions]=useState(false);
  const[polarizado,setPolarizado]=useState(false);
  const[blue,setBlue]=useState(false);
  const[arActivo,setArActivo]=useState(false);
  const[arColor,setArColor]=useState('verde');
  const[arOtros,setArOtros]=useState(false);
  const[arOtrosVal,setArOtrosVal]=useState(0);
  const[mostrar,setMostrar]=useState(false);
  const[grupo,setGrupo]=useState(0);

  const tieneAdd=od.add>0||oi.add>0;
  const esProg=tieneAdd;
  const maxEsf=Math.max(Math.abs(od.esf),Math.abs(oi.esf));
  const maxCil=Math.max(Math.abs(od.cil),Math.abs(oi.cil));
  const edadN=parseInt(edad)||0;
  const esNino=edadN>0&&edadN<14;
  const esExterior=prof==='exterior'||prof==='conductor';
  const necesitaTallado=maxEsf>4||maxCil>2;
  const arKey=getArKey(arActivo,arColor,arOtros,arOtrosVal);

  const grupos=useMemo(()=>buildOps(esProg,maxEsf,maxCil,transitions,polarizado,esExterior,prof==='oficina',blue,esNino),
    [esProg,maxEsf,maxCil,transitions,polarizado,esExterior,prof,blue,esNino]);

  const chip=(label,active,onClick)=>(
    <button onClick={onClick} style={{padding:'5px 12px',borderRadius:'20px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:'600',background:active?'#185FA5':'#f0f0f0',color:active?'white':'#555',transition:'all 0.15s'}}>{label}</button>
  );
  const tratRow=(label,val,fn)=>(
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #eee'}}>
      <span style={{fontSize:'13px',color:'#333'}}>{label}</span>
      <Toggle checked={val} onChange={fn}/>
    </div>
  );

  return(
    <div style={{maxWidth:'900px',margin:'0 auto',padding:'1.5rem',fontFamily:'system-ui,sans-serif'}}>
      <h2 style={{fontSize:'20px',fontWeight:'700',color:'#185FA5',marginBottom:'1.5rem'}}>Cotizador de Lentes</h2>

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
        {necesitaTallado&&<div style={{marginTop:'8px',background:'#FAEEDA',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:'#633806'}}>⚠ Fórmula fuera de rango terminado — se usarán lentes tallados o digitales.</div>}
      </div>

      <div style={{marginBottom:'1.5rem'}}>
        <div style={{fontSize:'11px',fontWeight:'600',color:'#888',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'10px'}}>Tratamientos</div>
        <div style={{background:'#fff',border:'1px solid #eee',borderRadius:'12px',padding:'0 14px'}}>
          {tratRow('Fotosensible (Transitions Gen S)',transitions,v=>{setTransitions(v);if(v){setPolarizado(false);setBlue(false);}})}
          {tratRow('Polarizado',polarizado,v=>{setPolarizado(v);if(v){setTransitions(false);setBlue(false);}})}
          {tratRow('Filtro luz azul-violeta',blue,v=>{setBlue(v);if(v){setTransitions(false);setPolarizado(false);}})}
          <div style={{padding:'10px 0'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:arActivo?'12px':'0'}}>
              <span style={{fontSize:'13px',color:'#333'}}>Antirreflejo (AR)</span>
              <Toggle checked={arActivo} onChange={v=>{setArActivo(v);if(!v){setArOtros(false);setArOtrosVal(0);}}}/>
            </div>
            {arActivo&&<div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'8px'}}>
                {chip('AR Verde',!arOtros&&arColor==='verde',()=>{setArColor('verde');setArOtros(false);})}
                {chip('AR Azul',!arOtros&&arColor==='azul',()=>{setArColor('azul');setArOtros(false);})}
                {chip('Otros tipos',arOtros,()=>setArOtros(!arOtros))}
              </div>
              {arOtros&&<select value={arOtrosVal} onChange={e=>setArOtrosVal(parseInt(e.target.value))} style={{width:'100%',fontSize:'13px',padding:'7px',borderRadius:'8px',border:'1px solid #ccc',outline:'none',color:'#000'}}>
                <option value={0}>Seleccionar AR...</option>
                {AR_SERVI_OPTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>}
            </div>}
          </div>
        </div>
      </div>

      <button onClick={()=>{setMostrar(true);setGrupo(0);}} style={{width:'100%',background:'#185FA5',color:'white',border:'none',borderRadius:'10px',padding:'12px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
        Generar opciones para el paciente
      </button>

      {mostrar&&<div style={{marginTop:'2rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={{fontSize:'11px',fontWeight:'600',color:'#888',letterSpacing:'0.06em',textTransform:'uppercase'}}>{grupo===0?'Opciones principales':'Opciones premium'}</div>
          <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
            <span style={{fontSize:'11px',color:'#aaa'}}>{grupo+1} de 2</span>
            {grupo===1&&<button onClick={()=>setGrupo(0)} style={{fontSize:'12px',padding:'5px 12px',borderRadius:'8px',cursor:'pointer',background:'#f0f0f0',border:'none',color:'#333',fontWeight:'600'}}>Volver</button>}
            {grupo===0&&<button onClick={()=>setGrupo(1)} style={{fontSize:'12px',padding:'5px 12px',borderRadius:'8px',cursor:'pointer',background:'#185FA5',border:'none',color:'white',fontWeight:'600'}}>Ver opciones premium</button>}
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:'12px'}}>
          {grupos[grupo].map((op,i)=><OptionCard key={i} op={op} arKey={arKey}/>)}
        </div>
        {primerVez&&<div style={{marginTop:'12px',background:'#E6F1FB',borderRadius:'8px',padding:'10px 14px',fontSize:'12px',color:'#0C447C'}}>Aviso: paciente sin experiencia previa. Explicar período de adaptación, especialmente en progresivos.</div>}
        <div style={{marginTop:'10px',fontSize:'11px',color:'#aaa'}}>Precios por par. No incluyen montaje ni IVA.</div>
      </div>}
    </div>
  );
}