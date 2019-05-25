require('dotenv').config();
let { getNodeInfo } = require('./apis.js');
let fs = require('fs');

(async() => {
  let { access_token, nodePath, edgePath } = process.env;

  if (fs.existsSync(nodePath)) fs.unlinkSync(nodePath);

  let edges = fs.readFileSync(edgePath, 'utf-8').trim();

  let nodes = Array.from(new Set(edges.replace(/\|/g, '\n').split('\n')));

  for (node of nodes) {
    console.log(`Crawling ${node}`);

    let nodeInfo = await getNodeInfo(access_token, node);

    let { relationship, name, address, birthday, hometown, gender, created_time, subscribers, friends, groups, admined_groups } = nodeInfo;

    let nodeText = `${node}|${name}|${relationship}|${address}|${birthday}|${hometown}|${gender}|${created_time}|${subscribers}|${friends}|${groups}|${admined_groups}\n`;

    fs.appendFileSync(nodePath, nodeText);
  }
})();