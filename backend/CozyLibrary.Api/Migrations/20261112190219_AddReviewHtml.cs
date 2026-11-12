using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CozyLibrary.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewHtml : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReviewHtml",
                table: "Works",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReviewHtml",
                table: "Works");
        }
    }
}
