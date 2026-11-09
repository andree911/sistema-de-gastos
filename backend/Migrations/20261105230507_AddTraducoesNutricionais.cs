using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleGastos.Migrations
{
    /// <inheritdoc />
    public partial class AddTraducoesNutricionais : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TraducoesNutricionais",
                columns: table => new
                {
                    Chave = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Original = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Traducao = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TraducoesNutricionais", x => x.Chave);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TraducoesNutricionais");
        }
    }
}
