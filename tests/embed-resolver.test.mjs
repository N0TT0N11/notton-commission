import assert from 'node:assert/strict';
import {resolveEmbed} from '../embed-resolver.js';
const cases=[
 ['https://youtu.be/dQw4w9WgXcQ','iframe','youtube-nocookie.com/embed/'],
 ['https://www.youtube.com/shorts/dQw4w9WgXcQ','iframe','youtube-nocookie.com/embed/'],
 ['https://vimeo.com/123456','iframe','player.vimeo.com/video/123456'],
 ['https://www.facebook.com/share/p/1CFgCvBHne/','bookmark','facebook.com/share/'],
 ['https://www.facebook.com/example/posts/123','iframe','plugins/post.php'],
 ['https://www.facebook.com/example/videos/123','iframe','plugins/video.php'],
 ['https://giphy.com/gifs/cat-abc123','iframe','giphy.com/embed/abc123'],
 ['https://media.giphy.com/media/abc/giphy.gif','image','giphy.gif'],
 ['https://example.com/a.mp4','video','a.mp4'],
 ['https://example.com/a.mp3','audio','a.mp3'],
 ['https://drive.google.com/file/d/abc/view','iframe','/abc/preview'],
 ['https://docs.google.com/document/d/abc/edit','iframe','/abc/preview'],
 ['https://open.spotify.com/track/abc','iframe','/embed/track/abc'],
 ['https://loom.com/share/abc','iframe','/embed/abc'],
 ['https://codepen.io/test/pen/abc','iframe','/embed/abc'],
 ['https://example.com','iframe','example.com'],
 ['<iframe src="https://example.com/?a=1&amp;b=2"></iframe>','iframe','a=1&b=2'],
 ['javascript:alert(1)','invalid',null],['data:text/html,bad','invalid',null],
 ['https://user:pass@example.com','invalid',null],['not a url','invalid',null],['','empty',null],
 ['<script>alert(1)</script>','invalid',null]
];
for(const [url,kind,part]of cases){const r=resolveEmbed(url);assert.equal(r.kind,kind,url);if(part)assert.ok(r.src.includes(part),JSON.stringify(r));}
assert.equal(resolveEmbed('https://youtu.be/dQw4w9WgXcQ','bookmark').kind,'bookmark');
console.log('24 embed conversion and unsafe-input checks passed');
