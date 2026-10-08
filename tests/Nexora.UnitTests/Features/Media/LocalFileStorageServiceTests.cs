using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Moq;
using Nexora.Domain.Exceptions;
using Nexora.Infrastructure.Services;

namespace Nexora.UnitTests.Features.Media;

public sealed class LocalFileStorageServiceTests
{
    private readonly Mock<IWebHostEnvironment> _environmentMock;
    private readonly LocalFileStorageService _service;

    public LocalFileStorageServiceTests()
    {
        _environmentMock = new Mock<IWebHostEnvironment>();
        _environmentMock.Setup(e => e.WebRootPath).Returns(Path.GetTempPath());
        _environmentMock.Setup(e => e.ContentRootPath).Returns(Path.GetTempPath());

        _service = new LocalFileStorageService(_environmentMock.Object);
    }

    [Fact]
    public async Task SaveFileAsync_WhenEmptyStream_ThrowsBusinessValidationException()
    {
        using var stream = new MemoryStream();

        var act = () => _service.SaveFileAsync(stream, "test.png", "image/png");

        await act.Should().ThrowAsync<BusinessValidationException>()
            .WithMessage("Yüklenecek dosya boş olamaz.");
    }

    [Fact]
    public async Task SaveFileAsync_WhenInvalidMagicBytes_ThrowsBusinessValidationException()
    {
        var fakeBytes = System.Text.Encoding.UTF8.GetBytes("<?php echo 'malicious'; ?> not an image");
        using var stream = new MemoryStream(fakeBytes);

        var act = () => _service.SaveFileAsync(stream, "avatar.png", "image/png");

        await act.Should().ThrowAsync<BusinessValidationException>()
            .WithMessage("Dosya içeriği geçerli bir görsel formatı (JPG, PNG, WEBP) ile eşleşmiyor.");
    }

    [Fact]
    public async Task SaveFileAsync_WhenValidPngMagicBytes_SavesFileSuccessfully()
    {
        var validPngHeader = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52 };
        using var stream = new MemoryStream(validPngHeader);

        var result = await _service.SaveFileAsync(stream, "valid.png", "image/png");

        result.Should().NotBeNullOrWhiteSpace();
        result.Should().StartWith("/uploads/products/");
        result.Should().EndWith(".png");

        await _service.DeleteFileAsync(result);
    }
}
