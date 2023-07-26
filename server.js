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
  avatar, customersToday,
  editMeasurements,
  orders, addOrder
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
// get customers
app.get('/users/:tailorId/customers', async (req, res) => customers(req, res, client, dbName, ObjectId));
// add customer
app.post('/users/:tailorId/customers', async (req, res) => addCustomer(req, res, client, ObjectId, dbName ));
// edit measurements
app.put('/users/:tailorId/customer/edit', async (req, res) => editMeasurements(req, res, client, ObjectId, dbName ));
// upload user avatar
app.post('/users/:tailorId/upload-avatar', async (req, res) => avatar(req, res, client, dbName, ObjectId))
// get today's list of added customers
app.get('/users/:tailorId/customers/today', async (req, res) => customersToday(req, res, client, dbName, ObjectId));
// get orders
app.get('/users/:tailorId/orders', async (req, res) => orders(req, res, client, dbName, ObjectId));
// add order
app.post('/users/:tailorId/orders', async (req, res) => addOrder(req, res, client, ObjectId, dbName ));



// // test auth
// app.post('/users/:tailorId/customers', async (req, res) => {
//   const reqId = req.params.tailorId;
//   console.log(req?.headers)

//   const bearer = req?.headers?.authorization;
//   console.log(res.body)

// })


app.listen(port, () => {
  console.log(`server started. listening on ${port}`)
})
