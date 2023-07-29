const jwtDecode = require("jwt-decode");
const jwt = require("jsonwebtoken");

const ordersToday = async (req, res, client, dbName, ObjectId) => {
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
    if (!!payload) {
      const decoded = jwtDecode(token);
      const tailor = reqId === decoded.sub ? decoded.sub : null;

      try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection("orders");

        tailor
          ? col
              ?.findOne({ id: ObjectId(tailor) })
              .then(async (response) => {
                if (response) {
                  if (
                    Object.keys(response).includes("orders") &&
                    response.orders
                  ) {
                    const data = response.orders;

                    var nd = data.filter((order) => {
                      const today = new Date();

                      return (
                        today.toDateString() ===
                        order.dateCreated.toDateString()
                      );
                    });

                    res.status(200).json({ data: nd.length });
                  } else if (!response.orders) {
                    res.status(200).json({ data: 0 });
                  }
                } else {
                    res.status(200).json({ data: 0 })
                }
              })
              .catch((err) => {
                console.log("today", err);
                res.status(401).json({ message: err });
              })
          : res.status(400).json({ message: "User does not exist" });
      } catch (err) {
        res.status(500).json({ message: "Something went wrong" });
      }
    } else {
      res
        .status(401)
        .json({
          message:
            "Unauthorized. Access is denied due to invalid credentials."
        });
    }
  } else {
    res
      .status(401)
      .json({
        message:
          "Unauthorized. Access is denied due to invalid credentials."
      });
  }
};

module.exports = { ordersToday };
