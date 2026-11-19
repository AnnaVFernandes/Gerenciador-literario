using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CozyLibrary.Api.Migrations
{
    /// <inheritdoc />
    public partial class SyncReviewModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReviewHtml",
                table: "Works");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReviewHtml",
                table: "Works",
                type: "text",
                nullable: true);
        }
    }
}
