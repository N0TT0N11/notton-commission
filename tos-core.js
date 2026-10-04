import {normalize} from './rate-core.js?v=embed-20261005';
export function tosModel(site={}) {
 const fallback={version:4,title:'TOS',sections:[{id:'tos-main',name:'',blocks:[{id:'tos-text',kind:'text',text:(site.terms||[]).map(t=>[t.thTitle||t.enTitle,t.th||t.en].filter(Boolean).join('\n')).filter(Boolean).join('\n\n')}]}]};
 return normalize({priceRate:site.tosContent||fallback});
}
