using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Moq;
using Nexora.Domain.Exceptions;
using Nexora.Infrastructure.Services;
using SkiaSharp;

namespace Nexora.UnitTests.Features.Media;

public sealed class LocalFileStorageServiceTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), "nexora-media-test-" + Guid.NewGuid().ToString("N"));
    private readonly LocalFileStorageService _service;

    public LocalFileStorageServiceTests()
    {
        var environment = new Mock<IWebHostEnvironment>();
        environment.Setup(e => e.WebRootPath).Returns(_root);
        environment.Setup(e => e.ContentRootPath).Returns(_root);
        _service = new LocalFileStorageService(environment.Object);
    }

    public void Dispose()
    {
        if (Directory.Exists(_root) && Path.GetFileName(_root).StartsWith("nexora-media-test-", StringComparison.Ordinal))
            Directory.Delete(_root, true);
    }

    private static byte[] CreateImage(int width = 2, int height = 2, SKEncodedImageFormat format = SKEncodedImageFormat.Png)
    {
        using var bitmap = new SKBitmap(width, height);
        bitmap.Erase(SKColors.Red);
        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(format, 90);
        return data.ToArray();
    }

    [Fact]
    public async Task SaveFileAsync_WhenEmptyStream_ThrowsBusinessValidationException()
    {
        using var stream = new MemoryStream();
        var act = () => _service.SaveFileAsync(stream, "test.png", "image/png");
        await act.Should().ThrowAsync<BusinessValidationException>().WithMessage("Yüklenecek dosya boş olamaz.");
    }

    [Theory]
    [InlineData("<?php echo 'malicious'; ?> not an image")]
    [InlineData("not-an-image")]
    public async Task SaveFileAsync_WhenInvalidContent_Rejects(string contents)
    {
        using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(contents));
        var act = () => _service.SaveFileAsync(stream, "avatar.png", "image/png");
        await act.Should().ThrowAsync<BusinessValidationException>();
        Directory.Exists(_root).Should().BeFalse();
    }

    [Fact]
    public async Task SaveFileAsync_WhenOnlyPngHeader_Rejects()
    {
        using var stream = new MemoryStream([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D, 0x49, 0x48, 0x44, 0x52]);
        var act = () => _service.SaveFileAsync(stream, "header.png", "image/png");
        await act.Should().ThrowAsync<BusinessValidationException>();
    }

    [Fact]
    public async Task SaveFileAsync_WhenPixelsTruncated_Rejects()
    {
        var bytes = CreateImage(128, 128);
        using var stream = new MemoryStream(bytes[..(bytes.Length / 2)]);
        var act = () => _service.SaveFileAsync(stream, "truncated.png", "image/png");
        await act.Should().ThrowAsync<BusinessValidationException>();
    }

    [Fact]
    public async Task SaveFileAsync_WhenMimeOrExtensionMismatchesContent_Rejects()
    {
        using var stream = new MemoryStream(CreateImage());
        var act = () => _service.SaveFileAsync(stream, "fake.jpg", "image/jpeg");
        await act.Should().ThrowAsync<BusinessValidationException>();
    }

    [Fact]
    public async Task SaveFileAsync_WhenCompressedImageExceedsDimensionLimit_RejectsBeforePixelAllocation()
    {
        using var stream = new MemoryStream(CreateImage(5000, 1));
        var act = () => _service.SaveFileAsync(stream, "wide.png", "image/png");
        await act.Should().ThrowAsync<BusinessValidationException>().WithMessage("*4096x4096*");
    }

    [Fact]
    public async Task SaveFileAsync_WhenNonSeekableStreamExceedsLimit_Rejects()
    {
        using var stream = new NonSeekableStream(new byte[5 * 1024 * 1024 + 1]);
        var act = () => _service.SaveFileAsync(stream, "oversized.png", "image/png");
        await act.Should().ThrowAsync<BusinessValidationException>().WithMessage("Dosya boyutu en fazla 5MB olabilir.");
    }

    [Theory]
    [InlineData(".png", "image/png", SKEncodedImageFormat.Png)]
    [InlineData(".jpg", "image/jpeg", SKEncodedImageFormat.Jpeg)]
    [InlineData(".webp", "image/webp", SKEncodedImageFormat.Webp)]
    public async Task SaveFileAsync_WhenValidImage_ReencodesAndRemovesAppendedContent(string extension, string mime, SKEncodedImageFormat format)
    {
        var bytes = CreateImage(format: format).Concat(System.Text.Encoding.UTF8.GetBytes("<script>untrusted</script>")).ToArray();
        using var stream = new NonSeekableStream(bytes);
        var result = await _service.SaveFileAsync(stream, "valid" + extension, mime);
        result.Should().StartWith("/uploads/products/").And.EndWith(extension);
        var saved = await File.ReadAllBytesAsync(Path.Combine(_root, "uploads", "products", Path.GetFileName(result)));
        System.Text.Encoding.UTF8.GetString(saved).Should().NotContain("untrusted");
        using var decoded = SKBitmap.Decode(saved);
        decoded.Width.Should().Be(2);
        (await _service.DeleteFileAsync(result)).Should().BeTrue();
    }

    [Theory]
    [InlineData("/uploads/products/../protected.png")]
    [InlineData("/uploads/products/../../protected.png")]
    [InlineData("/uploads/products/..\\protected.png")]
    [InlineData("/uploads/products-other/protected.png")]
    [InlineData("/uploads/products/%2e%2e/protected.png")]
    [InlineData("https://example.com/uploads/products/protected.png")]
    public async Task DeleteFileAsync_WhenOutsideManagedBoundary_PreservesFile(string url)
    {
        Directory.CreateDirectory(_root);
        var protectedPath = Path.Combine(_root, "protected.png");
        await File.WriteAllTextAsync(protectedPath, "keep");
        (await _service.DeleteFileAsync(url)).Should().BeFalse();
        File.Exists(protectedPath).Should().BeTrue();
    }

    private sealed class NonSeekableStream(byte[] bytes) : Stream
    {
        private readonly MemoryStream _inner = new(bytes);
        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => throw new NotSupportedException();
        public override long Position { get => throw new NotSupportedException(); set => throw new NotSupportedException(); }
        public override int Read(byte[] buffer, int offset, int count) => _inner.Read(buffer, offset, count);
        public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default) => _inner.ReadAsync(buffer, cancellationToken);
        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
        public override void Flush() { }
        protected override void Dispose(bool disposing) { if (disposing) _inner.Dispose(); base.Dispose(disposing); }
    }
}
