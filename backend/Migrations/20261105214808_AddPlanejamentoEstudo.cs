using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ControleGastos.Migrations
{
    /// <inheritdoc />
    public partial class AddPlanejamentoEstudo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TopicoEstudoId",
                table: "SessoesEstudo",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MateriasEstudo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Titulo = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    PlanoEstudoId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MateriasEstudo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MateriasEstudo_PlanosEstudo_PlanoEstudoId",
                        column: x => x.PlanoEstudoId,
                        principalTable: "PlanosEstudo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TopicosEstudo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Titulo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DataPrevista = table.Column<DateOnly>(type: "date", nullable: true),
                    MateriaEstudoId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TopicosEstudo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TopicosEstudo_MateriasEstudo_MateriaEstudoId",
                        column: x => x.MateriaEstudoId,
                        principalTable: "MateriasEstudo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SessoesEstudo_TopicoEstudoId",
                table: "SessoesEstudo",
                column: "TopicoEstudoId");

            migrationBuilder.CreateIndex(
                name: "IX_MateriasEstudo_PlanoEstudoId",
                table: "MateriasEstudo",
                column: "PlanoEstudoId");

            migrationBuilder.CreateIndex(
                name: "IX_TopicosEstudo_MateriaEstudoId",
                table: "TopicosEstudo",
                column: "MateriaEstudoId");

            migrationBuilder.AddForeignKey(
                name: "FK_SessoesEstudo_TopicosEstudo_TopicoEstudoId",
                table: "SessoesEstudo",
                column: "TopicoEstudoId",
                principalTable: "TopicosEstudo",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SessoesEstudo_TopicosEstudo_TopicoEstudoId",
                table: "SessoesEstudo");

            migrationBuilder.DropTable(
                name: "TopicosEstudo");

            migrationBuilder.DropTable(
                name: "MateriasEstudo");

            migrationBuilder.DropIndex(
                name: "IX_SessoesEstudo_TopicoEstudoId",
                table: "SessoesEstudo");

            migrationBuilder.DropColumn(
                name: "TopicoEstudoId",
                table: "SessoesEstudo");
        }
    }
}
