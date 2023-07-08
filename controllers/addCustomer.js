const jwtDecode = require("jwt-decode");
const jwt = require('jsonwebtoken');


const addCustomer = async (req, res, client, ObjectId, dbName,) => {
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
                dateCreated: new Date(),
                ...req.body
            }


            try {
                await client.connect();
                const db = client.db(dbName);
                const col = db.collection("customers");
                if (tailor) {
                    const idExists = await col?.findOne({ id: ObjectId(tailor) });
                    if (idExists) {
                        await col?.findOne({ id: ObjectId(tailor) }).then(async (response) => {
                            const existingCustomers = response.customers;
                            existingCustomers.push(customer);
                            const updated = await col?.updateOne({ id: ObjectId(tailor) }, { $set: { customers: existingCustomers } })
                            updated && res.status(200).send({ message: "Customer list has been updated" })
                        });

                    } else {
                        let newCustomers = [];
                        newCustomers.push(customer);
                        let newDocument = {
                            id: ObjectId(tailor),
                            customers: newCustomers
                        }
                        const p = await col.insertOne(newDocument);
                        p && res.status(200).send({ message: "Customer list has been updated" })
                    }
                } else {
                    res.status(400).json({ message: "Authentication error" })
                }
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