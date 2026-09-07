import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonReducer as reduce,initialState} from '../lib/lesson.ts';
const act=(s,...actions)=>actions.reduce(reduce,s);
const startExperiment=()=>act(initialState,{type:'observe',correct:true},{type:'next'});
test('不能跳过观察或在错误环节放石子',()=>{
 assert.equal(reduce(initialState,{type:'next'}).step,0);
 assert.equal(reduce(initialState,{type:'stone'}).stones,0);
 const wrong=reduce(initialState,{type:'observe',correct:false});
 assert.equal(wrong.attempts[0],1);assert.equal(wrong.observed,false);
 assert.equal(reduce(wrong,{type:'next'}).step,0);
});
test('水位题必须在六颗石子后回答，错误答案不解锁',()=>{
 let s=startExperiment();s=reduce(s,{type:'water',correct:true});assert.equal(s.waterUnderstood,false);
 for(let i=0;i<10;i++)s=reduce(s,{type:'stone'});
 assert.equal(s.stones,6);assert.equal(reduce(s,{type:'next'}).step,1);
 s=reduce(s,{type:'water',correct:false});assert.equal(s.waterUnderstood,false);
 s=reduce(s,{type:'water',correct:true});assert.equal(s.attempts[1],2);
 s=reduce(s,{type:'next'});assert.equal(s.step,2);
});
test('示范不会自动作答，反复求助和重玩不抹除过程',()=>{
 let s=startExperiment();for(let i=0;i<4;i++)s=reduce(s,{type:'hint'});
 assert.equal(s.hints[1],2);assert.equal(s.waterUnderstood,false);
 for(let i=0;i<6;i++)s=reduce(s,{type:'stone'});
 s=reduce(s,{type:'water',correct:true});s=reduce(s,{type:'resetExperiment'});
 assert.equal(s.stones,0);assert.equal(s.waterUnderstood,false);assert.equal(s.attempts[1],1);assert.equal(s.hints[1],2);
});
test('允许口头讲述结束，不强制录音或勾选，不越过终点',()=>{
 let s=startExperiment();for(let i=0;i<6;i++)s=reduce(s,{type:'stone'});
 s=act(s,{type:'water',correct:true},{type:'next'},{type:'next'});
 assert.equal(s.step,3);assert.equal(s.retellDone,true);assert.equal(reduce(s,{type:'next'}).step,3);
 assert.equal(reduce(s,{type:'back'}).step,2);assert.equal(reduce(initialState,{type:'back'}).step,0);
});
test('线索去重且拒绝无效线索，原状态不被修改',()=>{
 const s=act(initialState,{type:'clue',id:'water'},{type:'clue',id:'water'},{type:'clue',id:'not-a-clue'});
 assert.deepEqual(s.clues,['water']);assert.deepEqual(initialState.clues,[]);
});
