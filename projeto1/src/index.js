const { request, response } = require("express");
const express = require("express");
const app = express();
const { v4: uuidv4 } = require("uuid");
app.use(express.json());
const customers = [];

// - cpf - string
// - name - string
// - id - uuid
// - statement - []

//middleware - mediador do demonio

function getBalance(statement) {
  const balance = statement.reduce((acc, opration) => {
    if (opration.type === "credit") {
      return acc + opration.amount;
    } else {
      return acc - opration.amount;
    }
  }, 0);
  return balance;
}
function existecpf(request, response, next) {
  const { cpf } = request.headers;
  const customer = customers.find((customer) => customer.cpf === cpf);
  if (!customer) {
    return response.status(400).json({ error: "voce e burro, achei nao" });
  }
  request.customer = customer;
  return next();
}

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;
  const customerAlreadyexists = customers.some(
    (customer) => customer.cpf === cpf
  );
  if (customerAlreadyexists) {
    return response.status(400).json({ error: "jose ja ta ai" });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });
  return response.status(201).send();
});

app.get("/statement", existecpf, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
});

app.post("/deposita", existecpf, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;
  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };
  customer.statement.push(statementOperation);
  return response.status(201).send();
});

app.post("/saque", existecpf, (request, response) => {
  const { customer } = request;
  const { amount } = request.body;
  const balance = getBalance(customer.statement);
  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "credit",
  };
  if (balance < amount) {
    return response.status(400).json({ error: "nao ha dinheiro" });
  }
  customer.statement.push(statementOperation);
  return response.status(201).send();
});

app.get("/statement/date", existecpf, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");
  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );
  return response.json(customer.statement);
});

app.delete("/delete", existecpf, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);
  return response.status(200).json(customers);
});

app.get("/balance", existecpf, (request, response) => {
  const { customer } = request;
  const balance = getBalance(customer.statement);
  return response.json(balance);
});

app.put("/account", existecpf, (request, response) => {
  const { customer } = request;
  const { name } = request.body;
  customer.name = name;
  return response.status(201).send();
});

app.get("/account", existecpf, (request, response) => {
  const { customer } = request;
  return response.json(customer);
});
app.listen(3333);
