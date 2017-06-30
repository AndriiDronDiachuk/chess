/**
 * Created by andrii on 24.06.17.
 */
const Sequelize = require('sequelize');

//var web_config = process.env.DATABASE_URL;

const DATABASE_URL = "postgres://btrhekrtdobvqb:273bf4f1340c9a3c15afecc3c58690eda6e3bc1f29fd1a29e7ecdf949d693633@ec2-54-75-229-201.eu-west-1.compute.amazonaws.com:5432/d28q1qpcbvrn73"

const webConnection = new Sequelize(DATABASE_URL);

const localConnection = new Sequelize('chessdb', 'postgres', '1111', {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres'
});

const connection = webConnection || localConnection;
/*connection.sync({
    force: true
});*/

module.exports = connection;