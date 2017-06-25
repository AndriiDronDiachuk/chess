/**
 * Created by andrii on 24.06.17.
 */
const Sequelize = require('sequelize');

const connection = new Sequelize('chessdb', 'postgres', '1111', {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres'
});

/*connection.sync({
    force: true
});*/

module.exports = connection;