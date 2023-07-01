const bcrypt = require('bcrypt');
const randomString = require("randomized-string");


const register = async (req, res, client, dbName) => {

    const { email, firstname, lastname, secret, phoneNumber } = req.body;
    if (email && firstname && lastname && secret && phoneNumber) {
        var randomId = randomString.generate({
            charset: "alphanumeric",
            length: 24,
        });
 
        var saltRounds = email.length;

        var hash = await bcrypt.hash(secret, saltRounds);
        try {
            await client.connect();
            const db = client.db(dbName);
            const col = db.collection("users");
            var user = await col?.findOne({ email: email })

            if (!user) {
                // Construct a document                                                                                                                                                              
                let newDocument = hash && {
                    "id": randomId,
                    "isGoogle": secret ? false : true,
                    "isFb": secret ? false : true,
                    "status": "pending",
                    "dateCreated": new Date(),
                    email: email,
                    firstname: firstname,
                    lastname: lastname,
                    secret: hash,
                    phoneNumber: phoneNumber,
                }
                // res.send(newDocument)
                // Insert a single document, wait for promise so we can read it back

                const p = await col.insertOne(newDocument);
                p && res.status(200).send({message: "0K"})
            } else {
                res.status(400).send({ message: "Email already exists" })
            }

        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Something went wrong" });
        }

        finally {
            // await client.close();
        }

    }
    else {
        res.status(400).json({ message: "Incorrect data" })
    }
}

module.exports = { register };