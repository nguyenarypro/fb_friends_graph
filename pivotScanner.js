require('dotenv').config();
let fs = require('fs');
let { init, getTargetInfo, exchangeToken, getCookie, getDTSG, getAllMutualFriends } = require('./apis.js');

(async() => {
  let { access_token, target, edgePath, pivotPath, sessionPath } = process.env;

  if (fs.existsSync(edgePath)) fs.unlinkSync(edgePath);

  if (fs.existsSync(sessionPath)) {
    session = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
  } else {
    session = await exchangeToken(access_token);

    fs.writeFileSync(sessionPath, JSON.stringify(session));
  }

  let currentUserId = session.uid;

  let cookie = await getCookie(session);

  let request = init(cookie);

  let fb_dtsg = await getDTSG(request);

  let checked = {};

  let pivots = fs.readFileSync(pivotPath, 'utf-8')
    .trim()
    .split('\n')
    .map(pivot => {
      [id, name] = pivot.split('|');

      return { id, name };
    });

  while (pivots.length) {
    console.log(`${pivots.length} pivots left`);

    let pivot = pivots.shift();
    console.log(`Checking ${pivot.name}|${pivot.id}`);

    checked[pivot.id] = true;

    let mutualFriends = await getAllMutualFriends(fb_dtsg, target, pivot.id, currentUserId);
    console.log(`Found ${mutualFriends.length} edges`);

    let graphEdgesText = '';

    if (mutualFriends.length) {
      mutualFriends.map(friend => {
        if (!checked[friend.id] && friend.id != pivot.id) {
          graphEdgesText += `${target}|${pivot.id}\n`;
          graphEdgesText += `${friend.id}|${pivot.id}\n`;
          graphEdgesText += `${target}|${friend.id}\n`;

          pivots.push(friend);
          checked[friend.id] = true;
        }
      });

      fs.appendFileSync(edgePath, graphEdgesText);
    }
  }

  let edges = Array.from(new Set(fs.readFileSync(edgePath, 'utf-8').trim().split('\n'))).join('\n');

  fs.writeFileSync(edgePath, edges);
})();