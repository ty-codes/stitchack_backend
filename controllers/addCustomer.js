const jwtDecode = require("jwt-decode");
const jwt = require('jsonwebtoken');


const addCustomer = async (req, res, client, ObjectId, dbName, ) => {
    const reqId = req.params.tailorId;
    const bearer = req?.headers?.authorization;
 
    if (bearer) {

        const [, token] = bearer ? bearer.split(" ") : res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
            ;
        const payload = token ? jwt.verify(token, process.env.SECRET_KEY) : null;
        

        const { phoneNumber, gender, firstname, lastname, email, address } = req.body;

        if (!!payload && firstname && lastname && phoneNumber && email && address && gender) {
            const decoded = jwtDecode(token);
            const tailor = reqId === decoded.sub ? decoded.sub : null;
            const customer = {
                cid: ObjectId().toString(),
                ...req.body
            }


            try {
                await client.connect();
                const db = client.db(dbName);
                const col = db.collection("users");
                tailor ? col?.findOne({ _id: ObjectId(tailor) })
                    .then(async (response) => {
                        if (response) {
                            var customerArray = response.customers ? response?.customers : [];
                            customerArray.push(customer);
                            const updated = await col?.updateOne({ _id: ObjectId(tailor) }, { $set: { customers: customerArray } })
                            updated && res.status(200).send({ message: "Customer list has been updated" })
                        } else if ((!response)) {
                            res.status(400).json({ message: "Account doesn't exist." });
                        }
                    })
                    .catch(err => {
                        res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials.", error: err })
                    })
                    : res.status(400).json({ message: "User does not exist" })


            } catch (err) {
                res.status(500).json({ message: "Something went wrong" });
            }


        } else {
            res.status(400).json({ message: "Incomplete. Access is denied due to incorrect data." })

        }
    } else {
        res.status(401).json({ message: "Unauthorized. Access is denied due to invalid credentials." })
    }

}

module.exports = { addCustomer };