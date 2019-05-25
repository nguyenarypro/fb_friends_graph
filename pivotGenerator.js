require('dotenv').config();
let FB = require('fb');
let fs = require('fs');
let _ = require('lodash');
let { getTargetInfo, exchangeToken, getAllPostIds, getAllReactors, getAllCommenters, getAllResharers } = require('./apis.js');

(async() => {
  let { pivotPath, access_token, target } = process.env;

  if (fs.existsSync(pivotPath)) fs.unlinkSync(pivotPath);

  let targetInfo = await getTargetInfo(access_token, target);

  console.log(`Running for user ${targetInfo.name}`);

  let session = null;

  let sessionPath = 'session.json';

  if (fs.existsSync(sessionPath)) {
    session = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
  } else {
    session = await exchangeToken(access_token);

    fs.writeFileSync(sessionPath, JSON.stringify(session));
  }

  let postsIds = await getAllPostIds(access_token, target);

  console.log(`Found ${postsIds.length} posts`);

  for (post of postsIds) {
    console.log(`Crawling post ${post.id}`);

    let [reactors, commenters, resharers] = await Promise.all([
      getAllReactors(access_token, post.id),
      getAllCommenters(access_token, post.id),
      getAllResharers(access_token, post.id)
    ]);

    console.log(`Got ${reactors.length} reactors`);
    console.log(`Got ${commenters.length} commenters`);
    console.log(`Got ${resharers.length} resharers`);

    let fullInteracts = [...reactors, ...commenters, ...resharers];

    let usersObj = {};

    fullInteracts.map(user => {
      if (user.id == target) return false;
      if (!usersObj[user.id]) usersObj[user.id] = user;
    });

    let pivots = Object.values(usersObj).filter(user => {
      let friends = _.get(user, 'friends.nodes');
      return friends && friends.length;
    });

    if (pivots.length) {
      let pivotsText = pivots.map(user => `${user.id}|${user.name}`).join('\n') + '\n';
      
      fs.appendFileSync(pivotPath, pivotsText);
    }
  }

  let pivots = fs.readFileSync(pivotPath, 'utf-8');

  let users = pivots.split('\n');

  let usersObj = {};

  users.map(user => {
    [id, name] = user.split('|');

    if (!usersObj[id]) usersObj[id] = user;
  });

  fs.writeFileSync(pivotPath, Object.values(usersObj).join('\n'));
})()