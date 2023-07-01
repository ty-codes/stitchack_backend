const express = require('express')
const cors = require("cors");
require("dotenv").config();
const randomString = require("randomized-string");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtDecode = require("jwt-decode");

// controllers
const { 
  control, register, 
  login, details,
  customers, addCustomer,
  avatar, customersToday
} = require("./controllers");


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
var port = process.env.PORT || 8000;
app.use(express.static(__dirname));



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const randomId = new randomString.generate({
  charset: "alphanumeric",
  length: 24,
})

// The database to use
const dbName = "users";
app.get("/", async (req, res) => control(res));
// register
app.post('/public/users', async (req, res) => register(req, res, client, dbName));
// login
app.post('/public/users/authenticate', async (req, res) => login(req, res, client, dbName));
// authenticated
// user details
app.get('/users/:tailorId', async (req, res) => details(req, res, client, dbName, ObjectId));
// get list of customers
app.get('/users/:tailorId/customers', async (req, res) => customers(req, res, client, dbName, ObjectId));
// add of customer
app.post('/users/:tailorId/customers', async (req, res) => addCustomer(req, res, client, ObjectId, dbName ));
// upload user avatar
app.post('/users/:tailorId/upload-avatar', async (req, res) => avatar(req, res, client, dbName, ObjectId))
// get today's list of added customers
app.get('/users/:tailorId/customers/today', async (req, res) => customers(req, res, client, dbName, ObjectId));




// delete account
app.put('/deleteaccount/users/:id', async (req, res) => {
  var { username, password } = req.body;
  const tailor = req.params.id;
  if (username === process.env.ADMIN_USERNAME && password === ADMIN_SECRET) {
    try {
      await client.connect();
      const db = client.db(dbName);
      const col = db.collection("users");

      tailor ?
        col?.findOen({ _id: tailor })
          .then(async (response) => {
            res.status(200).send(response)
          })
        : res.status(400).send({ message: "Cannot find user" })
    } catch (err) {
      console.log(err)
    }
  } else {
    res.status(400).send({ message: "Unauthorized." })
  }
})


// // test add cus
// app.post('/users/:tailorId/customers', async (req, res) => {
//   const reqId = req.params.tailorId;
//   console.log(req?.headers)

//   const bearer = req?.headers?.authorization;
//   console.log(res.body)

// })

// delete customer













// add customer measurement
app.post('/users/:tailorId/measurements', async (req, res) => {
  const reqId = req.params.tailorId;

  const bearer = req?.headers?.authorization;

  if (bearer) {
    const [, token] = bearer ? bearer.split(" ") : res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
      ;
    const payload = token ? jwt.verify(token, process.env.SECRET_KEY) : null;
    const { cid, ...others } = req.body;
    if (!!payload && cid) {
      const decoded = jwtDecode(token);
      const tailor = reqId === decoded.sub ? decoded.sub : null;

      try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection("users");
        const measurement = { ...others }
        tailor ? col?.findOne({ _id: ObjectId(tailor) })
          .then(async (response) => {
            const cidAavailable = await db?.collection("measurements")?.findOne({ cid: cid });
            if (cidAavailable) {
              const updated = await db?.collection("measurements")?.insertOne({ cid: cid, measurements: measurement });

              res.status(200).send({ data: updated })
            } else {
              res.status(500).send({ messge: "Could not add data" })
            }
            // !cidAavailable && await db?.collection("measurements")?.insertOne({ cid: cid, measurements: measurement})
            // : await db?.collection("measurements")?.findOneAndUpdate({cid: cid}, {measurements: measurement})
            // if(cidAavailable) {
            //                 // : await db?.collection("measurements")?.findOneAndUpdate({cid: cid}, {measurements: measurement})
            // } else {
            //   await db?.collection("measurements")?.insertOne({ cid: cid, measurements: measurement})
            // }
          })
          .catch(err => {
            res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials.", error: err })
          })
          : res.status(400).json({ message: "User does not exist" })


      } catch (err) {
        res.status(400).json({ message: "Something went wrong" })
      }


    } else {
      res.status(401).json({ message: "paylodUnauthorized. Access is denied due to invalid credentials." })

    }
  } else {
    res.status(401).json({ message: "bearerUnauthorized. Access is denied due to invalid credentials." })

  }

})

// edit customer measurement
app.put('/users/:tailorId/measurements', async (req, res) => {
  const reqId = req.params.tailorId;

  const bearer = req?.headers?.authorization;

  if (bearer) {
    const [, token] = bearer ? bearer.split(" ") : res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
      ;
    const payload = token ? jwt.verify(token, process.env.SECRET_KEY) : null;
    // const reqBodyCompleted =  arr.every(item => obj.hasOwnProperty(item))
    const { cid, ...others } = req.body;
    if (!!payload && cid) {
      const decoded = jwtDecode(token);
      const tailor = reqId === decoded.sub ? decoded.sub : null;

      try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection("users");
        const measurement = others.measurements;

        tailor ? col?.findOne({ _id: ObjectId(tailor) })
          .then(async (response) => {
            const cidAavailable = await db?.collection("measurements")?.findOne({ cid: cid });
            if (cidAavailable) {

              var editedDocument = { ...cidAavailable.measurements, ...measurement }
              const updated = db?.collection("measurements")?.updateMany({ cid: cid }, { $set: { measurements: editedDocument } })
              res.status(200).send({ messge: "Updated successfully" })

            } else {
              res.status(500).send({ messge: "Could not update data" })
            }
          })
          .catch(err => {
            res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials.", error: err })
          })
          : res.status(400).json({ message: "User does not exist" })


      } catch (err) {
        res.status(400).json({ message: "Something went wrong" })
      }


    } else {
      res.status(401).json({ message: "paylodUnauthorized. Access is denied due to invalid credentials." })

    }
  } else {
    res.status(401).json({ message: "bearerUnauthorized. Access is denied due to invalid credentials." })

  }

})

// get customer measurements
app.get('/users/:tailorId/measurements/:customerId', async (req, res) => {
  const reqId = req.params.tailorId;
  const cid = req.params.customerId;

  const bearer = req?.headers?.authorization;

  if (bearer) {
    const [, token] = bearer ? bearer.split(" ") : res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
      ;
    const payload = token ? jwt.verify(token, process.env.SECRET_KEY) : null;
    if (!!payload && cid) {
      const decoded = jwtDecode(token);
      const tailor = reqId === decoded.sub ? decoded.sub : null;

      try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection("users");
        tailor ? col?.findOne({ _id: ObjectId(tailor) })
          .then(async (response) => {
            const customer = await db?.collection("measurements")?.findOne({ cid: cid });
            res.status(200).send({ data: customer.measurements || [] })
          })
          .catch(err => {
            res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials.", error: err })
          })
          : res.status(400).json({ message: "User does not exist" })


      } catch (err) {
        res.status(400).json({ message: "Something went wrong" })
      }


    } else {
      res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

    }
  } else {
    res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

  }

})

// add style to catalogue
app.post('/catalogue/:tailorId', async (req, res) => {
  const reqId = req.params.tailorId;

  const bearer = req?.headers?.authorization;

  if (bearer) {

    const [, token] = bearer ? bearer.split(" ") : res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." });
    const payload = token ? jwt.verify(token, process.env.SECRET_KEY) : null;
    const { style, fabric, name } = req.body;
    if (!!payload && style && fabric && name) {
      var randomId = randomString.generate({
        charset: "alphanumeric",
        length: 24,
      });
      const decoded = jwtDecode(token);
      const tailor = reqId === decoded.sub ? decoded.sub : null;
      const unit = {
        id: randomId,
        ...req.body
      }

      try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection("users");
        tailor ? col?.findOne({ _id: ObjectId(tailor) })
          .then(async (response) => {
            if (response && !response.catalogue) {
              var catalogueArray = [];
              catalogueArray.push(unit);
              const updated = await col?.updateOne({ _id: ObjectId(tailor) }, { $set: { catalogue: catalogueArray } })
              updated && res.status(200).send({ message: "Catalogue has been updated" })
            } else if (response && response.catalogue) {
              var catalogueArray = response?.catalogue;
              catalogueArray.push(unit);
              const updated = await col?.updateOne({ _id: ObjectId(tailor) }, { $set: { catalogue: catalogueArray } })
              updated && res.status(200).send({ message: "Catalogue has been updated" })
            } else if ((!response)) {
              res.status(400).json({ message: "Account doesn't exist." });
            }
          })
          .catch(err => {
            res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
          })
          : res.status(400).json({ message: "User does not exist" })


      } catch (err) {
        res.status(400).json({ message: "Something went wrong" })
      }


    } else {
      res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

    }
  } else {
    res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

  }

})

// get catalogue
app.get('/catalogue/:tailorId', async (req, res) => {
  const reqId = req.params.tailorId;

  const bearer = req?.headers?.authorization;

  if (bearer) {
    const [, token] = bearer ? bearer.split(" ") : res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
      ;
    const payload = token ? jwt.verify(token, process.env.SECRET_KEY) : null;
    if (!!payload) {
      const decoded = jwtDecode(token);
      const tailor = reqId === decoded.sub ? decoded.sub : null;

      try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection("users");
        tailor ?
          col?.findOne({ _id: ObjectId(tailor) })
            .then(async (response) => {
              if (response.catalogue) {
                res.status(200).json({ data: response.catalogue });
              } else if ((!response.catalogue)) {
                res.status(200).json({ data: [] });
              }
            })
            .catch(err => {
              res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
            })
          : res.status(400).json({ message: "Invalid credentials" })

      } catch (err) {
        res.status(400).json({ message: "Something went wrong" })
      }


    } else {
      res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

    }
  } else {
    res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

  }

})

// delete catalogue
app.put('/catalogue/:tailorId', async (req, res) => {
  const reqId = req.params.tailorId;

  const bearer = req?.headers?.authorization;

  if (bearer) {
    const [, token] = bearer ? bearer.split(" ") : res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
      ;
    const payload = token ? jwt.verify(token, process.env.SECRET_KEY) : null;
    const { id } = req.body;
    if (!!payload && id) {
      const decoded = jwtDecode(token);
      const tailor = reqId === decoded.sub ? decoded.sub : null;

      try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection("users");
        tailor ?
          col?.findOne({ _id: ObjectId(tailor) })
            .then(async (response) => {
              if (response.catalogue) {
                const deleted = await col.updateOne({ _id: ObjectId(tailor) }, { $pull: { catalogue: { id: id } } })
                res.status(200).json(deleted);
              } else if ((!response.catalogue)) {
                res.status(200).json({ data: "Does not exist in catalogue" });
              }
            })
            .catch(err => {
              res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
            })
          : res.status(400).json({ message: "Invalid credentials" })

      } catch (err) {
        res.status(400).json({ message: "Something went wrong" })
      }


    } else {
      res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

    }
  } else {
    res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

  }

})

// add order
app.post('/orders/:tailorId', async (req, res) => {
  const reqId = req.params.tailorId;

  const bearer = req?.headers?.authorization;

  if (bearer) {
    const [, token] = bearer ? bearer.split(" ") : res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
      ;
    const payload = token ? jwt.verify(token, process.env.SECRET_KEY) : null;
    // const reqBodyCompleted =  arr.every(item => obj.hasOwnProperty(item))
    const { cid, dateCreated, dateDue, price, status, style } = req.body;
    if (!!payload && cid && dateCreated && dateDue && price && status && style) {
      var randomId = randomString.generate({
        charset: "alphanumeric",
        length: 24,
      });
      const decoded = jwtDecode(token);
      const tailor = reqId === decoded.sub ? decoded.sub : null;
      // style would  be an image link from a catalogue sent from the frontend

      try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection("orders");
        const order = { cid, dateCreated, dateDue, price, status, style };
        tailor ? col?.findOne({ tailorId: tailor })
          .then(async (response) => {

            var orderDocument = { id: randomId, ...order };
            if (!response) {
              const p = await col.insertOne({ tailorId: tailor, orders: [] });
              var orderArray = [];
              orderArray.push(orderDocument);
              if (p) {
                const updated = await col?.updateOne({ tailorId: tailor }, { $set: { orders: orderArray } })
                updated && res.status(200).send(updated)
              }
            } else {
              var orderArray = response?.orders;
              orderArray.push(orderDocument);
              const updated = await col?.updateOne({ tailorId: tailor }, { $set: { orders: orderArray } })

              updated && res.status(200).send(updated)

            }

          })
          .catch(err => {
            res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials.", error: err })
          })
          : res.status(400).json({ message: "User does not exist" })


      } catch (err) {
        res.status(400).json({ message: "Something went wrong" })
      }


    } else {
      res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

    }
  } else {
    res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

  }

})

// get list of orders
app.get('/orders/:tailorId', async (req, res) => {
  const reqId = req.params.tailorId;

  const bearer = req?.headers?.authorization;

  if (bearer) {
    const [, token] = bearer ? bearer.split(" ") : res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
      ;
    const payload = token ? jwt.verify(token, process.env.SECRET_KEY) : null;
    if (!!payload) {
      const decoded = jwtDecode(token);
      const tailor = reqId === decoded.sub ? decoded.sub : null;

      try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection("orders");

        tailor ?
          col?.findOne({ tailorId: tailor })
            .then(async (response) => {
              if (response && response?.orders) {
                res.status(200).json({ data: response.orders });
              } else if ((response && !response?.orders)) {
                res.status(200).json({ data: [] });
              } else {
                res.status(200).json({ data: [] });
              }
            })
            .catch(err => {
              res.status(401).json({ message: "tUnauthorized. Access is denied due to invalid credentials." })
            })
          : res.status(200).json({ data: [], message: "You do not have any orders" })

      } catch (err) {
        res.status(400).json({ message: "Something went wrong" })
      }


    } else {
      res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

    }
  } else {
    res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

  }

})

// get totaal income
app.get('/total-income/:tailorId', async (req, res) => {
  const reqId = req.params.tailorId;

  const bearer = req?.headers?.authorization;

  if (bearer) {
    const [, token] = bearer ? bearer.split(" ") : res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
      ;
    const payload = token ? jwt.verify(token, process.env.SECRET_KEY) : null;
    if (!!payload) {
      const decoded = jwtDecode(token);
      const tailor = reqId === decoded.sub ? decoded.sub : null;

      try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection("orders");

        tailor ?
          col?.findOne({ tailorId: tailor })
            .then(async (response) => {
              if (response && response?.orders) {
                const completedOrders = response.orders.filter(order => {
                  return order.status === "done";
                });
                const totalRevenue = completedOrders && completedOrders.reduce((acc, object) => {
                  return acc + Number(object.price);
                }, 0);

                res.status(200).json({ total: totalRevenue });
              } else if ((response && !response?.orders)) {
                res.status(200).json({ data: [] });
              } else {
                res.status(200).json({ data: [] });
              }
            })
            .catch(err => {
              res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
            })
          : res.status(200).json({ data: [], message: "You do not have any orders" })

      } catch (err) {
        res.status(400).json({ message: "Something went wrong" })
      }


    } else {
      res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

    }
  } else {
    res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

  }

})

// get outsatnding income
app.get('/outstanding-income/:tailorId', async (req, res) => {
  const reqId = req.params.tailorId;

  const bearer = req?.headers?.authorization;

  if (bearer) {
    const [, token] = bearer ? bearer.split(" ") : res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
      ;
    const payload = token ? jwt.verify(token, process.env.SECRET_KEY) : null;
    if (!!payload) {
      const decoded = jwtDecode(token);
      const tailor = reqId === decoded.sub ? decoded.sub : null;

      try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection("orders");

        tailor ?
          col?.findOne({ tailorId: tailor })
            .then(async (response) => {
              if (response && response?.orders) {
                const outstandingOrders = response.orders.filter(order => {
                  return order.status === "pending" || order.status === "not started";
                });
                const totalOutstandingRevenue = outstandingOrders && outstandingOrders.reduce((acc, object) => {
                  return acc + Number(object.price);
                }, 0);

                res.status(200).json({ total: totalOutstandingRevenue });
              } else if ((response && !response?.orders)) {
                res.status(200).json({ data: [] });
              } else {
                res.status(200).json({ data: [] });
              }
            })
            .catch(err => {
              res.status(401).json({ message: "tUnauthorized. Access is denied due to invalid credentials." })
            })
          : res.status(200).json({ data: [], message: "You do not have any orders" })

      } catch (err) {
        res.status(400).json({ message: "Something went wrong" })
      }


    } else {
      res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

    }
  } else {
    res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

  }

})

// set status
app.put('/orders/status/:tailorId', async (req, res) => {
  const reqId = req.params.tailorId;

  const bearer = req?.headers?.authorization;

  if (bearer) {
    const [, token] = bearer ? bearer.split(" ") : res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
      ;
    const payload = token ? jwt.verify(token, process.env.SECRET_KEY) : null;
    const { id, newStatus } = req.body;
    if (!!payload && id && newStatus) {
      const decoded = jwtDecode(token);
      const tailor = reqId === decoded.sub ? decoded.sub : null;

      try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection("orders");
        tailor ?
          col?.findOne({ tailorId: tailor })
            .then(async (response) => {
              if (response.orders) {
                const updated = await col.updateOne({ tailorId: tailor, "orders.id": id }, { $set: { "orders.$.status": newStatus } })
                res.status(200).json(updated);
              } else if ((!response.orders)) {
                res.status(200).json({ data: "Does not exist in orders" });
              }
            })
            .catch(err => {
              res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
            })
          : res.status(400).json({ message: "Invalid credentials" })

      } catch (err) {
        res.status(400).json({ message: "Something went wrong" })
      }


    } else {
      res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

    }
  } else {
    res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })

  }

})

app.listen(port, () => {
  console.log(`server started. listening on ${port}`)
})
