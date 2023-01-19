const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hellow from fun-book server");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tzinyke.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const usersCollection = client.db("funBookDb").collection("users");
    const postsCollection = client.db("funBookDb").collection("posts");

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const alreadyExist = await usersCollection.findOne(query);
      if (alreadyExist) {
        return res.send({ message: "This user already exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      if (!user) {
        return res.send({ message: "This user does't exists" });
      }
      res.send(user);
    });

    app.post("/posts", async (req, res) => {
      const post = req.body;

      const date = new Date();
      post.date = date;
      const result = await postsCollection.insertOne(post);
      res.send(result);
    });

    app.get("/posts", async (req, res) => {
      const query = {};
      if (req.query.limit) {
        const posts = await postsCollection
          .find(query)
          .sort({ date: -1 })
          .limit(3)
          .toArray();
        res.send(posts);
      } else {
        const posts = await postsCollection
          .find(query)
          .sort({ date: -1 })
          .toArray();
        res.send(posts);
      }
    });

    app.put("/like", async (req, res) => {
      const filter = { _id: ObjectId(req.query.id) };
      const option = { upsert: true };
      const isExist = await postsCollection.findOne(filter);
      const isLiked = isExist?.reactors?.includes(req.query.reactorEmail);
      if (isLiked) {
        const updatedDoc = {
          $pull: {
            reactors: req.query.reactorEmail,
          },
        };
        const result = await postsCollection.updateOne(
          filter,
          updatedDoc,
          option
        );

        res.send(result);
      } else {
        const updatedDoc = {
          $push: {
            reactors: req.query.reactorEmail,
          },
        };
        const result = await postsCollection.updateOne(
          filter,
          updatedDoc,
          option
        );

        res.send(result);
      }
    });

    app.put("/comment", async (req, res) => {
      const commentInfo = req.body;
      const filter = { _id: ObjectId(commentInfo.postId) };
      const option = { upsert: true };
      const updatedDoc = {
        $push: {
          comments: commentInfo,
        },
      };

      const result = await postsCollection.updateOne(
        filter,
        updatedDoc,
        option
      );

      res.send(result);
    });

    app.delete("/deletepost", async (req, res) => {
      const postId = req.query.postId;
      const query = { _id: ObjectId(postId) };
      const result = await postsCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/updatePost", async (req, res) => {
      const updatingPostInfo = req.body;
      const filter = { _id: ObjectId(updatingPostInfo.postId) };
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          caption: updatingPostInfo.updatingCaption,
          picture: updatingPostInfo.image,
        },
      };

      const result = await postsCollection.updateOne(
        filter,
        updatedDoc,
        option
      );
      res.send(result);
    });

    app.get("/userposts", async (req, res) => {
      const userEmail = req.query.email;
      const query = { authorEmail: userEmail };
      const posts = await postsCollection.find(query).toArray();
      res.send(posts);
    });
  } finally {
  }
}

run().catch((err) => console.error(err));

app.listen(port, () => {
  console.log("funbook-server is running on port:", port);
});
