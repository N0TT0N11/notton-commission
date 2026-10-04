// Convert pasted public links or iframe snippets without executing supplied HTML.
export function resolveEmbed(input, mode='embed') {
  let raw=String(input||'').trim();
  if(!raw)return {kind:'empty',message:'Paste a link or iframe embed code'};
  if(raw.startsWith('<')) {
    const match=raw.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
    if(!match)return {kind:'invalid',message:'Use a URL or iframe embed code'};
    raw=match[1].replace(/&amp;/g,'&');
  }
  let url;try{url=new URL(raw);}catch{return {kind:'invalid',message:'Enter a complete https:// URL'};}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password)return {kind:'invalid',message:'Only public HTTP or HTTPS links are supported'};
  const source=url.href, host=url.hostname.toLowerCase().replace(/^www\./,'');
  const result=(kind,src=source,provider=host)=>({kind,src,source,provider});
  if(mode==='bookmark')return result('bookmark');
  if(/\.(gif|png|jpe?g|webp|avif|svg|apng)$/i.test(url.pathname))return result('image');
  if(/\.(mp4|webm|mov)$/i.test(url.pathname))return result('video');
  if(/\.(mp3|wav|ogg|m4a)$/i.test(url.pathname))return result('audio');
  if(host==='youtu.be'||['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(host)){
    const id=host==='youtu.be'?url.pathname.split('/')[1]:url.searchParams.get('v')||url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
    if(!/^[\w-]{11}$/.test(id||''))return {...result('bookmark'),message:'Use a link to a YouTube video'};
    return result('iframe','https://www.youtube-nocookie.com/embed/'+id,'YouTube');
  }
  if(host==='vimeo.com'||host==='player.vimeo.com'){
    const id=url.pathname.match(/\/(\d+)(?:\/|$)/)?.[1];if(id)return result('iframe','https://player.vimeo.com/video/'+id,'Vimeo');
  }
  if(host==='facebook.com'||host==='m.facebook.com'){
    if(url.pathname.startsWith('/plugins/'))return result('iframe',source,'Facebook');
    if(/^\/share\//.test(url.pathname))return {...result('bookmark',source,'Facebook'),message:'Facebook share links cannot be reliably embedded. Paste the original public post URL or Facebook iframe code.'};
    const video=/\/(videos|reel)\//.test(url.pathname)||url.pathname==='/watch/';
    if(video||/\/posts\/|permalink\.php|photo(?:\.php|\/)/.test(url.pathname))return result('iframe','https://www.facebook.com/plugins/'+(video?'video':'post')+'.php?href='+encodeURIComponent(source)+'&show_text=true&width=500','Facebook');
    return {...result('bookmark',source,'Facebook'),message:'Paste a public post URL to embed this Facebook content'};
  }
  if(host==='giphy.com'){
    if(/^\/embed\/[\w-]+/.test(url.pathname))return result('iframe',source,'GIPHY');
    const id=url.pathname.match(/\/(?:gifs|clips)\/(?:[^/]*-)?([a-zA-Z0-9]+)$/)?.[1];
    if(id)return result('iframe','https://giphy.com/embed/'+id,'GIPHY');
  }
  if(host==='drive.google.com'){
    const id=url.pathname.match(/\/file\/d\/([^/]+)/)?.[1];if(id)return result('iframe','https://drive.google.com/file/d/'+encodeURIComponent(id)+'/preview','Google Drive');
  }
  if(host==='docs.google.com'){
    const match=url.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
    if(match&&!url.pathname.includes('/pub'))return result('iframe','https://docs.google.com/'+match[1]+'/d/'+match[2]+'/'+(match[1]==='presentation'?'embed':'preview'),'Google Docs');
  }
  if(host==='open.spotify.com')return result('iframe',source.replace('open.spotify.com/','open.spotify.com/embed/').replace('/embed/embed/','/embed/'),'Spotify');
  if(host==='loom.com')return result('iframe',source.replace('/share/','/embed/'),'Loom');
  if(host==='codepen.io'&&url.pathname.includes('/pen/'))return result('iframe',source.replace('/pen/','/embed/'),'CodePen');
  if(['x.com','twitter.com','instagram.com','tiktok.com'].includes(host))return {...result('bookmark'),message:'Use provider iframe code when available, or open the original post'};
  return result('iframe');
}
