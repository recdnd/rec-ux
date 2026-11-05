import json, os, html
R=os.path.expanduser('~/Documents/DungeonsRoot/rec-rec/home')
def L(f,a,b):
    t=open(os.path.join(R,f),encoding='utf-8').read().split('\n')
    return [(i,t[i-1]) for i in range(a,b+1)]
NPC='desks/NPC表.html'; BEN='dungeons/bench.js'
data={
 'A':{'file':'rec-rec/home/desks/NPC表.html','total':3992,'lines':L(NPC,2592,2632),'hi':[2611,2627]},
 'B':[
   {'key':'📑','name':'現状','file':'desks/NPC表.html','lines':L(NPC,2592,2613)},
   {'key':'🤖📓','name':'ルール','file':'desks/NPC表.html','lines':L(NPC,2533,2554)},
   {'key':'📋→🤖','name':'変更','file':'desks/NPC表.html','lines':L(NPC,3735,3756)},
 ],
 'C':{'file':'rec-rec/home/desks/NPC表.html','total':3992,'cols':[L(NPC,2533,2632),L(NPC,2633,2732),L(NPC,3735,3834)],'lens':[2611,2626]},
}
tpl=open(os.path.join(os.path.dirname(__file__),'slice_tpl.html'),encoding='utf-8').read()
out=os.path.join(os.path.dirname(os.path.abspath(__file__)),'代碼切片.html')
open(out,'w',encoding='utf-8').write(tpl.replace('/*DATA*/null',json.dumps(data,ensure_ascii=False)))
print(out)
