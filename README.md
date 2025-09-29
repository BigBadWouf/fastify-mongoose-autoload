# Fastify MongoDB Plugin
A Fastify plugin for automatic MongoDB connection and schema loading using Mongoose.

## Features
- 🚀 **Auto-connect** to MongoDB on plugin registration
- 📁 **Auto-load** all schemas from a specified folder
- 🔌 **Zero configuration** - works out of the box with sensible defaults
- 🏷️ **Flexible** - support for sub-schemas and complex models
- ⚡ **Fast** - integrates seamlessly with Fastify's plugin system

## Prerequisites

This plugin requires mongoose to be installed:

```bash 
npm install mongoose
```

## Installation

Copy the plugin file to your project and register it with Fastify.

Usage
Basic Registration

```js
const fastify = require('fastify')({ logger: true });

// Register the MongoDB plugin
await fastify.register(require('./path/to/mongodb-plugin'), {
  host: 'localhost',
  port: 27017,
  user: 'myuser',
  password: 'mypassword',
  dbname: 'mydatabase',
  schemasFolder: './models'
});

// MongoDB connection and models are now available
fastify.get('/users', async (request, reply) => {
  const User = fastify.db.models.Users;
  const users = await User.find();
  return users;
});

// Run the server!
fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  // Server is now listening on ${address}
})

```

## Configuration Options
| Option 	| Type 	| Default 	| Description
|------- | -------- | ---------- | ---------------|
| host 	| string 	| 'localhost' 	| MongoDB host
| port 	| number 	| 27017 	MongoDB | port
| user 	| string 	| 'anonymous' 	| MongoDB username
| password 	| string 	| 'mypassword' 	| MongoDB password
| dbname 	| string 	| 'mydb' 	| Database name
| schemasFolder 	| string 	| './mymodels' 	| Path to schemas folder (relative to plugin)

## Schema Structure

Create your schema files in the specified folder. Each schema file must export an object with name and schema properties.

Example Schema File ./models/Users.js

```js
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Sub-schema example (no need to export)
const Address = new Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zip: { type: Number },
});

// Main schema
const schema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, unique: true },
  address: Address, // Using sub-schema
  createdAt: { type: Date, default: Date.now }
});

// Export with name and schema
module.exports = { name: 'Users', schema: schema };
```

Example with Multiple Sub-schemas ex: ./models/Orders.js

```js
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Sub-schemas (internal use only)
const OrderItem = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Products' },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }
});

const ShippingAddress = new Schema({
  fullName: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: { type: String, required: true }
});

// Main schema
const schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  items: [OrderItem],
  shippingAddress: ShippingAddress,
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'shipped', 'delivered'], default: 'pending' },
  orderDate: { type: Date, default: Date.now }
});

module.exports = { name: 'Orders', schema: schema };
```

Example with Sub-shema in separate file ./models/Users.js

```js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { schema: Address } = require('./subschema/Address.js')

// Main schema
const schema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, unique: true },
  address: Address, // Using sub-schema
  createdAt: { type: Date, default: Date.now }
});

// Export with name and schema
module.exports = { name: 'Users', schema: schema };
```

And, in ./models/subschema/Address.js

```js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const Address = new Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zip: { type: Number },
});

// Export with name and schema
module.exports = { name: 'Address', schema: schema };
```


## Accessing Models

Once registered, you can access your models through ```fastify.db.models```:

```js
fastify.get('/api/users', async (request, reply) => {
  const User = fastify.db.models('Users');
  const users = await User.find().select('-password');
  return { users };
});

fastify.post('/api/users', async (request, reply) => {
  const User = fastify.db.models('Users');
  const newUser = new User(request.body);
  await newUser.save();
  return reply.status(200).send({ success: true, userId: newUser._id });
});
```

## Error Handling

The plugin will:
- ❌ Throw an error if mongoose is not installed
- ❌ Stop the Fastify startup process if MongoDB connection fails
- ❌ Log errors for any schema loading issues
- ✅ Skip directories in the schemas folder (Ideal for sub-schema)
- ✅ Prevent duplicate model registration

## Notes

- Sub-schemas: You can define sub-schemas in the same file without exporting them
- References: Use Schema.Types.ObjectId for referencing other models
- Validation: Mongoose validation works as expected
- Indexes: Define indexes in your schemas as usual
- Middleware: Pre/post hooks can be added to schemas before export

## Example Project Structure
```
my-fastify-app/
├── server.js
├── plugins/
│   └── mongodb.js
└── models/
    ├── subschema/
    │   └── Address.js
    ├── Users.js
    ├── Orders.js
    └── Products.js
```