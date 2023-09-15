import { DataSource } from "typeorm";
import { Seeder, SeederFactoryManager, runSeeder } from "typeorm-extension";
import { PublicationSeeder } from "./PublicationSeeder";
import { QuestionSeeder } from "./QuestionSeeder";
import { UserSeeder } from "./UserSeeder";
import { CategorySeeder } from "./CategorySeeder";
import { RegionSeeder } from "./regionSeeder";
import { CitySeeder } from "./citySeeder";
import { AuthorSeeder } from './AuthorSeeder';
import { ChatSeeder } from './ChatSeeder'
import { MessagesSeeder } from "./MessagesSeeder";

export class MainSeeder implements Seeder {
  async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager
  ): Promise<any> {
    await runSeeder(dataSource, UserSeeder);
    await runSeeder(dataSource, AuthorSeeder);
    await runSeeder(dataSource, CategorySeeder);
    await runSeeder(dataSource, PublicationSeeder);
    await runSeeder(dataSource, QuestionSeeder);
    await runSeeder(dataSource, RegionSeeder);
    await runSeeder(dataSource, CitySeeder);
    await runSeeder(dataSource, ChatSeeder);
    await runSeeder(dataSource, MessagesSeeder);
  }
}
