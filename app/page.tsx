'use client';

export const dynamic = 'force-static';
import {useEffect,useReducer,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,Check,Download,Headphones,Leaf,Lightbulb,Mic,Pause,RotateCcw,Volume2,X} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import {Checkbox} from '@/components/ui/checkbox';
import {lessonReducer,initialState,STEPS,TEXT,HINTS,WORDS} from '@/lib/lesson';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

function Bottle({stones,onClue}:{stones:number;onClue?:(id:string)=>void}){
 const y=240-stones*18;
 return <div className="bottle-wrap"><svg viewBox="0 0 300 350" role="img" aria-label={`瓶子剖面示意：已放${stones}颗石子，${stones===6?'水位已经升高':'水位还在瓶口下方'}`}>
 <defs><clipPath id="bottle-clip"><path d="M112 38H172V99Q172 113 208 140V305Q208 319 194 319H90Q76 319 76 305V140Q112 113 112 99Z"/></clipPath></defs>
 <path d="M112 38H172V99Q172 113 208 140V305Q208 319 194 319H90Q76 319 76 305V140Q112 113 112 99Z" fill="#fff" fillOpacity=".7" stroke="#456a7d" strokeWidth="4"/>
 <g clipPath="url(#bottle-clip)"><rect x="76" y={y} width="132" height={320-y} fill="#7fc8e3" className="water-fill"/><path d={`M76 ${y} Q110 ${y-5} 142 ${y} T208 ${y}`} fill="none" stroke="#3094b6" strokeWidth="3" className="water-line"/>
 {Array.from({length:stones},(_,i)=><ellipse key={i} cx={105+(i%2)*61} cy={301-Math.floor(i/2)*33} rx="27" ry="15" fill={i%2?'#778d99':'#98aab0'} stroke="#536d7e" strokeWidth="2"/>)}</g>
 <path d="M106 38H178" stroke="#456a7d" strokeWidth="7" strokeLinecap="round"/>
 <path d="M65 132H231" stroke="#29755f" strokeWidth="2" strokeDasharray="5 5"/><text x="218" y="124" fontSize="13" fill="#285c50">够得着</text>
 {stones>0&&<><path d="M61 240H222" stroke="#557e91" strokeDasharray="3 5"/><text x="218" y="258" fontSize="12" fill="#43657a">原来水位</text></>}
 </svg>{onClue&&<><button className="clue mouth" onClick={()=>onClue('mouth')}>看瓶口 <span>＋</span></button><button className="clue water" onClick={()=>onClue('water')}>看水 <span>＋</span></button></>}
 <span className="diagram-note">瓶子剖面示意</span></div>
}

export default function Home(){
 const [s,dispatch]=useReducer(lessonReducer,initialState);
 const [feedback,setFeedback]=useState('点点瓶口和水，找一找线索。');
 const [word,setWord]=useState<number|null>(null);
 const [reading,setReading]=useState(false);
 const [audioMessage,setAudioMessage]=useState('');
 const [story,setStory]=useState('');
 const [idea,setIdea]=useState('');
 const [create,setCreate]=useState(false);
 const [checks,setChecks]=useState<boolean[]>([false,false,false]);
 const [recording,setRecording]=useState(false);
 const [pendingMic,setPendingMic]=useState(false);
 const [recordUrl,setRecordUrl]=useState('');
 const [recordType,setRecordType]=useState('webm');
 const [recordMessage,setRecordMessage]=useState('');
 const [saved,setSaved]=useState(false);
 const rec=useRef<MediaRecorder|null>(null);
 const stream=useRef<MediaStream|null>(null);
 const timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
 const recordUrlRef=useRef('');
 const recordingAlive=useRef(true);
 const heading=useRef<HTMLHeadingElement>(null);
 const stepRef=useRef(s.step);stepRef.current=s.step;
 const stateRef=useRef(s);stateRef.current=s;
 const headingText=['小乌鸦，怎么啦？','让水渐渐升高','换你来讲故事','这是我的发现'][s.step];
 const read=(text:string)=>{
  if(!('speechSynthesis' in window)){setAudioMessage('这里暂时不能朗读，请和身边的大人一起读。');return;}
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=.78;
  const voice=window.speechSynthesis.getVoices().find(v=>/zh[-_]CN|cmn/i.test(v.lang));if(voice)u.voice=voice;
  u.onstart=()=>setReading(true);u.onend=()=>setReading(false);u.onerror=()=>{setReading(false);setAudioMessage('朗读没有播放出来，可以再试一次，或请大人读。');};
  setAudioMessage('');window.speechSynthesis.speak(u);
 };
 const stopReading=()=>{window.speechSynthesis?.cancel();setReading(false);};
 const stopRecord=()=>{if(timeout.current)clearTimeout(timeout.current);if(rec.current?.state==='recording')rec.current.stop();stream.current?.getTracks().forEach(t=>t.stop());setRecording(false);};
 useEffect(()=>{recordingAlive.current=true;return()=>{recordingAlive.current=false;window.speechSynthesis?.cancel();if(timeout.current)clearTimeout(timeout.current);stream.current?.getTracks().forEach(t=>t.stop());if(recordUrlRef.current)URL.revokeObjectURL(recordUrlRef.current);};},[]);
 const startRecord=async()=>{
  if(recording||pendingMic)return;
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){setRecordMessage('这个浏览器暂时不能录音。可以直接说给大人听，或者请大人记下来。');return;}
  setPendingMic(true);setRecordMessage('');
  try{
   const media=await navigator.mediaDevices.getUserMedia({audio:true});
   if(!recordingAlive.current||stepRef.current!==2){media.getTracks().forEach(t=>t.stop());return;}
   stream.current=media;
   const mime=['audio/webm','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
   const recorder=new MediaRecorder(media,mime?{mimeType:mime}:undefined);rec.current=recorder;
   const chunks:BlobPart[]=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   recorder.onstop=()=>{media.getTracks().forEach(t=>t.stop());if(!recordingAlive.current)return;setRecording(false);if(!chunks.length){setRecordMessage('没有录到声音，请再试一次。');return;}if(recordUrlRef.current)URL.revokeObjectURL(recordUrlRef.current);const url=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));recordUrlRef.current=url;setRecordUrl(url);setRecordType(recorder.mimeType.includes('mp4')?'m4a':'webm');setRecordMessage('录好了！听听自己的故事。');};
   recorder.onerror=()=>{stopRecord();setRecordMessage('录音中断了，可以再试一次，或说给大人听。');};
   recorder.start();setRecording(true);timeout.current=setTimeout(()=>{stopRecord();setRecordMessage('已录满两分钟，先听听这一段吧。');},120000);
  }catch{stream.current?.getTracks().forEach(t=>t.stop());setRecordMessage('没有打开麦克风。没关系，可以直接讲给大人听。');}finally{setPendingMic(false);}
 };
 const go=(type:'next'|'back')=>{stopReading();stopRecord();dispatch({type});setWord(null);setFeedback('');setAudioMessage('');setTimeout(()=>heading.current?.focus(),80);};
 const hint=()=>{const n=s.hints[s.step];const t=HINTS[s.step]?.[Math.min(n,1)];if(t){dispatch({type:'hint'});setFeedback(t);read(t);}};
 const clue=(id:string)=>{dispatch({type:'clue',id});const t=id==='mouth'?'瓶口又小，乌鸦的嘴伸不下去。':'瓶子里有水，可是水不多。';setFeedback(t);read(t);};
 const answer=(correct:boolean)=>{dispatch({type:s.step===0?'observe':'water',correct});const t=s.step===0?(correct?'你找到了原因！水不多，瓶口又小，乌鸦喝不着。':'再看看瓶子里的水和瓶口。你也可以点“帮帮我”。'):(correct?'是的！水没有变多，是水位渐渐升高了。':'想一想，我们刚才有没有往瓶子里加水？');setFeedback(t);read(t);};
 const nextAllowed=s.step===0?s.observed:s.step===1?s.waterUnderstood:s.step===2?true:false;
 const download=()=>{
  const content=['我的《乌鸦喝水》学习记录','日期：'+new Date().toLocaleDateString('zh-CN'),'','【我自己的讲述】',story||'没有文字记录；孩子可口头讲述或单独保存录音。','','【我自己的新办法】',idea||'本次没有填写。','','【我和大人一起回想】',...['我讲了放石子的办法','我讲了水位的变化','我讲了最后的结果'].map((t,i)=>`${checks[i]?'已勾选':'未勾选'}：${t}`),'','【本次过程】',`观察题作答 ${s.attempts[0]} 次；观察提示 ${s.hints[0]} 级。`,`水位题作答 ${s.attempts[1]} 次；实验提示 ${s.hints[1]} 级。`,`讲述提示 ${s.hints[2]} 级。`,'这些是操作与自我回顾记录，不是自动评分，也不证明掌握。','教材：2024秋一年级语文上册，第9课，第97—98页。'].join('\n');
  const url=URL.createObjectURL(new Blob(['\ufeff'+content],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='我的乌鸦喝水学习记录.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setSaved(true);
 };
 useEffect(()=>{
  type MC={registerTool:(t:unknown,o:{signal:AbortSignal})=>void|Promise<void>};
  const context=(document as Document&{modelContext?:MC}).modelContext;if(!context?.registerTool)return;
  const abort=new AbortController();
  const tool={name:'read_crow_lesson_progress',title:'读取乌鸦喝水学习进度',description:'只读当前学习环节和已操作的石子数量；不评价儿童掌握情况。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:(input:unknown)=>{if(typeof input!=='object'||input===null||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object');const current=stateRef.current;return {step:STEPS[current.step],stones:current.stones,observationAnswered:current.observed,waterQuestionAnswered:current.waterUnderstood};}};
  try{Promise.resolve(context.registerTool(tool,{signal:abort.signal})).catch(()=>{});}catch{}
  return()=>abort.abort();
 },[]);
 return <main className="book">
  <header className="topbar"><a href={`${basePath}/`} className="brand" aria-label="小小语文探险首页"><span className="brand-mark"><BookOpen size={23}/></span>小小语文探险</a><div className="top-right"><span className="edition">一年级 · 第9课</span><a href={`${basePath}/script.html`} target="_blank" rel="noreferrer" className="adult-link">给大人的脚本 ↗</a></div></header>
  <nav className="journey" aria-label="学习路线">{STEPS.map((t,i)=><div key={t} className={`journey-stop ${i===s.step?'current':''} ${i<s.step?'past':''}`} aria-current={i===s.step?'step':undefined}><span>{i<s.step?<Check size={17}/>:String(i+1).padStart(2,'0')}</span><b>{t}</b></div>)}</nav>
  <div className="title-row"><div><p className="eyebrow">乌鸦喝水 · {s.step===3?'带走你的故事':`第 ${s.step+1} 站`}</p><h1 ref={heading} tabIndex={-1}>{headingText}</h1></div><button className="listen-button" onClick={()=>reading?stopReading():read(s.step===0?TEXT[0]:s.step===1?TEXT[1]+TEXT[2]:s.step===2?'乌鸦是用什么办法喝着水的？试着自己讲一讲。':'这是你今天留下的故事。')} aria-label={reading?'停止朗读':'听一听'}>{reading?<Pause size={20}/>:<Volume2 size={20}/>}<span>{reading?'停一下':'听一听'}</span></button></div>
  {audioMessage&&<p className="notice" role="status">{audioMessage}</p>}
  {s.step<2?<div className="play-grid">
   <section className="scene-panel" aria-label="乌鸦与水瓶">
    <div className="scene-art"><img src={`${basePath}/crow.png`} alt="小乌鸦站在草地上，好奇地望向水瓶"/><span className="crow-speech">{s.step===0?'我好渴呀……':s.stones===6?'谢谢你，我够得着水啦！':'你想到了什么办法？'}</span><Bottle stones={s.step===0?0:s.stones} onClue={s.step===0?clue:undefined}/></div>
    <div className="scene-bottom">{s.step===0?<><span className="small-label">我的线索</span><div className="clue-list"><span className={s.clues.includes('water')?'discovered':''}>{s.clues.includes('water')?'✓ 水不多':'？水有什么特点'}</span><span className={s.clues.includes('mouth')?'discovered':''}>{s.clues.includes('mouth')?'✓ 瓶口又小':'？瓶口有什么特点'}</span></div></>:<><div className="stones-info"><span>已经放进 <b>{s.stones}</b> 颗小石子</span><button className="text-button" onClick={()=>{dispatch({type:'resetExperiment'});setFeedback('再慢慢放一次，看看水位怎样变化。');}}><RotateCcw size={15}/>再试一次</button></div><div className="stone-row">{Array.from({length:6},(_,i)=><button key={i} className={`stone ${i<s.stones?'used':''}`} disabled={i<s.stones||s.stones===6} aria-label={`放入第${s.stones+1}颗石子`} onClick={()=>{dispatch({type:'stone'});setFeedback(s.stones===5?'水位升高了！读读旁边的句子，再想想水有没有变多。':'放一颗，再放一颗。水正在一点一点升高。');}}>{i<s.stones?<Check size={21}/>:<span aria-hidden="true">●</span>}</button>)}</div><Progress value={s.stones/6*100} aria-label="放石子的进度" className="stone-progress"/></>}</div>
   <details className="full-text"><summary>读完整课文</summary>{TEXT.map(t=><p key={t}>{t}</p>)}<button className="text-button" onClick={()=>read(TEXT.join(''))}><Volume2 size={16}/>听完整课文</button></details>
   </section>
   <section className="reading-panel"><p className="small-label"><BookOpen size={17}/> 课文里这样说</p>{s.step===0?<p className="passage">一只乌鸦口渴了，<br/><button className="word" onClick={()=>{setWord(0);read('到处');}}>到处</button>找水喝。<br/>但是，瓶子里<span className="highlight">水不多</span>，<br/><span className="highlight">瓶口又小</span>，<br/>乌鸦喝不着水。</p>:<p className="passage">乌鸦把小石子<br/><button className="word" onClick={()=>{setWord(1);read('一颗一颗');}}>一颗一颗</button>地放进瓶子里。<br/>瓶子里的水<br/><button className="word" onClick={()=>{setWord(2);read('渐渐升高');}}>渐渐</button><span className="highlight">升高</span>，<br/>乌鸦就喝着水了。</p>}
   {word!==null&&<div className="word-note"><button className="close-note" aria-label="收起词语解释" onClick={()=>setWord(null)}><X size={17}/></button><ruby>{WORDS[word].word}<rt>{WORDS[word].pinyin}</rt></ruby><p>{WORDS[word].meaning}</p><p>{WORDS[word].prompt}</p><button className="text-button" onClick={()=>read(WORDS[word].meaning+WORDS[word].prompt)}><Volume2 size={16}/>听解释</button></div>}
   <div className="question-box"><h2>{s.step===0?'为什么喝不着水呢？':s.stones<6?'点小石子，一颗一颗放。':'水位升高了，水变多了吗？'}</h2>{s.step===0?<div className="answers"><button onClick={()=>answer(false)}>瓶子里没有水</button><button className={s.observed?'chosen':''} onClick={()=>answer(true)}>水不多，瓶口又小 {s.observed&&<Check size={18}/>}</button></div>:s.stones===6?<div className="answers"><button onClick={()=>answer(false)}>水变多了</button><button className={s.waterUnderstood?'chosen':''} onClick={()=>answer(true)}>水没变多，水位升高了 {s.waterUnderstood&&<Check size={18}/>}</button></div>:<p>看看水的位置，再读一读“渐渐升高”。</p>}</div>
   </section>
  </div>:s.step===2?<section className="tell-layout"><div className="tell-invitation"><span className="round-icon"><Mic size={34}/></span><h2>乌鸦是用什么办法<br/>喝着水的？</h2><p>现在没有答案卡啦。<br/>用自己的话，说给我听吧。</p><button className="secondary" onClick={hint}><Lightbulb size={18}/>{s.hints[2]===0?'给我一点提示':'听一个示范'}</button>{s.hints[2]>0&&<p className="hint-preview">{HINTS[2][s.hints[2]-1]}</p>}</div><div className="tell-work"><div className="record-controls"><button onClick={recording?stopRecord:startRecord} disabled={pendingMic} className={`primary ${recording?'recording':''}`}>{recording?<Pause size={20}/>:<Mic size={20}/>} {pendingMic?'正在打开麦克风…':recording?'讲好了，停止录音':recordUrl?'重新录一段':'录下我的故事'}</button><span className="small-label">也可以直接说给身边的大人听</span></div><p className="privacy-note">录音仅在本页临时保留，不上传。最长两分钟，离开前可下载。</p>{recordMessage&&<p role="status" className="notice">{recordMessage}</p>}{recordUrl&&<div className="audio-result"><audio controls src={recordUrl}/><a href={recordUrl} download={`我的乌鸦故事.${recordType}`}>保存录音 ↓</a></div>}<label className="field-label" htmlFor="story">我的话 <span>（选填，可以请大人代记）</span></label><textarea id="story" value={story} onChange={e=>setStory(e.target.value)} placeholder="把孩子原来的话记在这里……" maxLength={2000}/><p className="small-label">讲完后，一起回想。没有勾选也可以继续。</p><div className="self-checks">{['我说了乌鸦用的办法','我说了水的变化','我说了最后的结果'].map((t,i)=><label key={t}><Checkbox checked={checks[i]} onCheckedChange={v=>setChecks(c=>c.map((x,j)=>j===i?Boolean(v):x))}/><span>{t}</span></label>)}</div></div></section>:<section className="finish-layout"><div className="keepsake"><div className="keepsake-heading"><Leaf size={26}/><span>我的语文小作品 · 01</span></div><h2>我帮乌鸦喝到了水</h2><img src={`${basePath}/crow.png`} alt="站在草地上的小乌鸦" className="keepsake-image"/><div className="original-words"><span className="small-label">我自己的讲述</span><p>{story|| (recordUrl?'我的故事，藏在下面这段声音里。':'今天，我试着讲了乌鸦喝水的故事。')}</p>{!story&&!recordUrl&&<span className="small-label">本次没有保存文字或录音。</span>}</div>{recordUrl&&<div className="audio-result"><audio controls src={recordUrl}/><a href={recordUrl} download={`我的乌鸦故事.${recordType}`}>保存我的声音 ↓</a></div>}{idea.trim()&&<div className="original-words"><span className="small-label">我的新办法</span><p>{idea}</p><small>这是我的想法，还可以继续尝试。</small></div>}</div><div className="finish-side"><span className="round-icon"><Check size={32}/></span><h2>你留下了自己的故事。</h2><p>下次再讲给一个人听听吧。</p><button className="primary" onClick={download}><Download size={19}/>{saved?'再保存一份记录':'保存我的学习记录'}</button><p className="privacy-note">下载到自己的设备。声音需要单独保存。</p><div className="creation-box"><span className="small-label">还想玩一会儿？ · 自由选择</span><h3>如果没有小石子……</h3><p>你想用什么办法帮乌鸦？</p>{!create?<button className="secondary" onClick={()=>setCreate(true)}><Lightbulb size={18}/>我有一个新想法</button>:<><label className="field-label" htmlFor="idea">我想用……这样做……</label><textarea id="idea" value={idea} onChange={e=>{setIdea(e.target.value);setSaved(false);}} placeholder="说一说，请大人帮你记下来。" maxLength={1000}/><p className="notice">想法已经放进左边的作品卡。它能成功吗？可以和大人一起讨论；也可以画在纸上。</p></>}</div><details className="evidence"><summary>给大人：本次过程记录</summary><p>观察题：作答 {s.attempts[0]} 次，使用 {s.hints[0]} 级提示。<br/>水位题：作答 {s.attempts[1]} 次，使用 {s.hints[1]} 级提示。<br/>讲述：使用 {s.hints[2]} 级提示。</p><p>记录反映本次操作和自我回顾，不是自动评分，也不能单独证明掌握。</p></details></div></section>}
  {s.step<3&&<aside className="companion"><span className="companion-symbol"><Leaf size={24}/></span><div className="companion-copy"><b>小叶伙伴</b><p role="status" aria-live="polite">{feedback||(s.step===1?'先听读，再放石子。慢慢来，我陪着你。':s.step===2?'不着急，想一想再说。需要时，我会给你一点提示。':'看看水和瓶口，找到乌鸦遇到的难题。')}</p></div>{s.step<2&&<button className="help-button" onClick={hint}><Lightbulb size={19}/>{s.hints[s.step]===0?'帮帮我':s.hints[s.step]===1?'给我示范':'再听示范'}</button>}</aside>}
  <footer className="bottom-nav"><div>{s.step>0&&<button className="text-button" onClick={()=>go('back')}><ArrowLeft size={17}/>返回上一站</button>}{s.step===0&&<span className="small-label"><Headphones size={16}/> 可以听，也可以自己读</span>}</div>{s.step<3&&<button className="primary next" disabled={!nextAllowed||recording||pendingMic} onClick={()=>go('next')}>{s.step===0?'我们来想办法':s.step===1?'我来讲讲这个故事':'我讲好了，看看作品'}<ArrowRight size={20}/></button>}{s.step===3&&<span className="small-label">今天先到这里，也很好。</span>}</footer>
 </main>
}
