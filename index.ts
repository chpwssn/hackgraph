var express = require("express");
var graphqlHTTP = require("express-graphql");
var { buildSchema } = require("graphql");
import hackernews from "./lib/hackernews";
import producthunt from "./lib/producthunt";

var schema = buildSchema(`
  enum HackernewsListType {
    NEW
    TOP
  }

  enum HackernewsType {
    story
    comment
    ask
    job
    poll
    pollopt
  }

  type HackernewsStory {
    by: String,
    descendants: Int,
    id: Int,
    kids: [Int],
    score: Int,
    time: Int,
    title: String,
    type: HackernewsType,
    url: String
  }

  type HackernewsComment {
    by: String
    id: Int
    kids: [HackernewsComment]
    parent: Int
    text: String
    type: HackernewsType
  }

  type ProducthuntItem {
    comments_count: Int,
    day: String,
    id: Int,
    name: String,
    product_state: String,
    tagline: String,
    slug: String,
    votes_count: Int,
    category_id: Int,
    created_at: String,
    discussion_url: String,
    featured: Boolean,
    redirect_url: String,
  }

  type Query {
    hello: String
    hackernewsPosts(type: HackernewsListType, count: Int, from: Int): [HackernewsStory] 
    hackernewsComments(parentId: Int): [HackernewsComment]
    producthuntPosts: [ProducthuntItem]
  }
`);

var root = {
  hello: () => "Hello, World!",
  hackernewsPosts: async (args: any) => {
    return new Promise(async (resolve, reject) => {
      const defaults = {
        type: "top",
        count: 50
      };
      args = { ...defaults, ...args };
      const storyIds = await hackernews.getStories(args.type.toLowerCase());
      const stories = await Promise.all(
        storyIds.slice(0, args.count).map(async (post: number) => {
          return hackernews.getItem(post);
        })
      );
      resolve(stories);
    });
  },
  hackernewsComments: async (args: any) => {
    return (await hackernews.getComments(args.parentId)).kids;
  },
  producthuntPosts: async () => (await producthunt.getPosts()).posts
};

var app = express();
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
  })
);
app.listen(4000, () => console.log("Now browse to localhost:4000/graphql"));
