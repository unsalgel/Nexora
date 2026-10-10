using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexora.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class HardenSessionsAndCommerce : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // İş verisi otomatik silinmez; eski tutarsızlıklar varsa migration tamamen geri alınır.
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                  IF EXISTS (SELECT 1 FROM "CartItems" GROUP BY "CartId", "ProductId", "ProductVariantId" HAVING COUNT(*) > 1)
                     OR EXISTS (SELECT 1 FROM "Reviews" GROUP BY "UserId", "ProductId" HAVING COUNT(*) > 1)
                     OR EXISTS (SELECT 1 FROM "UserAddresses" WHERE "IsDefault" AND NOT "IsDeleted" GROUP BY "UserId" HAVING COUNT(*) > 1)
                  THEN RAISE EXCEPTION 'Migration öncesi yinelenen sepet/yorum/varsayılan adres verilerini inceleyiniz; otomatik veri silme uygulanmadı.';
                  END IF;
                END $$;
                DELETE FROM "RefreshTokens";
                DELETE FROM "EmailVerificationCodes";
                DELETE FROM "PasswordResetCodes";
                """);
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Users_UserId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_UserAddresses_UserId",
                table: "UserAddresses");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_UserId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens");

            migrationBuilder.DropIndex(
                name: "IX_EmailVerificationCodes_UserId",
                table: "EmailVerificationCodes");

            migrationBuilder.DropIndex(
                name: "IX_CartItems_CartId",
                table: "CartItems");

            migrationBuilder.AddColumn<string>(
                name: "PendingEmail",
                table: "Users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SecurityStamp",
                table: "Users",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.Sql("UPDATE \"Users\" SET \"SecurityStamp\" = gen_random_uuid();");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "UserAddresses",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "PostalCode",
                table: "UserAddresses",
                type: "character varying(5)",
                maxLength: 5,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PhoneNumber",
                table: "UserAddresses",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "FullName",
                table: "UserAddresses",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "District",
                table: "UserAddresses",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "DetailedAddress",
                table: "UserAddresses",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "City",
                table: "UserAddresses",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Comment",
                table: "Reviews",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SessionId",
                table: "RefreshTokens",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "PasswordResetCodes",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10);

            migrationBuilder.AddColumn<int>(
                name: "FailedAttempts",
                table: "PasswordResetCodes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CouponCode",
                table: "Orders",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountAmount",
                table: "Orders",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ShippingFee",
                table: "Orders",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Subtotal",
                table: "Orders",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            // PostgreSQL xmin sütununu her tabloda kendisi sağlar; burada yalnızca model eşlemesi değişir.

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "EmailVerificationCodes",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "FailedAttempts",
                table: "EmailVerificationCodes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TargetEmail",
                table: "EmailVerificationCodes",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "OutboxMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProtectedPayload = table.Column<string>(type: "text", nullable: false),
                    AvailableAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProcessedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Attempts = table.Column<int>(type: "integer", nullable: false),
                    LastError = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboxMessages", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserAddresses_UserId",
                table: "UserAddresses",
                column: "UserId",
                unique: true,
                filter: "\"IsDefault\" = TRUE AND \"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_UserId_ProductId",
                table: "Reviews",
                columns: new[] { "UserId", "ProductId" },
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Reviews_Rating",
                table: "Reviews",
                sql: "\"Rating\" BETWEEN 1 AND 5");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId_SessionId",
                table: "RefreshTokens",
                columns: new[] { "UserId", "SessionId" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_ProductVariants_Price",
                table: "ProductVariants",
                sql: "\"Price\" > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ProductVariants_Stock",
                table: "ProductVariants",
                sql: "\"StockQuantity\" >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Products_Price",
                table: "Products",
                sql: "\"Price\" > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Products_Stock",
                table: "Products",
                sql: "\"StockQuantity\" >= 0");

            migrationBuilder.CreateIndex(
                name: "IX_EmailVerificationCodes_UserId_CreatedAtUtc",
                table: "EmailVerificationCodes",
                columns: new[] { "UserId", "CreatedAtUtc" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Coupons_Discount",
                table: "Coupons",
                sql: "\"DiscountValue\" > 0 AND \"MinimumOrderAmount\" >= 0 AND (\"MaximumDiscountAmount\" IS NULL OR \"MaximumDiscountAmount\" >= 0) AND (\"DiscountType\" = 'FixedAmount' OR (\"DiscountType\" = 'Percentage' AND \"DiscountValue\" <= 100))");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Coupons_Usage",
                table: "Coupons",
                sql: "\"TotalUsageLimit\" > 0 AND \"CurrentUsageCount\" >= 0 AND \"CurrentUsageCount\" <= \"TotalUsageLimit\"");

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_CartId_ProductId",
                table: "CartItems",
                columns: new[] { "CartId", "ProductId" },
                unique: true,
                filter: "\"ProductVariantId\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_CartId_ProductId_ProductVariantId",
                table: "CartItems",
                columns: new[] { "CartId", "ProductId", "ProductVariantId" },
                unique: true,
                filter: "\"ProductVariantId\" IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_CartItems_Quantity",
                table: "CartItems",
                sql: "\"Quantity\" > 0");

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessages_ProcessedAtUtc_AvailableAtUtc",
                table: "OutboxMessages",
                columns: new[] { "ProcessedAtUtc", "AvailableAtUtc" });

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Users_UserId",
                table: "Orders",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
            migrationBuilder.Sql("""
                CREATE EXTENSION IF NOT EXISTS pg_trgm;
                CREATE INDEX "IX_Products_Name_Search" ON "Products" USING gin (lower("Name") gin_trgm_ops);
                CREATE INDEX "IX_Products_SKU_Search" ON "Products" USING gin (lower("SKU") gin_trgm_ops);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Digest/HMAC değerleri eski uygulamanın açık token/kod biçimine geri dönüştürülemez.
            migrationBuilder.Sql("""
                DELETE FROM "RefreshTokens";
                DELETE FROM "EmailVerificationCodes";
                DELETE FROM "PasswordResetCodes";
                DROP INDEX IF EXISTS "IX_Products_Name_Search";
                DROP INDEX IF EXISTS "IX_Products_SKU_Search";
                """);
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Users_UserId",
                table: "Orders");

            migrationBuilder.DropTable(
                name: "OutboxMessages");

            migrationBuilder.DropIndex(
                name: "IX_UserAddresses_UserId",
                table: "UserAddresses");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_UserId_ProductId",
                table: "Reviews");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Reviews_Rating",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_UserId_SessionId",
                table: "RefreshTokens");

            migrationBuilder.DropCheckConstraint(
                name: "CK_ProductVariants_Price",
                table: "ProductVariants");

            migrationBuilder.DropCheckConstraint(
                name: "CK_ProductVariants_Stock",
                table: "ProductVariants");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Products_Price",
                table: "Products");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Products_Stock",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_EmailVerificationCodes_UserId_CreatedAtUtc",
                table: "EmailVerificationCodes");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Coupons_Discount",
                table: "Coupons");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Coupons_Usage",
                table: "Coupons");

            migrationBuilder.DropIndex(
                name: "IX_CartItems_CartId_ProductId",
                table: "CartItems");

            migrationBuilder.DropIndex(
                name: "IX_CartItems_CartId_ProductId_ProductVariantId",
                table: "CartItems");

            migrationBuilder.DropCheckConstraint(
                name: "CK_CartItems_Quantity",
                table: "CartItems");

            migrationBuilder.DropColumn(
                name: "PendingEmail",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SecurityStamp",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "FailedAttempts",
                table: "PasswordResetCodes");

            migrationBuilder.DropColumn(
                name: "CouponCode",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DiscountAmount",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ShippingFee",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "Subtotal",
                table: "Orders");


            migrationBuilder.DropColumn(
                name: "FailedAttempts",
                table: "EmailVerificationCodes");

            migrationBuilder.DropColumn(
                name: "TargetEmail",
                table: "EmailVerificationCodes");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "UserAddresses",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "PostalCode",
                table: "UserAddresses",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(5)",
                oldMaxLength: 5,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PhoneNumber",
                table: "UserAddresses",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<string>(
                name: "FullName",
                table: "UserAddresses",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "District",
                table: "UserAddresses",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "DetailedAddress",
                table: "UserAddresses",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000);

            migrationBuilder.AlterColumn<string>(
                name: "City",
                table: "UserAddresses",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Comment",
                table: "Reviews",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "PasswordResetCodes",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(64)",
                oldMaxLength: 64);

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "EmailVerificationCodes",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(64)",
                oldMaxLength: 64);

            migrationBuilder.CreateIndex(
                name: "IX_UserAddresses_UserId",
                table: "UserAddresses",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_UserId",
                table: "Reviews",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailVerificationCodes_UserId",
                table: "EmailVerificationCodes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_CartId",
                table: "CartItems",
                column: "CartId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Users_UserId",
                table: "Orders",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
