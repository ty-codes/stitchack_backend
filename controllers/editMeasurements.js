const jwtDecode = require("jwt-decode");
const jwt = require("jsonwebtoken");

const editMeasurements = async (req, res, client, ObjectId, dbName) => {
  const reqId = req.params.tailorId;
  const bearer = req?.headers?.authorization;

  if (bearer) {
    const [, token] = bearer
      ? bearer.split(" ")
      : res
          .status(401)
          .json({
            message:
              "Unauthorized. Access is denied due to invalid credentials."
          });
    const payload = token ? jwt.verify(token, process.env.SECRET_KEY) : null;

    const { cid, measurements } = req.body;

    if (!!payload && cid && measurements) {
      const decoded = jwtDecode(token);
      const tailor = reqId === decoded.sub ? decoded.sub : null;
      const customer = {
        cid: ObjectId().toString(),
        dateCreated: new Date(),
        ...req.body
      };

      try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection("customers");
        if (tailor) {
          const idExists = await col?.findOne({ id: ObjectId(tailor) });
          if (idExists) {
            const customers = idExists.customers;
            const customerExists = customers.filter(
              (customer) => customer.cid === cid
            );
            if (customerExists) {
              const uneditedCustomers = customers.filter(
                (customer) => customer.cid !== cid
              );
              customerExists[0].measurements = measurements;
              uneditedCustomers.push(customerExists[0]);
              const updated = await col?.updateOne(
                { id: ObjectId(tailor) },
                { $set: { customers: uneditedCustomers } }
              );
              updated && res.status(200).send({ message: "Success" });
            } else {
              res.status(400).send({ message: "Customer does not exist" });
            }
          } else {
            res.status(400).send({ message: "User does not exist" });
          }
        } else {
          res.status(400).json({ message: "Authentication error" });
        }
      } catch (err) {
        res.status(500).json({ message: "Something went wrong" });
      }
    } else {
      res
        .status(400)
        .json({
          message: "Incomplete. Access is denied due to incorrect data."
        });
    }
  } else {
    res
      .status(401)
      .json({
        message: "Unauthorized. Access is denied due to invalid credentials."
      });
  }
};

module.exports = { editMeasurements };
