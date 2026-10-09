using System.Text.Json.Serialization;

namespace Nexora.Application.Common;

public interface IResult
{
    bool IsSuccess { get; }
    string? Message { get; }
}

public sealed class Result<T> : IResult
{
    public bool IsSuccess { get; init; }
    public T? Data { get; init; }
    public string? Message { get; init; }
    public List<string>? Errors { get; init; }

    [JsonConstructor]
    public Result(bool isSuccess, T? data, string? message, List<string>? errors)
    {
        IsSuccess = isSuccess;
        Data = data;
        Message = message;
        Errors = errors;
    }

    public static Result<T> Success(T data, string? message = null)
        => new(true, data, message, null);

    public static Result<T> Failure(string message, List<string>? errors = null)
        => new(false, default, message, errors);
}
