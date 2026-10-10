using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Nexora.Domain.Entities;
using Nexora.Infrastructure.BackgroundJobs;
using Nexora.Infrastructure.Services;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.BackgroundJobs;

public sealed class FileCleanupJobTests
{
    [Fact]
    public async Task Cleanup_PreservesReferencesAndRecentUploads_AndDoesNotStarvePastFirstBatch()
    {
        var root = Path.Combine(Path.GetTempPath(), "nexora-orphan-test-" + Guid.NewGuid().ToString("N"));
        try
        {
            await using var context = TestDbContextFactory.Create();
            var environment = new Mock<IWebHostEnvironment>();
            environment.SetupGet(x => x.WebRootPath).Returns(root);
            environment.SetupGet(x => x.ContentRootPath).Returns(root);
            var folder = Path.Combine(root, "uploads", "products");
            Directory.CreateDirectory(folder);
            string CreateFile(bool old = true)
            {
                var name = Guid.NewGuid().ToString("N") + ".png";
                var path = Path.Combine(folder, name);
                File.WriteAllText(path, "test-fixture");
                if (old) File.SetLastWriteTimeUtc(path, DateTime.UtcNow.AddDays(-2));
                return "/uploads/products/" + name;
            }
            var references = Enumerable.Range(0, 110).Select(_ => CreateFile()).ToArray();
            foreach (var url in references)
                context.ProductImages.Add(new ProductImage { Id = Guid.NewGuid(), ProductId = Guid.NewGuid(), ImageUrl = url });
            var deletedBrandLogo = CreateFile();
            context.Brands.Add(new Brand { Id = Guid.NewGuid(), Name = "Silinen marka", LogoUrl = "https://cdn.example.test" + deletedBrandLogo + "?v=1", IsDeleted = true });
            var orphan = CreateFile();
            var fresh = CreateFile(false);
            var arbitrary = Path.Combine(folder, "user-owned.txt");
            File.WriteAllText(arbitrary, "keep");
            File.SetLastWriteTimeUtc(arbitrary, DateTime.UtcNow.AddDays(-2));
            await context.SaveChangesAsync();
            var job = new FileCleanupJob(context, environment.Object, new LocalFileStorageService(environment.Object), NullLogger<FileCleanupJob>.Instance);
            await job.RunAsync();
            foreach (var url in references.Append(deletedBrandLogo).Append(fresh))
                File.Exists(Path.Combine(folder, Path.GetFileName(url))).Should().BeTrue();
            File.Exists(Path.Combine(folder, Path.GetFileName(orphan))).Should().BeFalse();
            File.Exists(arbitrary).Should().BeTrue();
        }
        finally
        {
            if (Directory.Exists(root) && Path.GetFileName(root).StartsWith("nexora-orphan-test-", StringComparison.Ordinal))
                Directory.Delete(root, true);
        }
    }
}
