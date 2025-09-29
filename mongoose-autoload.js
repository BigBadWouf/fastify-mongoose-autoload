const fp = require('fastify-plugin');
const fs = require('fs');
const path = require('path');

let mongoose;
try {
  mongoose = require('mongoose');
} catch (err) {
  throw new Error('mongoose is required but not installed. Run: npm install mongoose');
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

    if (!fs.existsSync(modelsPath)) {
      throw new Error(`Schema folder not found: ${modelsPath}. Please create the folder and add your mongoose schemas.`);
    }

    fs.readdirSync(modelsPath)
      .filter(file => file.endsWith('.js') && !file.startsWith('.'))
      .forEach(file => {
        const fullPath = path.join(modelsPath, file);

        if (fs.statSync(fullPath).isDirectory()) return;

        try {
          const { name, schema } = require(fullPath);

          if (!name || !schema) {
            fastify.log.warn(`⚠️ Skipping ${file}: missing name or schema export`);
            return;
          }

          if (!mongoose.models[name]) {
            fastify.log.info(`🔥 Creating ${name} model`);
            mongoose.model(name, schema);
          } else {
            fastify.log.info(`ℹ️ Model ${name} already exists, skipping`);
          }
        } catch (err) {
          console.error(`❌ Error loading schema from ${file}:`, err.message);
        }
      });

  } catch (err) {
    console.error(`❌ Error on mongoose loading:`, err.message);
    throw err;
  }

  fastify.decorate('db', mongoose);
});