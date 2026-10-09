using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexora.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCouponsAndLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""Coupons"" (
                    ""Id"" uuid NOT NULL,
                    ""Code"" character varying(50) NOT NULL,
                    ""DiscountType"" character varying(20) NOT NULL,
                    ""DiscountValue"" numeric(18,2) NOT NULL,
                    ""MinimumOrderAmount"" numeric(18,2) NOT NULL,
                    ""MaximumDiscountAmount"" numeric(18,2) NULL,
                    ""TotalUsageLimit"" integer NOT NULL,
                    ""CurrentUsageCount"" integer NOT NULL,
                    ""ExpirationDateUtc"" timestamp with time zone NOT NULL,
                    ""IsActive"" boolean NOT NULL,
                    ""IsDeleted"" boolean NOT NULL,
                    ""CreatedAtUtc"" timestamp with time zone NOT NULL,
                    ""UpdatedAtUtc"" timestamp with time zone NULL,
                    ""xmin"" xid NOT NULL DEFAULT (0)::xid,
                    CONSTRAINT ""PK_Coupons"" PRIMARY KEY (""Id"")
                );

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Coupons_Code"" ON ""Coupons"" (""Code"");

                CREATE TABLE IF NOT EXISTS ""logs"" (
                    ""id"" uuid NOT NULL,
                    ""message"" text NOT NULL,
                    ""message_template"" text NULL,
                    ""level"" character varying(50) NOT NULL,
                    ""timestamp_utc"" timestamp with time zone NOT NULL,
                    ""exception"" text NULL,
                    ""properties"" jsonb NULL,
                    ""source"" character varying(150) NULL,
                    ""endpoint"" character varying(250) NULL,
                    ""user_email"" character varying(150) NULL,
                    ""client_ip"" character varying(50) NULL,
                    ""execution_duration_ms"" bigint NULL,
                    CONSTRAINT ""PK_logs"" PRIMARY KEY (""id"")
                );

                ALTER TABLE ""ProductVariants"" ADD COLUMN IF NOT EXISTS ""xmin"" xid NOT NULL DEFAULT (0)::xid;
                ALTER TABLE ""Products"" ADD COLUMN IF NOT EXISTS ""xmin"" xid NOT NULL DEFAULT (0)::xid;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DROP TABLE IF EXISTS ""logs"";
                DROP TABLE IF EXISTS ""Coupons"";
                ALTER TABLE ""ProductVariants"" DROP COLUMN IF EXISTS ""xmin"";
                ALTER TABLE ""Products"" DROP COLUMN IF EXISTS ""xmin"";
            ");
        }
    }
}
