const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://fresauce:amogh123@vscodecluster.gltwn.mongodb.net/VSCodeCluster?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => console.log("Connected to MongoDB"));

module.exports = client;
