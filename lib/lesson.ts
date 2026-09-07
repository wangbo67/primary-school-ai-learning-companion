export const STEPS = ['找线索', '试一试', '我来讲', '我的作品'];
export const TEXT = [
  '一只乌鸦口渴了，到处找水喝。乌鸦看见一个瓶子，瓶子里有水。但是，瓶子里水不多，瓶口又小，乌鸦喝不着水。怎么办呢？',
  '乌鸦看见旁边有许多小石子，想出办法来了。',
  '乌鸦把小石子一颗一颗地放进瓶子里。瓶子里的水渐渐升高，乌鸦就喝着水了。',
];
export const HINTS = [
 ['看看水离瓶口有多远，再看看瓶口。', '瓶子里有水，但水不多，瓶口又小，乌鸦够不着水。你也说一遍吧。'],
 ['我们放进去的是石子，还是水呢？', '水没有变多。石子占了地方，水位渐渐升高，乌鸦就够得着了。'],
 ['先说乌鸦用了什么办法，再说水有什么变化，最后怎么样。', '乌鸦把小石子一颗一颗地放进瓶子里，水渐渐升高，它就喝着水了。听完后，试着自己讲一遍。'],
];
export const WORDS = [
 {word:'到处',pinyin:'dào chù',meaning:'这里找找，那里找找。',prompt:'你找东西时，会到哪些地方找？'},
 {word:'一颗一颗',pinyin:'yì kē yì kē',meaning:'放一颗，再放一颗。',prompt:'跟着动作读：一颗，一颗。'},
 {word:'渐渐',pinyin:'jiàn jiàn',meaning:'一点一点地变化。',prompt:'试着说：天渐渐……'},
];
export type LessonState={step:number;clues:string[];observed:boolean;stones:number;waterUnderstood:boolean;hints:number[];attempts:number[];experimentDone:boolean;retellDone:boolean};
export const initialState:LessonState={step:0,clues:[],observed:false,stones:0,waterUnderstood:false,hints:[0,0,0],attempts:[0,0],experimentDone:false,retellDone:false};
export type Action={type:'clue';id:string}|{type:'observe';correct:boolean}|{type:'stone'}|{type:'water';correct:boolean}|{type:'hint'}|{type:'next'}|{type:'back'}|{type:'resetExperiment'};
export function lessonReducer(s:LessonState,a:Action):LessonState{
 switch(a.type){
 case 'clue': return s.step===0&&['water','mouth'].includes(a.id)?{...s,clues:[...new Set([...s.clues,a.id])]}:s;
 case 'observe':return s.step===0?{...s,observed:s.observed||a.correct,attempts:[s.attempts[0]+1,s.attempts[1]]}:s;
 case 'stone':return s.step===1?{...s,stones:Math.min(s.stones+1,6)}:s;
 case 'water':return s.step===1&&s.stones===6?{...s,waterUnderstood:s.waterUnderstood||a.correct,attempts:[s.attempts[0],s.attempts[1]+1]}:s;
 case 'hint':return s.step<3?{...s,hints:s.hints.map((n,i)=>i===s.step?Math.min(2,n+1):n)}:s;
 case 'next':
  if(s.step===0&&s.observed)return {...s,step:1};
  if(s.step===1&&s.waterUnderstood)return {...s,step:2,experimentDone:true};
  if(s.step===2)return {...s,step:3,retellDone:true};
  return s;
 case 'back':return {...s,step:Math.max(0,s.step-1)};
 case 'resetExperiment':return s.step===1?{...s,stones:0,waterUnderstood:false}:s;
 }
}
