START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
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
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "Orders" DROP CONSTRAINT "FK_Orders_Users_UserId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    DROP INDEX "IX_UserAddresses_UserId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    DROP INDEX "IX_Reviews_UserId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    DROP INDEX "IX_RefreshTokens_UserId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    DROP INDEX "IX_EmailVerificationCodes_UserId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    DROP INDEX "IX_CartItems_CartId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "Users" ADD "PendingEmail" character varying(100);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "Users" ADD "SecurityStamp" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    UPDATE "Users" SET "SecurityStamp" = gen_random_uuid();
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "UserAddresses" ALTER COLUMN "Title" TYPE character varying(100);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "UserAddresses" ALTER COLUMN "PostalCode" TYPE character varying(5);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "UserAddresses" ALTER COLUMN "PhoneNumber" TYPE character varying(20);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "UserAddresses" ALTER COLUMN "FullName" TYPE character varying(200);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "UserAddresses" ALTER COLUMN "District" TYPE character varying(100);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "UserAddresses" ALTER COLUMN "DetailedAddress" TYPE character varying(1000);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "UserAddresses" ALTER COLUMN "City" TYPE character varying(100);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "Reviews" ALTER COLUMN "Comment" TYPE character varying(2000);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "RefreshTokens" ADD "SessionId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "PasswordResetCodes" ALTER COLUMN "Code" TYPE character varying(64);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "PasswordResetCodes" ADD "FailedAttempts" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "Orders" ADD "CouponCode" character varying(50);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "Orders" ADD "DiscountAmount" numeric(18,2);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "Orders" ADD "ShippingFee" numeric(18,2);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "Orders" ADD "Subtotal" numeric(18,2);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "EmailVerificationCodes" ALTER COLUMN "Code" TYPE character varying(64);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "EmailVerificationCodes" ADD "FailedAttempts" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "EmailVerificationCodes" ADD "TargetEmail" character varying(100);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    CREATE TABLE "OutboxMessages" (
        "Id" uuid NOT NULL,
        "Kind" character varying(50) NOT NULL,
        "ProtectedPayload" text NOT NULL,
        "AvailableAtUtc" timestamp with time zone NOT NULL,
        "ProcessedAtUtc" timestamp with time zone,
        "Attempts" integer NOT NULL,
        "LastError" character varying(200),
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_OutboxMessages" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    CREATE UNIQUE INDEX "IX_UserAddresses_UserId" ON "UserAddresses" ("UserId") WHERE "IsDefault" = TRUE AND "IsDeleted" = FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    CREATE UNIQUE INDEX "IX_Reviews_UserId_ProductId" ON "Reviews" ("UserId", "ProductId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "Reviews" ADD CONSTRAINT "CK_Reviews_Rating" CHECK ("Rating" BETWEEN 1 AND 5);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    CREATE INDEX "IX_RefreshTokens_UserId_SessionId" ON "RefreshTokens" ("UserId", "SessionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "ProductVariants" ADD CONSTRAINT "CK_ProductVariants_Price" CHECK ("Price" > 0);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "ProductVariants" ADD CONSTRAINT "CK_ProductVariants_Stock" CHECK ("StockQuantity" >= 0);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "Products" ADD CONSTRAINT "CK_Products_Price" CHECK ("Price" > 0);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "Products" ADD CONSTRAINT "CK_Products_Stock" CHECK ("StockQuantity" >= 0);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    CREATE INDEX "IX_EmailVerificationCodes_UserId_CreatedAtUtc" ON "EmailVerificationCodes" ("UserId", "CreatedAtUtc");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "Coupons" ADD CONSTRAINT "CK_Coupons_Discount" CHECK ("DiscountValue" > 0 AND "MinimumOrderAmount" >= 0 AND ("MaximumDiscountAmount" IS NULL OR "MaximumDiscountAmount" >= 0) AND ("DiscountType" = 'FixedAmount' OR ("DiscountType" = 'Percentage' AND "DiscountValue" <= 100)));
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "Coupons" ADD CONSTRAINT "CK_Coupons_Usage" CHECK ("TotalUsageLimit" > 0 AND "CurrentUsageCount" >= 0 AND "CurrentUsageCount" <= "TotalUsageLimit");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    CREATE UNIQUE INDEX "IX_CartItems_CartId_ProductId" ON "CartItems" ("CartId", "ProductId") WHERE "ProductVariantId" IS NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    CREATE UNIQUE INDEX "IX_CartItems_CartId_ProductId_ProductVariantId" ON "CartItems" ("CartId", "ProductId", "ProductVariantId") WHERE "ProductVariantId" IS NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "CartItems" ADD CONSTRAINT "CK_CartItems_Quantity" CHECK ("Quantity" > 0);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    CREATE INDEX "IX_OutboxMessages_ProcessedAtUtc_AvailableAtUtc" ON "OutboxMessages" ("ProcessedAtUtc", "AvailableAtUtc");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    ALTER TABLE "Orders" ADD CONSTRAINT "FK_Orders_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE INDEX "IX_Products_Name_Search" ON "Products" USING gin (lower("Name") gin_trgm_ops);
    CREATE INDEX "IX_Products_SKU_Search" ON "Products" USING gin (lower("SKU") gin_trgm_ops);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261010193605_HardenSessionsAndCommerce') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261010193605_HardenSessionsAndCommerce', '8.0.14');
    END IF;
END $EF$;
COMMIT;

