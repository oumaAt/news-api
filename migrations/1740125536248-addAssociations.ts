import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddAssociations1740125536248 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    //Article-User
    await queryRunner.addColumn(
      'article',
      new TableColumn({
        name: 'authorId',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'article',
      new TableForeignKey({
        columnNames: ['authorId'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    //Comment-User
    await queryRunner.addColumn(
      'comment',
      new TableColumn({
        name: 'authorId',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'comment',
      new TableForeignKey({
        columnNames: ['authorId'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    //Comment-Article
    await queryRunner.addColumn(
      'comment',
      new TableColumn({
        name: 'articleId',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'comment',
      new TableForeignKey({
        columnNames: ['articleId'],
        referencedTableName: 'article',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const articleTable = await queryRunner.getTable('article');
    const article_authorId = articleTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('authorId') !== -1,
    );
    await queryRunner.dropForeignKey('article', article_authorId);

    await queryRunner.dropColumn('article', 'authorId');

    const commentTable = await queryRunner.getTable('comment');
    const comment_authorId = commentTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('authorId') !== -1,
    );
    await queryRunner.dropForeignKey('comment', comment_authorId);

    await queryRunner.dropColumn('comment', 'authorId');

    const comment_articleId = commentTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('articleId') !== -1,
    );
    await queryRunner.dropForeignKey('comment', comment_articleId);

    await queryRunner.dropColumn('comment', 'articleId');
  }
}
