using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CozyLibrary.Api.Migrations
{
    /// <inheritdoc />
    public partial class AtualizarModeloBiblioteca : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Works");

            migrationBuilder.AddColumn<string>(
                name: "OwnerUserId",
                table: "Works",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Works_OwnerUserId",
                table: "Works",
                column: "OwnerUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Works_OwnerUserId",
                table: "Works");

            migrationBuilder.DropColumn(
                name: "OwnerUserId",
                table: "Works");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Works",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
