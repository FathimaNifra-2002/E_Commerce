import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbName = process.env.DB_NAME || 'e_commerce_db';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 3306;

// Create database if not exists
try {
    const connection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        port: dbPort
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();
} catch (err) {
    console.log('Error creating database:', err.message);
}

const sequelize = new Sequelize(
    dbName,
    dbUser,
    dbPassword,
    {
        host: dbHost,
        port: dbPort,
        dialect: 'mysql',
        logging: false,
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('MySQL Connected Successfully');
        // Sync models
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully');
    } catch (error) {
        console.log('MySQL Connection Failed');
        console.log('Error:', error.message);
    }
};

export { sequelize, connectDB };
export default connectDB;
