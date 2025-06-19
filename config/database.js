module.exports = {
  development: {
    username: 'root',
    password: '',
    database: 'smart_building',
    host: 'localhost',
    dialect: 'mysql'
  },
  test: {
    username: 'root',
    password: '',
    database: 'smart_building_test',
    host: 'localhost',
    dialect: 'mysql'
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql'
  }
}; 