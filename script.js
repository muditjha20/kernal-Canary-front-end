/************** UI helpers **************/
function showResult(message, type) {
  const box = document.getElementById('resultBox');
  box.textContent = message;
  box.className = 'result-box ' + (type || '') + ' show';
}

// Return candidate “content” slices to try after raw-line matching:
// 1) With LineId present (9+ columns): take [6 .. len-3] as Content (strip EventId & Template)
// 2) Without LineId (8+ columns):     take [5 .. len-3] as Content
// 3) Fallbacks if above aren’t present: join from [6..] or [5..], finally just the line trimmed
function candidateSlices(line) {
  const parts = line.split(',');
  const out = [];

  if (parts.length >= 9) { // LineId + Date,Time,Pid,Level,Component,Content,EventId,EventTemplate
    out.push(parts.slice(6, parts.length - 2).join(',').trim()); // strict content slice
    out.push(parts.slice(6).join(',').trim());                   // content .. end
  }
  if (parts.length >= 8) { // Date,Time,Pid,Level,Component,Content,EventId,EventTemplate
    out.push(parts.slice(5, parts.length - 2).join(',').trim()); // strict content slice
    out.push(parts.slice(5).join(',').trim());                   // content .. end
  }
  // add a plain trimmed version as last resort
  out.push(line.trim());

  // Deduplicate while preserving order
  return [...new Set(out.filter(s => s.length))];
}

// Try to match a single line:
// 1) test full raw line (as-is)
// 2) if no hit, test each candidate content slice
function matchLineToEventId(line, rules) {
  // 1) raw line first
  for (const rule of rules) {
    if (rule.re.test(line)) return rule.eventId;
  }
  // 2) candidate slices
  const slices = candidateSlices(line);
  for (const text of slices) {
    for (const rule of rules) {
      if (rule.re.test(text)) return rule.eventId;
    }
  }
  return null;
}

document.addEventListener('DOMContentLoaded', async () => {
  const logInput   = document.getElementById('logInput');
  const sampleBtn  = document.getElementById('sampleButton');
  const checkBtn   = document.getElementById('checkButton');

  /************** Load artifacts **************/
  let EVENT_ORDER = [], RULES = [];
  try {
    const eo = await fetch('event_order.json');
    if (!eo.ok) throw new Error('event_order.json not found');
    EVENT_ORDER = await eo.json();

    const tr = await fetch('templates.json');
    if (!tr.ok) throw new Error('templates.json not found');
    const rulesRaw = await tr.json();

    // Compile regex; strip inline (?i) if present and add 'i' flag explicitly.
    RULES = rulesRaw.map(r => {
      let pattern = r.Regex || '';
      if (pattern.startsWith('(?i)')) pattern = pattern.slice(4);
      return { eventId: r.EventId, re: new RegExp(pattern, 'i') };
    });
  } catch (err) {
    console.error(err);
    showResult('Failed to load event_order.json / templates.json. Make sure both are next to index.html and served via a local web server.', 'error');
    return;
  }

  const EVENT_INDEX = Object.fromEntries(EVENT_ORDER.map((e, i) => [e, i]));
  const FEATURE_DIM = EVENT_ORDER.length;

  // Normal block (lines 33–61)
  const NORMAL_SAMPLE = `33,081109,203521,29,INFO,dfs.FSNamesystem,BLOCK* NameSystem.allocateBlock: /mnt/hadoop/mapred/system/job_200811092030_0001/job.xml. blk_-3544583377289625738,E22,BLOCK* NameSystem.allocateBlock:<*>
34,081109,203521,30,INFO,dfs.FSNamesystem,BLOCK* NameSystem.addStoredBlock: blockMap updated: 10.251.71.193:50010 is added to blk_-1608999687919862906 size 91178,E26,BLOCK* NameSystem.addStoredBlock: blockMap updated: <*> is added to <*> size <*>
35,081109,203521,33,INFO,dfs.FSNamesystem,BLOCK* NameSystem.addStoredBlock: blockMap updated: 10.251.215.16:50010 is added to blk_7503483334202473044 size 233217,E26,BLOCK* NameSystem.addStoredBlock: blockMap updated: <*> is added to <*> size <*>
36,081109,203521,34,INFO,dfs.FSNamesystem,BLOCK* NameSystem.addStoredBlock: blockMap updated: 10.251.215.16:50010 is added to blk_-1608999687919862906 size 91178,E26,BLOCK* NameSystem.addStoredBlock: blockMap updated: <*> is added to <*> size <*>
37,081109,203521,35,INFO,dfs.FSNamesystem,BLOCK* NameSystem.addStoredBlock: blockMap updated: 10.251.71.16:50010 is added to blk_7503483334202473044 size 233217,E26,BLOCK* NameSystem.addStoredBlock: blockMap updated: <*> is added to <*> size <*>
38,081109,203522,144,INFO,dfs.DataNode$DataXceiver,Receiving block blk_-3544583377289625738 src: /10.251.197.226:60229 dest: /10.251.197.226:50010,E5,Receiving block <*> src: /<*> dest: /<*>
39,081109,203522,145,INFO,dfs.DataNode$DataXceiver,Receiving block blk_-3544583377289625738 src: /10.250.11.100:54800 dest: /10.250.11.100:50010,E5,Receiving block <*> src: /<*> dest: /<*>
40,081109,203522,147,INFO,dfs.DataNode$PacketResponder,PacketResponder 2 for block blk_-3544583377289625738 terminating,E11,PacketResponder <*> for block <*> terminating
41,081109,203522,147,INFO,dfs.DataNode$PacketResponder,Received block blk_-3544583377289625738 of size 11971 from /10.250.19.102,E9,Received block <*> of size <*> from /<*>
42,081109,203523,143,INFO,dfs.DataNode$DataXceiver,Receiving block blk_-9073992586687739851 src: /10.250.19.102:37673 dest: /10.250.19.102:50010,E5,Receiving block <*> src: /<*> dest: /<*>
43,081109,203523,146,INFO,dfs.DataNode$PacketResponder,PacketResponder 1 for block blk_-3544583377289625738 terminating,E11,PacketResponder <*> for block <*> terminating
44,081109,203523,146,INFO,dfs.DataNode$PacketResponder,Received block blk_-3544583377289625738 of size 11971 from /10.251.197.226,E9,Received block <*> of size <*> from /<*>
45,081109,203523,147,INFO,dfs.DataNode$PacketResponder,PacketResponder 0 for block blk_-3544583377289625738 terminating,E11,PacketResponder <*> for block <*> terminating
46,081109,203523,147,INFO,dfs.DataNode$PacketResponder,Received block blk_-3544583377289625738 of size 11971 from /10.250.11.100,E9,Received block <*> of size <*> from /<*>
47,081109,203523,148,INFO,dfs.DataNode$DataXceiver,10.250.11.100:50010 Served block blk_-3544583377289625738 to /10.250.19.102,E3,<*> Served block <*> to /<*>
48,081109,203523,149,INFO,dfs.DataNode$DataXceiver,10.251.111.209:50010 Served block blk_-1608999687919862906 to /10.250.19.102,E3,<*> Served block <*> to /<*>
49,081109,203523,28,INFO,dfs.FSNamesystem,BLOCK* NameSystem.allocateBlock: /user/root/rand/_logs/history/ip-10-250-19-102.ec2.internal_1226291400491_job_200811092030_0001_conf.xml. blk_-9073992586687739851,E22,BLOCK* NameSystem.allocateBlock:<*>
50,081109,203523,29,INFO,dfs.FSNamesystem,BLOCK* NameSystem.addStoredBlock: blockMap updated: 10.251.39.179:50010 is added to blk_-3544583377289625738 size 11971,E26,BLOCK* NameSystem.addStoredBlock: blockMap updated: <*> is added to <*> size <*>
51,081109,203523,33,INFO,dfs.FSNamesystem,BLOCK* NameSystem.addStoredBlock: blockMap updated: 10.250.11.100:50010 is added to blk_-3544583377289625738 size 11971,E26,BLOCK* NameSystem.addStoredBlock: blockMap updated: <*> is added to <*> size <*>
52,081109,203523,33,INFO,dfs.FSNamesystem,BLOCK* NameSystem.addStoredBlock: blockMap updated: 10.251.197.226:50010 is added to blk_-3544583377289625738 size 11971,E26,BLOCK* NameSystem.addStoredBlock: blockMap updated: <*> is added to <*> size <*>
53,081109,203524,143,INFO,dfs.DataNode$DataXceiver,Receiving block blk_-9073992586687739851 src: /10.250.14.196:39576 dest: /10.250.14.196:50010,E5,Receiving block <*> src: /<*> dest: /<*>
54,081109,203524,144,INFO,dfs.DataNode$DataXceiver,Receiving block blk_-9073992586687739851 src: /10.250.7.244:39735 dest: /10.250.7.244:50010,E5,Receiving block <*> src: /<*> dest: /<*>
55,081109,203524,145,INFO,dfs.DataNode$PacketResponder,PacketResponder 2 for block blk_-9073992586687739851 terminating,E11,PacketResponder <*> for block <*> terminating
56,081109,203524,145,INFO,dfs.DataNode$PacketResponder,Received block blk_-9073992586687739851 of size 11977 from /10.250.19.102,E9,Received block <*> of size <*> from /<*>
57,081109,203524,146,INFO,dfs.DataNode$PacketResponder,PacketResponder 0 for block blk_-9073992586687739851 terminating,E11,PacketResponder <*> for block <*> terminating
58,081109,203524,146,INFO,dfs.DataNode$PacketResponder,Received block blk_-9073992586687739851 of size 11977 from /10.250.14.196,E9,Received block <*> of size <*> from /<*>
59,081109,203524,147,INFO,dfs.DataNode$PacketResponder,PacketResponder 1 for block blk_-9073992586687739851 terminating,E11,PacketResponder <*> for block <*> terminating
60,081109,203524,147,INFO,dfs.DataNode$PacketResponder,Received block blk_-9073992586687739851 of size 11977 from /10.250.7.244,E9,Received block <*> of size <*> from /<*>
61,081109,203524,19,INFO,dfs.FSNamesystem,BLOCK* ask 10.251.215.16:50010 to replicate blk_-1608999687919862906 to datanode(s) 10.251.74.79:50010 10.251.107.19:50010,E25,BLOCK* ask <*> to replicate <*> to datanode(s) <*>`;

  // Abnormal block (10 lines)
  const ABNORMAL_SAMPLE = `081109,203524,34,INFO,dfs.FSNamesystem,BLOCK* NameSystem.addStoredBlock: blockMap updated: 10.250.7.244:50010 is added to blk_-9073992586687739851 size 11977,E26,BLOCK* NameSystem.addStoredBlock: blockMap updated: <*> is added to <*> size <*>
081109,203524,35,INFO,dfs.FSNamesystem,BLOCK* NameSystem.addStoredBlock: blockMap updated: 10.250.14.196:50010 is added to blk_-9073992586687739851 size 11977,E26,BLOCK* NameSystem.addStoredBlock: blockMap updated: <*> is added to <*> size <*>
081109,203525,150,INFO,dfs.DataNode$DataXceiver,10.251.215.16:50010 Served block blk_7503483334202473044 to /10.250.19.102,E3,<*> Served block <*> to /<*>
081109,203526,146,INFO,dfs.DataNode$DataXceiver,Received block blk_-1608999687919862906 src: /10.251.215.16:51177 dest: /10.251.215.16:50010 of size 91178,E6,Received block <*> src: /<*> dest: /<*> of size <*>
081109,203526,146,INFO,dfs.DataNode$DataXceiver,Received block blk_-1608999687919862906 src: /10.251.74.79:60333 dest: /10.251.74.79:50010 of size 91178,E6,Received block <*> src: /<*> dest: /<*> of size <*>
081109,203526,146,INFO,dfs.DataNode$DataXceiver,Receiving block blk_-1608999687919862906 src: /10.251.215.16:51177 dest: /10.251.215.16:50010,E5,Receiving block <*> src: /<*> dest: /<*>
081109,203526,146,INFO,dfs.DataNode$DataXceiver,Receiving block blk_-1608999687919862906 src: /10.251.74.79:60333 dest: /10.251.74.79:50010,E5,Receiving block <*> src: /<*> dest: /<*>
081109,203526,149,INFO,dfs.DataNode$DataXceiver,10.251.39.179:50010 Served block blk_-3544583377289625738 to /10.250.18.114,E3,<*> Served block <*> to /<*>
081109,203526,150,INFO,dfs.DataNode$DataXceiver,10.251.197.226:50010 Served block blk_-3544583377289625738 to /10.251.199.225,E3,<*> Served block <*> to /<*>
081109,203526,151,INFO,dfs.DataNode$DataXceiver,10.251.197.226:50010 Served block blk_-3544583377289625738 to /10.251.30.85,E3,<*> Served block <*> to /<*>`;

  /************** Load sample button: alternate Normal/Abnormal **************/
  let toggle = 0;
  if (sampleBtn) {
    sampleBtn.addEventListener('click', () => {
      const sample = (toggle++ % 2 === 0) ? NORMAL_SAMPLE : ABNORMAL_SAMPLE;
      logInput.value = sample;
      showResult((toggle % 2 === 1) ? 'Loaded NORMAL sample' : 'Loaded ABNORMAL sample', 'loading');
    });
  }

  /************** Check Anomaly **************/
  if (checkBtn) {
    checkBtn.addEventListener('click', async () => {
      const text = (logInput.value || '').trim();
      if (!text) {
        showResult('Paste or load logs first.', 'error');
        return;
      }

      // Build frequency vector
      const vec = new Array(FEATURE_DIM).fill(0);
      const lines = text.split('\n').map(s => s.trim()).filter(Boolean);

      let matched = 0;
      for (const raw of lines) {
        let eventId = matchLineToEventId(raw, RULES);
        if (eventId) {
          const idx = EVENT_INDEX[eventId];
          if (idx !== undefined) vec[idx] += 1;
          matched++;
          continue;
        }
      }

      // Debug info
      console.log('Matched', matched, 'of', lines.length, 'lines. Vector:', vec);

      try {
        const res = await fetch('https://kernal-canary.onrender.com/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ window: vec })
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (typeof data.is_anomaly === 'boolean') {
          showResult(
            data.is_anomaly ? '❗ Anomaly detected' : '✅ Normal window',
            data.is_anomaly ? 'anomaly' : 'normal'
          );
        } else {
          showResult('Unexpected API response.', 'error');
        }
      } catch (err) {
        console.error(err);
        showResult('Error contacting backend at https://kernal-canary.onrender.com/score', 'error');
      }
    });
  }
});
