const { control } = require("./control");
const { register } = require("./register");
const { login } = require("./login");
const { details } = require("./details");
const { customers } = require("./customers");
const { addCustomer } = require("./addCustomer");
const { avatar } = require("./avatar")
const { customersToday } = require("./customersToday");


module.exports = {
    control,
    register,
    login,
    details,
    customers,
    addCustomer,
    avatar,
    customersToday
}