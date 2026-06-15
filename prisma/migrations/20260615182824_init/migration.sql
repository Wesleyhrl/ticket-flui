/*
  Warnings:

  - Added the required column `titulo` to the `Chamado` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chamado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "prioridade" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "id_responsavel" INTEGER NOT NULL,
    "solicitante_nome" TEXT,
    "data_abertura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_solucao" DATETIME,
    CONSTRAINT "Chamado_id_responsavel_fkey" FOREIGN KEY ("id_responsavel") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Chamado" ("data_abertura", "data_solucao", "descricao", "id", "id_responsavel", "prioridade", "solicitante_nome", "status") SELECT "data_abertura", "data_solucao", "descricao", "id", "id_responsavel", "prioridade", "solicitante_nome", "status" FROM "Chamado";
DROP TABLE "Chamado";
ALTER TABLE "new_Chamado" RENAME TO "Chamado";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
