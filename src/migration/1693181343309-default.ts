import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1693181343309 implements MigrationInterface {
    name = 'Default1693181343309'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "isTeacher" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isTeacher"`);
    }

}
