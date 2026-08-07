namespace Nexora.Application.Common;

public sealed class Result<T>
{
    public bool IsSuccess { get; }
    public T? Data { get; }
    public string? Message { get; }
    public List<string>? Errors { get; }

    private Result(bool isSuccess, T? data, string? message, List<string>? errors)
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
