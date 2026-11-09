using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleGastos.Migrations
{
    /// <inheritdoc />
    public partial class AddCatalogoTemasEstudo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TopicosEstudo_MateriaEstudoId",
                table: "TopicosEstudo");

            migrationBuilder.AddColumn<string>(
                name: "CodigoCatalogo",
                table: "TopicosEstudo",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FonteCatalogo",
                table: "TopicosEstudo",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TopicosEstudo_MateriaEstudoId_FonteCatalogo_CodigoCatalogo",
                table: "TopicosEstudo",
                columns: new[] { "MateriaEstudoId", "FonteCatalogo", "CodigoCatalogo" },
                unique: true,
                filter: "\"FonteCatalogo\" IS NOT NULL AND \"CodigoCatalogo\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TopicosEstudo_MateriaEstudoId_FonteCatalogo_CodigoCatalogo",
                table: "TopicosEstudo");

            migrationBuilder.DropColumn(
                name: "CodigoCatalogo",
                table: "TopicosEstudo");

            migrationBuilder.DropColumn(
                name: "FonteCatalogo",
                table: "TopicosEstudo");

            migrationBuilder.CreateIndex(
                name: "IX_TopicosEstudo_MateriaEstudoId",
                table: "TopicosEstudo",
                column: "MateriaEstudoId");
        }
    }
}
