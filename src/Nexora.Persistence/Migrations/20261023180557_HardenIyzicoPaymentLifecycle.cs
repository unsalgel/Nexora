using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexora.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class HardenIyzicoPaymentLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Coupons_Usage",
                table: "Coupons");

            migrationBuilder.AddColumn<int>(
                name: "FraudStatus",
                table: "Orders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NextPaymentCheckAtUtc",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PaidAmount",
                table: "Orders",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentId",
                table: "Orders",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentPageUrl",
                table: "Orders",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PaymentReviewNotified",
                table: "Orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PaymentToken",
                table: "Orders",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReservedCouponId",
                table: "Orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "StockReserved",
                table: "Orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "SourceCartItemId",
                table: "OrderItems",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReservedUsageCount",
                table: "Coupons",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Existing paid orders already deducted inventory. The first iyzico implementation
            // stored tokens in IdempotencyKey and never reserved stock for Pending orders.
            migrationBuilder.Sql("""
                UPDATE "Orders" SET "StockReserved" = TRUE
                WHERE "Status" IN ('Paid', 'Processing', 'Shipped', 'Delivered');
                UPDATE "Orders" SET "PaymentToken" = "IdempotencyKey", "NextPaymentCheckAtUtc" = NOW()
                WHERE "IdempotencyKey" IS NOT NULL AND "RequestHash" IS NULL;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_PaymentId",
                table: "Orders",
                column: "PaymentId",
                unique: true,
                filter: "\"PaymentId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_PaymentStatus_NextPaymentCheckAtUtc",
                table: "Orders",
                columns: new[] { "PaymentStatus", "NextPaymentCheckAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_PaymentToken",
                table: "Orders",
                column: "PaymentToken",
                unique: true,
                filter: "\"PaymentToken\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ReservedCouponId",
                table: "Orders",
                column: "ReservedCouponId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Coupons_Usage",
                table: "Coupons",
                sql: "\"TotalUsageLimit\" > 0 AND \"CurrentUsageCount\" >= 0 AND \"ReservedUsageCount\" >= 0 AND \"CurrentUsageCount\" + \"ReservedUsageCount\" <= \"TotalUsageLimit\"");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Coupons_ReservedCouponId",
                table: "Orders",
                column: "ReservedCouponId",
                principalTable: "Coupons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Coupons_ReservedCouponId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_PaymentId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_PaymentStatus_NextPaymentCheckAtUtc",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_PaymentToken",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_ReservedCouponId",
                table: "Orders");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Coupons_Usage",
                table: "Coupons");

            migrationBuilder.DropColumn(
                name: "FraudStatus",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "NextPaymentCheckAtUtc",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaidAmount",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentPageUrl",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentReviewNotified",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentToken",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ReservedCouponId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "StockReserved",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "SourceCartItemId",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "ReservedUsageCount",
                table: "Coupons");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Coupons_Usage",
                table: "Coupons",
                sql: "\"TotalUsageLimit\" > 0 AND \"CurrentUsageCount\" >= 0 AND \"CurrentUsageCount\" <= \"TotalUsageLimit\"");
        }
    }
}
