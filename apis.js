let FB = require('fb');
let request = require('request-promise');
let cheerio = require('cheerio');
let _ = require('lodash');

request = request.defaults({
  // proxy: 'http://localhost:8080',
  // strictSSL: false
});

let getPostIds = (access_token, node, limit = 100, start_cursor = '', end_cursor = '', first = null) => {
  let q = `node(${node}){
      timeline_feed_units
        .before(${start_cursor})
        .after(${end_cursor})
        ${ first ? `.first(${limit})` : `.last(${limit})` }
        {
          page_info,
          nodes{
            id
          }
        }
    }
  `;

  try {
    return FB.api('graphql', { access_token, q })
      .then(res => _.get(res[node], 'timeline_feed_units') || []);
  } catch (err) {
    if (err.timeout) {
      return getPostIds(access_token, node, limit, start_cursor, end_cursor, first);
    }

    throw err;
  }
}

let getAllPostIds = async(access_token, node) => {
  let start_cursor = '';
  let full = [];

  try {
    do {
      let data = await getPostIds(access_token, node, 1000, start_cursor);

      full = full.concat(data.nodes);

      start_cursor = _.get(data, 'page_info.start_cursor');
    } while (start_cursor);

    return full;
  } catch (err) {
    console.log(err);

    return [];
  }
}

let getReactors = (access_token, node, limit = 100, friends = false, start_cursor = '', end_cursor = '', first = null) => {
  let q = `node(${node}){
    feedback{
      reactors
        .before(${start_cursor})
        .after(${end_cursor})
        ${ first ? `.first(${limit})` : `.last(${limit})` }
        {
          page_info,
          nodes{
            id,
            name,
            ${ friends ? 'friends.first(1){nodes{id}}' : '' }
          }
        }
    }
  }`;

  try {
    return FB.api('graphql', { access_token, q })
      .then(res => _.get(res[node], 'feedback.reactors') || []);
  } catch (err) {
    if (err.timeout) {
      return getReactors(access_token, node, limit, start_cursor, end_cursor, first);
    }

    throw err;
  }
}

let getAllReactors = async(access_token, node) => {
  let start_cursor = '';
  let full = [];

  try {
    do {
      let data = await getReactors(access_token, node, 1000, true, start_cursor);

      if (_.get(data, 'nodes')) {
        full = full.concat(data.nodes);
      }

      start_cursor = _.get(data, 'page_info.start_cursor');
    } while (start_cursor);

    return full;
  } catch (err) {
    console.log(err);

    return [];
  }
}

let getResharers = (access_token, node, limit = 100, friends = false, start_cursor = '', end_cursor = '', first = null) => {
  let q = `node(${node}){
    feedback{
      resharers
        .before(${start_cursor})
        .after(${end_cursor})
        ${ first ? `.first(${limit})` : `.last(${limit})` }
        {
          page_info,
          nodes{
            id,
            name,
            ${ friends ? 'friends.first(1){nodes{id}}' : '' }
          }
        }
    }
  }`;

  try {
    return FB.api('graphql', { access_token, q })
      .then(res => _.get(res[node], 'feedback.resharers') || []);
  } catch (err) {
    if (err.timeout) {
      return getResharers(access_token, node, limit, start_cursor, end_cursor, first);
    }

    throw err;
  }
}

let getAllResharers = async(access_token, node) => {
  let start_cursor = '';
  let full = [];

  try {
    do {
      let data = await getResharers(access_token, node, 1000, true, start_cursor);

      if (_.get(data, 'nodes')) {
        full = full.concat(data.nodes);
      }

      start_cursor = _.get(data, 'page_info.start_cursor');
    } while (start_cursor);

    return full;
  } catch (err) {
    console.log(err);

    return [];
  }
}

let getCommenters = (access_token, node, limit = 100, friends = false, start_cursor = '', end_cursor = '', first = null) => {
  let q = `node(${node}){
    feedback{
      commenters
        .before(${start_cursor})
        .after(${end_cursor})
        ${ first ? `.first(${limit})` : `.last(${limit})` }
        {
          page_info,
          nodes{
            id,
            name,
            ${ friends ? 'friends.first(1){nodes{id}}' : '' }
          }
        }
    }
  }`;

  try {
    return FB.api('graphql', { access_token, q })
      .then(res => _.get(res[node], 'feedback.commenters') || []);
  } catch (err) {
    if (err.timeout) {
      return getCommenters(access_token, node, limit, start_cursor, end_cursor, first);
    }

    throw err;
  }
}

let getAllCommenters = async(access_token, node) => {
  try {
    let start_cursor = '';
    let full = [];

    do {
      let data = await getCommenters(access_token, node, 1000, true, start_cursor);

      if (_.get(data, 'nodes')) {
        full = full.concat(data.nodes);
      }

      start_cursor = _.get(data, 'page_info.start_cursor');
    } while (start_cursor);

    return full;
  } catch (err) {
    console.log(err);

    return [];
  }
}

let getTargetInfo = (access_token, node) => {
  let q = `node(${node}){
    name,
    friends.first(1){nodes{id}}
  }`;

  return FB.api('graphql', { access_token, q })
    .then(res => res[node]);
}

let getCookie = response => {
  return response.session_cookies.reduce((prev, current) => {
    return prev += `${current.name}=${current.value}; `
  }, '');
}

let getDTSG = request => {
  return request.get('https://www.facebook.com/me')
    .then(res => {
      let pattern = /"token":"(.+?)"/;

      let matches = pattern.exec(res);

      if (matches) return matches[1];
      else throw 'Cannot get token';
    });
}

let exchangeToken = access_token => {
  return request.get(`https://api.facebook.com/method/auth.getSessionForApp`, {
    qs: {
      access_token,
      new_app_id: 256002347743983,
      format: 'json',
      generate_session_cookies: 1
    },
    json: true,
    headers: {
      'User-Agent': 'Dalvik/1.6.0 (Linux; U; Android 4.4.4; Samsung Galaxy S5 - 4.4.4 - API 19 - 1080x1920 Build/KTU84P) [FBAN/AtWorkForAndroid;FBAV/187.0.0.39.81;FBPN/com.facebook.work;FBLC/en_US;FBBV/122258929;FBCR/Android;FBMF/Genymotion;FBBD/generic;FBDV/Samsung Galaxy S5 - 4.4.4 - API 19 - 1080x1920;FBSV/4.4.4;FBCA/x86:unknown;FBDM/{density=3.0,width=1080,height=1920};FB_FW/1;]'
    }
  });
}

let getMutualFriends = (fb_dtsg, uid, node, currentUserId, start = 0) => {
  return request.get('https://www.facebook.com/ajax/browser/list/mutualfriends/', { 
    qs: {
      uid,
      node,
      start,
      fb_dtsg,
      __user: currentUserId,
      __a: 1
    }
  })
  .then(res => {
    return JSON.parse(res.replace('for (;;);', ''));
  })
  .then(res => res.domops[0][3].__html)
  .then(html => {
    let $ = cheerio.load(html);

    let profiles = $('.fbProfileBrowserListItem');

    return profiles.map((i, profile) => {
      try {
        let elem = $(profile);

        let name = elem.find('.fsl.fwb.fcb').text();

        let id = elem.find('._39g5').attr('href');

        if (!id) return null;

        id = id.split('uid=')[1];

        return { name, id };
      } catch (err) {
        console.log(err);
        return null;
      }
    })
    .get()
    .filter(profile => profile);
  });
}

let getAllMutualFriends = async(fb_dtsg, uid, node, currentUserId) => {
  let result = {};
  let next = 0;

  while (true) {
    try {
      let mutual = await getMutualFriends(fb_dtsg, uid, node, currentUserId, next);

      mutual.map(user => {
        if (!result[user.id]) result[user.id] = user;
      });

      next += mutual.length;

      if (!mutual.length) break;
    } catch (err) {
      console.log(err);
    }
  }

  return Object.values(result);
}

let getNodeInfo = (access_token, node) => {
  let q = `node(${node}){
    relationship,
    name,
    address,
    birthday,
    hometown,
    gender,
    created_time,
    subscribers{
      count
    },
    friends{
      count
    },
    groups{
      count
    },
    admined_groups{count}
  }`;

  try {
    return FB.api('graphql', { access_token, q })
      .then(res => res[node])
      .then(node => {
        let data = {
          relationship: _.get(node, 'relationship.status'),
          name: _.get(node, 'name'),
          address: _.get(node, 'address'),
          birthday: _.get(node, 'birthday'),
          hometown: _.get(node, 'hometown.name'),
          gender: _.get(node, 'gender'),
          created_time: _.get(node, 'created_time'),
          subscribers: _.get(node, 'subscribers.count'),
          friends: _.get(node, 'friends.count'),
          groups: _.get(node, 'groups.count'),
          admined_groups: _.get(node, 'admined_groups.count')
        };

        return data;
      });
  } catch (err) {
    if (err.timeout) {
      return getNodeInfo(access_token, node);
    }

    throw err;
  }
}

let init = (Cookie) => {
  request = request.defaults({
    headers: {
      Cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36',
    },
  });

  return request;
}

module.exports = { getPostIds, getAllPostIds, getReactors, getAllReactors, getResharers, getAllResharers, getCommenters, getAllCommenters, getTargetInfo, getCookie, getDTSG, exchangeToken, getMutualFriends, getAllMutualFriends, init, getNodeInfo }