using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexora.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProductDatabaseIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Products_CreatedAtUtc",
                table: "Products",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_Products_IsActive_IsDeleted",
                table: "Products",
                columns: new[] { "IsActive", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_Name",
                table: "Products",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Price",
                table: "Products",
                column: "Price");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_CreatedAtUtc",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_IsActive_IsDeleted",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_Name",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_Price",
                table: "Products");
        }
    }
}
