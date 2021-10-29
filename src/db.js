const client = require("./mongoConnect");

const addUser = async (data) => {
  const collection = client.db("userdata").collection("users");
  const userId = data.userId;
  const userName = data.username;
  if (await collection.findOne({ userId: userId })) {
    return;
  }
  collection.insertOne(
    { userId: userId, userName: userName, activityTime: 0, monthlyTime: 0 },
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );
};

const sendTick = async (data) => {
  const userId = data.userId;
  const time = data.time;
  const lastTime = data.lastTime;
  if (time - lastTime > process.env.TIMEOUT) {
    return;
  }
  let timeOffset = time - lastTime;
  const collection = client.db("userdata").collection("users");

  collection.updateOne(
    { userId: userId },
    { $inc: { activityTime: timeOffset } },
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );
  collection.updateOne(
    { userId: userId },
    { monthlyTime: { $exists: true, $ne: null } },
    { $inc: { monthlyTime: timeOffset } },
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );
  collection.updateOne(
    { userId: userId },
    { monthlyTime: { $exists: false } },
    { $set: { monthlyTime: timeOffset } },
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );
};

const getUsers = async (serverlist) => {
  const collection = client.db("userdata").collection("users");
  // console.log(serverlist);
  const res = await (
    await collection.find({ userId: { $in: serverlist } })
  ).toArray();
  // console.log(res);
  return res;
};

const getGlobalUsers = async () => {
  const collection = client.db("userdata").collection("users");
  const res = await (await collection.find({})).toArray();
  return res;
};

module.exports = { addUser, sendTick, getUsers, getGlobalUsers };
