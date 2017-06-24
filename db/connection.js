/**
 * Created by andrii on 24.06.17.
 */
const Sequelize = require('sequelize');

//подключение бд
const connection = new Sequelize('chessdb', 'postgres', '1111', {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres'
});

//проверка подключения к бд
connection
    .authenticate()
    .then(() => {
        console.log('Connection to DataBase has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

/*connection.sync({
    force: true
});*/

module.exports = connection;