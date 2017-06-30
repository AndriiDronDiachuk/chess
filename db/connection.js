/**
 * Created by andrii on 24.06.17.
 */
const Sequelize = require('sequelize');

//var web_config = process.env.DATABASE_URL;

const webConnection = process.env.DATABASE_URL;

const localConnection = new Sequelize('chessdb', 'postgres', '1111', {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres'
});

const connection = webConnection;
/*connection.sync({
    force: true
});*/

module.exports = connection;