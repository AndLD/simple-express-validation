# simple-express-validation

Simple schemas validation for express only.

## Opportunities

This package allows you to check:
* req.body
* req.params
* req.query

In each of them you can check fields for:
* existance
* type (simple js data types + date)
* value (by specifying array with allowed values)
* is email

You can validate nested objects by specifying '_store' property in *req.body*. It contains nested object.

You can specify a list of allowed properties in *req.body* or *req.query* by setting '_allowedProps' array of keys. If '_allowedProps' contains array of strings then validation will return error in case any property would not found in '_allowedProps' array.

## Usage
```js
const express = require('express');
const { validate } = require('simple-express-validation');

const app = express();
app.use(express.json());

const bodySchema = {
  _allowedProps: ['email', 'fio', 'sex', 'birthdate', 'phone', 'address'],
  email: {
    required: true,
    type: 'string',
    isEmail: true
  },
  fio: {
    required: true,
    type: 'string'
  },
  sex: {
    required: true,
    type: 'string',
    equals: ['m', 'f']
  },
  birthdate: {
    required: true,
    type: 'date'
  },
  phone: {
    required: true,
    type: 'string',
    regexp: /^0[0-9]{9}$/
  },
  address: {
    required: false,
    _store: {
      _allowedProps: ['street', 'house'],
      street: {
        required: true,
        type: 'string'
      },
      house: {
        required: true,
        type: 'number'
      }
    }
  }
};

// You can specify these schemas the same as previous instead of '_store' property.
const paramsSchema = {};
const querySchema = {};

app.post('/person', validate(bodySchema, paramsSchema, querySchema), (req, res) => {
  console.log(req.body);
  res.sendStatus(200);
});

app.listen(3000);
```