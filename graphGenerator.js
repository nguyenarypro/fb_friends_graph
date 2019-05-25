require('dotenv').config();
let fs = require('fs');
let gexf = require('gexf');
let _ = require('lodash');

let { edgePath, nodePath, gexfPath } = process.env;

let edges = fs.readFileSync(edgePath, 'utf-8').trim().split('\n');

let nodes = fs.readFileSync(nodePath, 'utf-8').trim().split('\n');

nodes = nodes.map(node => {
  let [ id, name, relationship, address, birthday, hometown, gender, created_time, subscribers, friends, groups, admined_groups ] = node.split('|');

  return { id, name, relationship, address, birthday, hometown, gender, created_time, subscribers, friends, groups, admined_groups };  
});

let exampleNode = nodes[0];

let myGexf = gexf.create({
  model: {
    node: Object.keys(exampleNode).map(k => {
      return {
        id: k,
        type: typeof exampleNode[k],
        title: _.capitalize(k)
      };
    })
  }
});

nodes = nodes.map(node => {
  let { id, name, relationship, address, birthday, hometown, gender, created_time, subscribers, friends, groups, admined_groups } = node;

  myGexf.addNode({
    id,
    label: `${name}|${id}`,
    attributes: {
      id,
      name, 
      relationship, 
      address, 
      birthday, 
      hometown, 
      gender, 
      created_time, 
      subscribers, 
      friends, 
      groups, 
      admined_groups
    }
  });
});

edges.map(edge => {
  let [node1, node2] = edge.split('|');

  myGexf.addEdge({
    id: edge,
    source: node1,
    target: node2
  });
});

let output = myGexf.serialize();

fs.writeFileSync(gexfPath, output);