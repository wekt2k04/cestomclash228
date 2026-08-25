import 'dotenv/config';
import { DataSource } from 'typeorm';

// DataSource autonome pour le CLI TypeORM (migration:generate/run/revert) -
// distinct de database.module.ts qui configure TypeORM via
// TypeOrmModule.forRootAsync() a l'interieur du contexte Nest (DI, config
// validee par Joi). Le CLI tourne HORS de ce contexte, donc pas d'acces a
// ConfigService : on charge .env directement via dotenv, et on liste les
// entites/migrations par glob plutot que via autoLoadEntities (qui depend
// du scan de modules Nest, indisponible ici).
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  // Jamais true ici : le CLI ne doit jamais auto-appliquer un changement de
  // schema en douce, seulement via des migrations explicites et revues.
  synchronize: false,
});
