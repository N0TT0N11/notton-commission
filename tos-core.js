import {normalize} from './rate-core.js?v=20261004-test4';
export function tosModel(site={}) {
 const fallback={version:4,title:'TOS',sections:[{id:'tos-main',name:'',blocks:[{id:'tos-text',kind:'text',text:(site.terms||[]).map(t=>[t.thTitle||t.enTitle,t.th||t.en].filter(Boolean).join('\n')).filter(Boolean).join('\n\n')}]}]};
 return normalize({priceRate:site.tosContent||fallback});
}
