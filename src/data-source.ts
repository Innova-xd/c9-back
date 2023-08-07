require('dotenv').config();
import "reflect-metadata"
import { DataSource, DataSourceOptions } from "typeorm"
import { SeederOptions } from "typeorm-extension";
import { MainSeeder } from "./seeds/MainSeeder";


const options: DataSourceOptions & SeederOptions = {
    type: "postgres",
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    synchronize: false,
    logging: false,
    entities: [`${__dirname}/**/entity/*.ts`],
    migrations: [`${__dirname}/**/migration/*.ts`],
    seeds: [MainSeeder],
    subscribers: [],
    ssl: true,
}

export const AppDataSource = new DataSource(options)
