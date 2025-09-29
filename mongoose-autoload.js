const fp = require('fastify-plugin');
const fs = require('fs');
const path = require('path');
let mongoose
try {
  mongoose = require('mongoose');
} catch(err) {
  console.error('mongoose is not installed. Try npm install mongoose')
}

module.exports = fp(async function (fastify, options) {

  const {
    host = 'localhost',
    port = 27017,
    user = 'anonymous',
    password = 'mypassword',
    dbname = 'mydb',
    schemasFolder = './mymodels'
  } = options;

  const mongoUri = `mongodb://${user}:${password}@${host}:${port}/${dbname}`;

  try {
    await mongoose.connect(mongoUri);
    fastify.log.info('✅ MongoDB connected');

    const modelsPath = path.join(__dirname, schemasFolder);

    fs.readdirSync(modelsPath).forEach(file => {
      const fullPath = path.join(modelsPath, file);

      if (fs.statSync(fullPath).isDirectory()) return; // skip directories

      const { name, schema } = require(fullPath);


      if (!mongoose.models[name]) {
        fastify.log.info(`🔥 Creating ${name} model`);
        mongoose.model(name, schema);
      }
    });

  } catch (err) {
    fastify.log.error(`❌ Error on mongoose loading`);
    throw err; // Stop loading process
  }

  // Add mongoose decorate
  fastify.decorate('db', mongoose);
});