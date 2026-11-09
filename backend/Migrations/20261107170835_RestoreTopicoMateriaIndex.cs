using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleGastos.Migrations
{
    /// <inheritdoc />
    public partial class RestoreTopicoMateriaIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_TopicosEstudo_MateriaEstudoId",
                table: "TopicosEstudo",
                column: "MateriaEstudoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TopicosEstudo_MateriaEstudoId",
                table: "TopicosEstudo");
        }
    }
}
