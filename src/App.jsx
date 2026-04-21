import { useState, useMemo } from "react";

const AR_PV={verde:70000,azul:130000,28200:70000,35200:130000,40900:130000,44100:130000,101200:340000,135900:340000};
const AR_COSTO={verde:40000,azul:50000,28200:28200,35200:35200,40900:40900,44100:44100,101200:101200,135900:135900};
const AR_SERVI_OPTS=[
  {label:'AR Estándar',value:28200},{label:'AR Supreme',value:35200},
  {label:'AR Clarity',value:40900},{label:'AR Clarity Blue',value:44100},
  {label:'AR Crizal Easy Pro UV',value:101200},{label:'AR Crizal Sapphire HR UV',value:135900},
];

function pvS(c){return c<50000?Math.round(c*6):Math.round(c*4);}
function pvA(c){return c<100000?Math.round(c*5):Math.round(c*3.5);}
function fmt(n){return '$'+Math.round(n).toLocaleString('es-CO');}
function r2(v){return Math.round(v*4)/4;}

function getArKey(activo,color,otros,otrosVal){
  if(!activo) return null;
  if(otros) return otrosVal>0?otrosVal:null;
  return color;
}

function StepInput({value,onChange,min,max,step,label}){
  const [editing,setEditing]=useState(false);
  const [raw,setRaw]=useState('');
  function clamp(v){return Math.min(max,Math.max(min,r2(v)));}
  function display(){return(value>0?'+':'')+value.toFixed(2);}
  function onFocus(e){setEditing(true);setRaw('');setTimeout(()=>e.target.select(),0);}
  function onBlur(){
    setEditing(false);
    const n=parseFloat(raw);
    onChange(raw===''||raw==='-'||raw==='+'?0:(!isNaN(n)?clamp(n):value));
    setRaw('');
  }
  function onKeyDown(e){
    if(e.key==='ArrowUp'){e.preventDefault();onChange(clamp(value+step));}
    if(e.key==='ArrowDown'){e.preventDefault();onChange(clamp(value-step));}
    if(e.key==='Enter'){e.target.blur();}
  }
  return (
    <div>
      {label&&<div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>{label}</div>}
      <input type="text" value={editing?raw:display()}
        onChange={e=>{if(editing)setRaw(e.target.value);}}
        onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown}
        style={{width:'100%',boxSizing:'border-box',textAlign:'center',fontSize:'13px',
          padding:'7px 4px',borderRadius:'8px',border:'1px solid #ddd',
          background:'#fff',color:'#222',outline:'none'}}
      />
    </div>
  );
}

function AddInput({value,onChange}){
  const [editing,setEditing]=useState(false);
  const [raw,setRaw]=useState('');
  function clamp(v){return Math.min(3,Math.max(0,r2(v)));}
  function onFocus(e){setEditing(true);setRaw('');setTimeout(()=>e.target.select(),0);}
  function onBlur(){
    setEditing(false);
    const n=parseFloat(raw);
    onChange(raw===''||raw==='0'||raw==='N/A'?0:(!isNaN(n)?clamp(n):value));
    setRaw('');
  }
  function onKeyDown(e){
    if(e.key==='ArrowUp'){e.preventDefault();onChange(clamp(value+0.25));}
    if(e.key==='ArrowDown'){e.preventDefault();onChange(clamp(value-0.25));}
    if(e.key==='Enter'){e.target.blur();}
  }
  return (
    <div>
      <div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>Adición</div>
      <input type="text" value={editing?raw:(value===0?'N/A':'+'+value.toFixed(2))}
        onChange={e=>{if(editing)setRaw(e.target.value);}}
        onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown}
        style={{width:'100%',boxSizing:'border-box',textAlign:'center',fontSize:'13px',
          padding:'7px 4px',borderRadius:'8px',border:'1px solid #ddd',
          background:'#fff',color:'#222',outline:'none'}}
      />
    </div>
  );
}

function EyeFields({label,state,setState}){
  return (
    <div style={{background:'#f8f9fa',borderRadius:'12px',padding:'12px',border:'1px solid #eee'}}>
      <p style={{fontSize:'13px',fontWeight:'600',margin:'0 0 10px',color:'#222'}}>{label}</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'8px'}}>
        <StepInput label="Esfera" value={state.esf} onChange={v=>setState({...state,esf:v})} min={-20} max={20} step={0.25}/>
        <StepInput label="Cilindro" value={state.cil} onChange={v=>setState({...state,cil:v})} min={-6} max={0} step={0.25}/>
        <div>
          <div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>Eje °</div>
          <input type="number" min={1} max={180} value={state.eje||''}
            onChange={e=>setState({...state,eje:e.target.value})}
            style={{width:'100%',boxSizing:'border-box',textAlign:'center',fontSize:'13px',
              padding:'7px 4px',borderRadius:'8px',border:'1px solid #ddd',background:'#fff',outline:'none'}}
          />
        </div>
        <AddInput value={state.add} onChange={v=>setState({...state,add:v})}/>
      </div>
    </div>
  );
}

function Toggle({checked,onChange}){
  return (
    <div onClick={()=>onChange(!checked)}
      style={{width:'36px',height:'20px',borderRadius:'10px',
        background:checked?'#185FA5':'#ccc',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}>
      <div style={{position:'absolute',top:'3px',left:checked?'19px':'3px',
        width:'14px',height:'14px',borderRadius:'50%',background:'white',
        transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.3)'}}/>
    </div>
  );
}

const tierPalette={
  'Económica':{bg:'#f0f0f0',txt:'#555'},
  'Estándar':{bg:'#E6F1FB',txt:'#0C447C'},
  'Premium':{bg:'#EAF3DE',txt:'#27500A'},
  'Avanzada':{bg:'#EEEDFE',txt:'#3C3489'},
  'Superior':{bg:'#FAEEDA',txt:'#633806'},
  'Top':{bg:'#E1F5EE',txt:'#085041'},
};

function OptionCard({op,arKey}){
  const tc=tierPalette[op.tier]||tierPalette['Estándar'];
  const aplicaAR=op.tallado&&!op.arIncluido&&arKey!==null;
  const arCosto=aplicaAR?(AR_COSTO[arKey]||0):0;
  const arPv=aplicaAR?(AR_PV[arKey]||0):0;
  const costoTotal=op.costoBase+arCosto;
  const pvTotal=op.pvBase+arPv;
  return (
    <div style={{background:'#fff',border:op.rec?'2px solid #185FA5':'1px solid #eee',
      borderRadius:'14px',padding:'14px',display:'flex',flexDirection:'column',gap:'7px',
      boxShadow:op.rec?'0 2px 12px rgba(24,95,165,0.12)':'none'}}>
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
        {op.arIncluido&&<div style={{fontSize:'11px',color:'#27500A',padding:'2px 0',display:'flex',gap:'5px',marginTop:'2px'}}>
          <span style={{color:'#27500A',fontWeight:'700'}}>·</span>AR incluido en el lente
        </div>}
        {aplicaAR&&arCosto>0&&<div style={{fontSize:'11px',color:'#0C447C',padding:'2px 0',display:'flex',gap:'5px',marginTop:'2px'}}>
          <span style={{color:'#0C447C',fontWeight:'700'}}>·</span>+ AR adicional incluido
        </div>}
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

function buildOps(esProg,maxEsf,maxCil,transitions,polarizado,esExterior,esOficina,blue,esEst,esNino){
  const freeTermOk=maxEsf<=4&&maxCil<=2;
  const necesitaTallado=maxEsf>4||maxCil>2;
  const usaThinLite=necesitaTallado;

  if(esNino){
    if(esProg){
      return [[
        {tier:'Económica',rec:false,tallado:true,arIncluido:false,freelens:true,nombre:'Progresivo Digital Profesional Free 1.56',desc:'Progresivo digital pediátrico de entrada. Apto para fórmulas con astigmatismo.',costoBase:100000,pvBase:100000*4,features:['Progresivo digital','Apto para astigmatismo']},
        {tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,nombre:'* Shamir Cool (Progresivo Pediátrico) ***Poly',desc:'Progresivo diseñado especialmente para niños. Adaptación rápida.',costoBase:94900,pvBase:pvS(94900),features:['Diseño pediátrico especializado','Adaptación rápida en niños','Mayor zona de visión de lejos']},
        {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,nombre:'* Shamir Cool ***Poly 1.56 *Blue',desc:'Progresivo pediátrico con filtro de luz azul integrado.',costoBase:110200,pvBase:pvS(110200),features:['Diseño pediátrico','Filtro luz azul-violeta','Protección UV completa']},
      ],[
        {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,freelens:false,nombre:'* Eyezen Start/FIT ***Airwear *Blue UV',desc:'Lente digital para niños con uso intensivo de pantallas.',costoBase:114000,pvBase:pvS(114000),features:['Filtro luz azul-violeta','Material Airwear','Soporte visual digital']},
        {tier:'Superior',rec:true,tallado:true,arIncluido:true,freelens:false,nombre:'* Eyezen Start/FIT ***Airwear *Blue UV +Crizal Easy Pro',desc:'Máxima protección digital para niños. AR Crizal Easy Pro incluido.',costoBase:180700,pvBase:pvS(180700),features:['AR Crizal Easy Pro incluido','Filtro luz azul-violeta','Airwear resistente']},
        {tier:'Top',rec:false,tallado:true,arIncluido:true,freelens:false,nombre:'* Stellest ***Airwear +Crizal Rock',desc:'Control de progresión de miopía en niños.',costoBase:216600,pvBase:pvS(216600),features:['Control progresión miopía','AR Crizal Rock incluido','Tecnología Stellest']},
      ]];
    }
    const eco=freeTermOk
      ?{costoBase:11000,pvBase:66000,tallado:false,arIncluido:false,freelens:true,nombre:'Poly Blanco terminado',desc:'Lente claro Poly para niños con fórmulas básicas.',features:['Material Poly resistente','Liviano y seguro']}
      :{costoBase:89000,pvBase:89000*4,tallado:true,arIncluido:false,freelens:true,nombre:'Poly Digital Monofocal Single',desc:'Lente digital para niños con astigmatismo.',features:['Digital personalizado','Apto para astigmatismo']};
    return [[
      {...eco,tier:'Económica',rec:false},
      {tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,nombre:'Blue Cut Poly (Aliens PerfectionHD)',desc:'Filtro azul en Poly para uso escolar y pantallas.',costoBase:135000,pvBase:pvA(135000),features:['Filtro luz azul','Material Poly','Diseño pediátrico recomendado']},
      {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,nombre:'* Eyezen Start/FIT ***Airwear *Blue UV',desc:'Diseñado para niños con uso digital intensivo.',costoBase:114000,pvBase:pvS(114000),features:['Filtro luz azul-violeta','Material Airwear','Protección UV 100%']},
    ],[
      {tier:'Avanzada',rec:false,tallado:true,arIncluido:true,freelens:false,nombre:'* Eyezen Start/FIT ***Airwear +Crizal Easy Pro',desc:'Eyezen con AR Crizal Easy Pro para niños.',costoBase:180700,pvBase:pvS(180700),features:['AR Crizal Easy Pro incluido','Filtro luz azul-violeta']},
      {tier:'Superior',rec:true,tallado:true,arIncluido:true,freelens:false,nombre:'* Stellest ***Airwear +Crizal Rock',desc:'Control de miopía. La opción más avanzada para niños.',costoBase:216600,pvBase:pvS(216600),features:['Control progresión miopía','Tecnología Stellest','AR Crizal Rock incluido']},
      {tier:'Top',rec:false,tallado:true,arIncluido:false,freelens:false,nombre:'Myofix Kids (Aliens)',desc:'Control de miopía pediátrico. Hasta 12 años.',costoBase:350000,pvBase:pvA(350000),features:['Control miopía pediátrico','Diseño Myofix','Uso terapéutico 2h/día mínimo']},
    ]];
  }

  if(esProg){
    const usaTerm=freeTermOk&&maxCil===0&&maxEsf<=3;
    const ecoBase=usaTerm
      ?{costoBase:25000,pvBase:120000,tallado:false,arIncluido:false,freelens:true,nombre:'CR Progresivo terminado',desc:'Progresivo terminado para fórmulas esféricas bajas.',features:['Solo esfera sin cilindro','Adición +1.00 a +3.00']}
      :{costoBase:100000,pvBase:100000*4,tallado:true,arIncluido:false,freelens:true,nombre:'Progresivo Digital Profesional Free 1.56',desc:'Progresivo digital apto para astigmatismo.',features:['Digital 1.56','Apto para astigmatismo']};
    if(transitions||esExterior){
      return [[
        {...ecoBase,tier:'Económica',rec:false},
        {tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,nombre:'Gen•S CR Progresivo (Aliens PrecisaHDV)',desc:'Progresivo fotosensible Transitions Gen S en CR. Gama media.',costoBase:340000,pvBase:pvA(340000),features:['Transitions Gen S','Progresivo PrecisaHDV','Adición 0.50 a 3.50']},
        {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,nombre:'***Poly *Transitions GEN S Gris',desc:'Transitions Gen S en Poly. La más reconocida en fotosensibles.',costoBase:120500,pvBase:pvS(120500),features:['Transitions generación S','Material Poly','Bloqueo UV 100%']},
      ],[
        {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,freelens:false,nombre:'Gen•S Poly Progresivo (Aliens AilensHDC)',desc:'Progresivo Transitions Gen S Poly en diseño premium Aliens.',costoBase:590000,pvBase:pvA(590000),features:['Transitions Gen S Poly','Diseño AilensHDC','Adición 0.75 a 3.75']},
        {tier:'Superior',rec:true,tallado:true,arIncluido:true,freelens:false,nombre:'***Airwear *Transitions GEN S + Crizal Sapphire HR UV',desc:'Transitions en Airwear con AR Crizal Sapphire HR incluido.',costoBase:164500,pvBase:pvS(164500),features:['Material Airwear','Transitions Gen S','AR Crizal Sapphire HR incluido']},
        {tier:'Top',rec:false,tallado:true,arIncluido:true,freelens:false,nombre:'* Varilux Physio Extensee/FIT ***Airwear',desc:'El más avanzado de Varilux. AR Crizal Sapphire HR incluido.',costoBase:430700,pvBase:pvS(430700),features:['Airwear liviano','AR Crizal Sapphire HR incluido','Visión nítida todas las distancias']},
      ]];
    }
    return [[
      {...ecoBase,tier:'Económica',rec:false},
      {tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,nombre:'Progresivo Poly Natural NA (Aliens)',desc:'Progresivo digital de gama media en Poly Aliens.',costoBase:80000,pvBase:pvA(80000),features:['Progresivo digital Poly','Adición 0.50 a 2.75','Buena amplitud visual']},
      {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,nombre:'* Ovation DS/FIT ***Airwear',desc:'Progresivo Essilor de entrada en Airwear.',costoBase:136900,pvBase:pvS(136900),features:['Material Airwear','Progresivo Essilor','Incluye bisel']},
    ],[
      {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,freelens:false,nombre:'* Varilux Comfort Max/FIT ***Airwear',desc:'Varilux Comfort Max. Visión estable en todas las distancias.',costoBase:273500,pvBase:pvS(273500),features:['Varilux Comfort Max','Material Airwear','Visión estable y nítida']},
      {tier:'Superior',rec:true,tallado:true,arIncluido:true,freelens:false,nombre:'* Varilux Physio Extensee/FIT ***Airwear',desc:'El más avanzado de Varilux. AR Crizal Sapphire HR incluido.',costoBase:430700,pvBase:pvS(430700),features:['Airwear liviano','AR Crizal Sapphire HR incluido','Visión nítida todas las distancias']},
      {tier:'Top',rec:false,tallado:true,arIncluido:true,freelens:false,nombre:'* Shamir Autograph III D ***Poly',desc:'Progresivo freeform Shamir. AR Crizal Sapphire o Prevencia incluido.',costoBase:375800,pvBase:pvS(375800),features:['Freeform personalizado','AR Crizal Sapphire incluido','Sin restricción de montura']},
    ]];
  }

  if(transitions||polarizado||esExterior){
    const usaTerm=freeTermOk;
    const ecoFoto=usaTerm
      ?{costoBase:30000,pvBase:160000,tallado:false,arIncluido:true,freelens:true,nombre:'CR Foto AR Verde terminado',desc:'Fotosensible terminado con AR incluido.',features:['Fotosensible básico','AR verde incluido','Esfera +/-4.00']}
      :{costoBase:99000,pvBase:99000*4,tallado:true,arIncluido:false,freelens:true,nombre:'CR Foto Free digital',desc:'Fotosensible digital para astigmatismo.',features:['Fotosensible digital','Apto para astigmatismo']};
    return [[
      {...ecoFoto,tier:'Económica',rec:false},
      {tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,nombre:'Blue Cut Photo Poly (Aliens)',desc:'Fotosensible con filtro azul en Poly. Gama media Aliens.',costoBase:125000,pvBase:pvA(125000),features:['Fotosensible + filtro azul','Material Poly','Protección UV completa']},
      {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,nombre:'***Poly *Transitions GEN S Gris',desc:'Transitions Gen S. La tecnología fotosensible más reconocida.',costoBase:120500,pvBase:pvS(120500),features:['Transitions generación S','Bloqueo UV 100%','Decoloración rápida']},
    ],[
      {tier:'Avanzada',rec:false,tallado:true,arIncluido:true,freelens:false,nombre:'***Airwear *Transitions GEN S Gris + Crizal Sapphire HR UV',desc:'Transitions en Airwear con AR Crizal Sapphire HR incluido.',costoBase:164500,pvBase:pvS(164500),features:['Material Airwear liviano','Transitions Gen S']},
      {tier:'Superior',rec:true,tallado:true,arIncluido:false,freelens:false,nombre:'***Poly *Transitions Xtractive NG Gris',desc:'Se activa dentro del vehículo. Mayor oscurecimiento.',costoBase:139600,pvBase:pvS(139600),features:['Funciona dentro del auto','Mayor % oscurecimiento','Bloqueo UV y luz azul']},
      {tier:'Top',rec:false,tallado:true,arIncluido:false,freelens:false,nombre:'***Poly *Transitions Xtractive Polarized Gris',desc:'Oscurece en el auto y elimina reflejos polarizados.',costoBase:180700,pvBase:pvS(180700),features:['Efecto polarizado activo','Dentro y fuera del vehículo','Máxima protección solar']},
    ]];
  }

  if(blue){
    const usaTerm=freeTermOk;
    const ecoBlue=usaTerm
      ?{costoBase:15000,pvBase:90000,tallado:false,arIncluido:true,freelens:true,nombre:'CR Blue Block AR Verde terminado',desc:'Filtro azul terminado con AR incluido.',features:['Filtro luz azul','AR verde incluido','Esfera +/-4.00']}
      :{costoBase:95000,pvBase:95000*4,tallado:true,arIncluido:false,freelens:true,nombre:'Poly Blue Block digital',desc:'Filtro azul digital para astigmatismo.',features:['Filtro azul digital','Apto para astigmatismo']};
    return [[
      {...ecoBlue,tier:'Económica',rec:false},
      {tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,nombre:'Blue Cut Poly (Aliens PerfectionHD)',desc:'Lente con filtro azul en Poly. Gama media Aliens para uso digital.',costoBase:135000,pvBase:pvA(135000),features:['Filtro luz azul','Material Poly','Diseño PerfectionHD']},
      {tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,nombre:'* Eyezen Start/FIT ***Airwear *Blue UV',desc:'Diseñado para uso digital. Filtra luz azul-violeta en Airwear.',costoBase:114000,pvBase:pvS(114000),features:['Filtro luz azul-violeta','Material Airwear','Protección UV 100%']},
    ],[
      {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,freelens:false,nombre:'* Eyezen Boost/FIT ***Airwear *Blue UV',desc:'Eyezen con soporte adicional para menor fatiga.',costoBase:114000,pvBase:pvS(114000),features:['Soporte +0.40/0.60/0.85','Filtro luz azul-violeta','Airwear']},
      {tier:'Superior',rec:true,tallado:true,arIncluido:true,freelens:false,nombre:'* Eyezen Start/FIT ***Airwear +Crizal Easy Pro',desc:'Eyezen con AR Crizal Easy Pro incluido.',costoBase:180700,pvBase:pvS(180700),features:['AR Crizal Easy Pro incluido','Filtro luz azul-violeta']},
      {tier:'Top',rec:false,tallado:true,arIncluido:true,freelens:false,nombre:'* Stellest ***Airwear +Crizal Rock',desc:'Control de miopía con AR Crizal Rock incluido.',costoBase:216600,pvBase:pvS(216600),features:['Control progresión miopía','AR Crizal Rock incluido']},
    ]];
  }

  // Claros
  const usaTerm=freeTermOk;
  const eco=usaTerm
    ?{costoBase:11000,pvBase:66000,tallado:false,arIncluido:false,freelens:true,nombre:'Poly Blanco terminado',desc:'Lente claro Poly terminado para fórmulas básicas.',features:['Material Poly','Esfera +/-4.00 sin cilindro']}
    :{costoBase:89000,pvBase:89000*4,tallado:true,arIncluido:false,freelens:true,nombre:'Poly Digital Monofocal Single',desc:'Lente claro digital en Poly.',features:['Digital personalizado','Apto para astigmatismo']};
  const premiumClaro=usaThinLite
    ?{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,nombre:'* Thin & Lite 1.67 Tallado',desc:'Material alto índice 1.67 para fórmulas muy altas. El más delgado.',costoBase:149900,pvBase:pvS(149900),features:['Índice 1.67 ultrafino','Para esfera/cilindro altos','Máxima estética']}
    :{tier:'Premium',rec:false,tallado:true,arIncluido:false,freelens:false,nombre:'*** Trivex Esférico Tallado',desc:'Material premium más liviano y resistente que el Poly.',costoBase:63500,pvBase:pvS(63500),features:['Material Trivex premium','Más liviano que Poly','Garantía 1 año']};
  return [[
    {...eco,tier:'Económica',rec:false},
    {tier:'Estándar',rec:true,tallado:true,arIncluido:false,freelens:false,nombre:'Poly (Aliens PerfectionHD)',desc:'Lente claro Poly digital de gama media Aliens.',costoBase:100000,pvBase:pvA(100000),features:['Diseño digital PerfectionHD','Material Poly','Amplitud visual óptima']},
    premiumClaro,
  ],[
    {tier:'Avanzada',rec:false,tallado:true,arIncluido:false,freelens:false,nombre:'* 1.56 *Blue Tallado',desc:'Índice 1.56 con filtro de luz azul integrado.',costoBase:51000,pvBase:pvS(51000),features:['Índice 1.56','Filtro luz azul-violeta','UV 100%']},
    {tier:'Superior',rec:true,tallado:true,arIncluido:false,freelens:false,nombre:'* 1.60 *Blue UV Tallado',desc:'Alto índice 1.60 con filtro azul. Más delgado para fórmulas altas.',costoBase:104500,pvBase:pvS(104500),features:['Índice 1.60 ultrafino','Filtro luz azul-violeta','Ideal monturas delgadas']},
    {tier:'Top',rec:false,tallado:true,arIncluido:false,freelens:false,nombre:'* Poly Esférico — Asférico Tallado',desc:'Diseño asférico para mayor nitidez y lente más delgado.',costoBase:36400,pvBase:pvS(36400),features:['Diseño asférico','Más delgado que esférico','Rango +13.00 a -16.00']},
  ]];
}

export default function App(){
  const [od,setOd]=useState({esf:0,cil:0,eje:'',add:0});
  const [oi,setOi]=useState({esf:0,cil:0,eje:'',add:0});
  const [edad,setEdad]=useState('');
  const [prof,setProf]=useState('');
  const [primerVez,setPrimerVez]=useState(false);
  const [transitions,setTransitions]=useState(false);
  const [polarizado,setPolarizado]=useState(false);
  const [blue,setBlue]=useState(false);
  const [arActivo,setArActivo]=useState(false);
  const [arColor,setArColor]=useState('verde');
  const [arOtros,setArOtros]=useState(false);
  const [arOtrosVal,setArOtrosVal]=useState(0);
  const [mostrar,setMostrar]=useState(false);
  const [grupo,setGrupo]=useState(0);

  const tieneAdd=od.add>0||oi.add>0;
  const esProg=tieneAdd;
  const maxEsf=Math.max(Math.abs(od.esf),Math.abs(oi.esf));
  const maxCil=Math.max(Math.abs(od.cil),Math.abs(oi.cil));
  const edadN=parseInt(edad)||0;
  const esNino=edadN>0&&edadN<14;
  const esOficina=prof==='oficina';
  const esExterior=prof==='exterior'||prof==='conductor';
  const esEst=prof==='estudiante';
  const necesitaTallado=maxEsf>4||maxCil>2;
  const arKey=getArKey(arActivo,arColor,arOtros,arOtrosVal);

  const grupos=useMemo(()=>buildOps(esProg,maxEsf,maxCil,transitions,polarizado,esExterior,esOficina,blue,esEst,esNino),
    [esProg,maxEsf,maxCil,transitions,polarizado,esExterior,esOficina,blue,esEst,esNino]);

  const chip=(label,active,onClick)=>(
    <button onClick={onClick} style={{padding:'5px 12px',borderRadius:'20px',border:'none',cursor:'pointer',
      fontSize:'12px',fontWeight:'600',background:active?'#185FA5':'#f0f0f0',
      color:active?'white':'#555',transition:'all 0.15s'}}>{label}</button>
  );

  const tratRow=(label,val,fn)=>(
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #eee'}}>
      <span style={{fontSize:'13px',color:'#333'}}>{label}</span>
      <Toggle checked={val} onChange={fn}/>
    </div>
  );

  return (
    <div style={{maxWidth:'900px',margin:'0 auto',padding:'1.5rem',fontFamily:'system-ui,sans-serif'}}>
      <h2 style={{fontSize:'20px',fontWeight:'700',color:'#185FA5',marginBottom:'1.5rem'}}>Cotizador de Lentes</h2>

      {/* Datos */}
      <div style={{marginBottom:'1.5rem'}}>
        <div style={{fontSize:'11px',fontWeight:'600',color:'#888',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'10px'}}>Datos del paciente</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
          <div>
            <div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>Edad</div>
            <input type="number" min={1} max={100} placeholder="Ej: 45" value={edad}
              onChange={e=>setEdad(e.target.value)}
              style={{width:'100%',boxSizing:'border-box',padding:'7px 10px',borderRadius:'8px',border:'1px solid #ddd',fontSize:'13px',outline:'none'}}/>
          </div>
          <div>
            <div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>Profesión</div>
            <select value={prof} onChange={e=>setProf(e.target.value)}
              style={{width:'100%',padding:'7px 10px',borderRadius:'8px',border:'1px solid #ddd',fontSize:'13px',outline:'none'}}>
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
        {esNino&&<div style={{marginTop:'8px',background:'#E6F1FB',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:'#0C447C'}}>
          👶 Paciente menor de 14 años — productos pediátricos activados.
        </div>}
      </div>

      {/* Fórmula */}
      <div style={{marginBottom:'1.5rem'}}>
        <div style={{fontSize:'11px',fontWeight:'600',color:'#888',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'10px'}}>Fórmula óptica</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <EyeFields label="Ojo derecho (OD)" state={od} setState={setOd}/>
          <EyeFields label="Ojo izquierdo (OI)" state={oi} setState={setOi}/>
        </div>
        {necesitaTallado&&<div style={{marginTop:'8px',background:'#FAEEDA',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:'#633806'}}>
          ⚠ Fórmula fuera de rango terminado — se usarán lentes tallados o digitales.
        </div>}
      </div>

      {/* Tratamientos */}
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
              {arOtros&&<select value={arOtrosVal} onChange={e=>setArOtrosVal(parseInt(e.target.value))}
                style={{width:'100%',fontSize:'13px',padding:'7px',borderRadius:'8px',border:'1px solid #ddd',outline:'none'}}>
                <option value={0}>Seleccionar AR...</option>
                {AR_SERVI_OPTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>}
            </div>}
          </div>
        </div>
      </div>

      <button onClick={()=>{setMostrar(true);setGrupo(0);}}
        style={{width:'100%',background:'#185FA5',color:'white',border:'none',borderRadius:'10px',
          padding:'12px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
        Generar opciones para el paciente
      </button>

      {mostrar&&<div style={{marginTop:'2rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={{fontSize:'11px',fontWeight:'600',color:'#888',letterSpacing:'0.06em',textTransform:'uppercase'}}>
            {grupo===0?'Opciones principales':'Opciones premium'}
          </div>
          <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
            <span style={{fontSize:'11px',color:'#aaa'}}>{grupo+1} de 2</span>
            {grupo===1&&<button onClick={()=>setGrupo(0)}
              style={{fontSize:'12px',padding:'5px 12px',borderRadius:'8px',cursor:'pointer',
                background:'#f0f0f0',border:'none',color:'#333',fontWeight:'600'}}>Volver</button>}
            {grupo===0&&<button onClick={()=>setGrupo(1)}
              style={{fontSize:'12px',padding:'5px 12px',borderRadius:'8px',cursor:'pointer',
                background:'#185FA5',border:'none',color:'white',fontWeight:'600'}}>Ver opciones premium</button>}
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:'12px'}}>
          {grupos[grupo].map((op,i)=><OptionCard key={i} op={op} arKey={arKey}/>)}
        </div>
        {primerVez&&<div style={{marginTop:'12px',background:'#E6F1FB',borderRadius:'8px',padding:'10px 14px',fontSize:'12px',color:'#0C447C'}}>
          Aviso: paciente sin experiencia previa. Explicar período de adaptación, especialmente en progresivos.
        </div>}
        <div style={{marginTop:'10px',fontSize:'11px',color:'#aaa'}}>Precios por par. No incluyen montaje ni IVA.</div>
      </div>}
    </div>
  );
}