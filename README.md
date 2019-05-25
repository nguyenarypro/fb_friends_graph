# fb_friends_graph

An implementation insprired by https://techblog.mediaservice.net/2019/05/find-hidden-friends-and-community-for-any-facebook-user/

## How to use
1. Clone/download this repository
2. Create .env file and fill in your access_token and target's Facebook id (others params are default, you don't need to change them). See `.env-example`
3. Run
```bash
npm install
npm run start
```
4. The result will be available at `output.gexf` (or the path specified as gexfPath in your .env)

## Mechanism
Files will be running by the following order:
1. pivotGenerator.js: Generating pivots list from target posts in the format of `<id>|<name>`
2. pivotScanner.js: Scanning out pivots and generating graph edges list, with the following logic:
  - If C is A and B's friend, then we have the these edges:
    + A - B
    + B - C
    + A - C
  - Each mutual friend we found will generate 3 edges lines, in the format of `<id1>|<id2>`
3. nodeCrawler.js: Generate nodes list from edges list and crawling info of each node
4. graphGenerator.js: Generate gexf graph file from nodes and edges file

## To do
- Allow limiting reactors/commenters/resharers per post
- Crawling from user' images
- Adding web template for showing graph
