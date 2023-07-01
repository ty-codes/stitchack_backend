const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res, client, dbName) => {
    const { email, secret } = req.body;

    if (email && secret) {
        var saltRounds = email.length;

        var hash = await bcrypt.hash(secret, saltRounds);
        try {
            await client.connect();
            const db = client.db(dbName);
            const col = db.collection("users");
            var user = await col?.findOne({ email: email });
            if (user) {
                const { secret: secrethash, ...others } = user;
                bcrypt.compare(secret, secrethash).then((response) => {
                    if (response) {
                        const payload = {
                            sub: user?._id?.toString(),
                            iat: new Date().getTime()
                        }

                        const token = jwt.sign(payload, process.env.SECRET_KEY);
                        res.status(200).json({ token, user: others })
                    }
                    else {
                        res.status(400).json({ message: "Invalid credentials" })
                    }
                })
            } else {
                res.status(400).send({ message: "Email doesn't exist" })
            }

        } catch (err) {
            console.log(err)
            res.status(500).json({ message: "Something went wrong" });
        }
    } else {
        res.status(400).json({ message: "Incorrect data" })
    }
}

module.exports = { login };