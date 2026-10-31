using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ControleGastos.Migrations
{
    /// <inheritdoc />
    public partial class AddEstudos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LicoesConcluidas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CursoSlug = table.Column<string>(type: "text", nullable: false),
                    LicaoSlug = table.Column<string>(type: "text", nullable: false),
                    ConcluidaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LicoesConcluidas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LicoesConcluidas_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlanosEstudo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Titulo = table.Column<string>(type: "text", nullable: false),
                    Tema = table.Column<string>(type: "text", nullable: false),
                    Objetivo = table.Column<string>(type: "text", nullable: false),
                    MetaSessoesSemanais = table.Column<int>(type: "integer", nullable: false),
                    CursoSlug = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanosEstudo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanosEstudo_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessoesEstudo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Data = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DuracaoMinutos = table.Column<int>(type: "integer", nullable: false),
                    Observacoes = table.Column<string>(type: "text", nullable: false),
                    LicaoSlug = table.Column<string>(type: "text", nullable: true),
                    PlanoEstudoId = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessoesEstudo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessoesEstudo_PlanosEstudo_PlanoEstudoId",
                        column: x => x.PlanoEstudoId,
                        principalTable: "PlanosEstudo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_SessoesEstudo_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LicoesConcluidas_UserId_CursoSlug_LicaoSlug",
                table: "LicoesConcluidas",
                columns: new[] { "UserId", "CursoSlug", "LicaoSlug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlanosEstudo_UserId",
                table: "PlanosEstudo",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SessoesEstudo_PlanoEstudoId",
                table: "SessoesEstudo",
                column: "PlanoEstudoId");

            migrationBuilder.CreateIndex(
                name: "IX_SessoesEstudo_UserId",
                table: "SessoesEstudo",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LicoesConcluidas");

            migrationBuilder.DropTable(
                name: "SessoesEstudo");

            migrationBuilder.DropTable(
                name: "PlanosEstudo");
        }
    }
}
