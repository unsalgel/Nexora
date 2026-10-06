using FluentAssertions;
using NetArchTest.Rules;
using Nexora.Api.Controllers;
using Nexora.Application.Common;
using Nexora.Domain.Entities;
using Nexora.Persistence.Context;

namespace Nexora.UnitTests.Architecture;

public class ArchitectureTests
{
    private const string DomainNamespace = "Nexora.Domain";
    private const string ApplicationNamespace = "Nexora.Application";
    private const string InfrastructureNamespace = "Nexora.Infrastructure";
    private const string PersistenceNamespace = "Nexora.Persistence";
    private const string ApiNamespace = "Nexora.Api";

    [Fact]
    public void Domain_Layer_Should_Not_Have_Dependency_On_Other_Layers()
    {
        var domainAssembly = typeof(BaseEntity).Assembly;

        var otherLayers = new[]
        {
            ApplicationNamespace,
            InfrastructureNamespace,
            PersistenceNamespace,
            ApiNamespace
        };

        var result = Types.InAssembly(domainAssembly)
            .ShouldNot()
            .HaveDependencyOnAny(otherLayers)
            .GetResult();

        result.IsSuccessful.Should().BeTrue("Domain katmanı çekirdektir; Application, Infrastructure, Persistence veya Api katmanlarına bağımlı olamaz.");
    }

    [Fact]
    public void Application_Layer_Should_Not_Have_Dependency_On_Infrastructure_Persistence_Or_Api()
    {
        var applicationAssembly = typeof(Result<>).Assembly;

        var forbiddenLayers = new[]
        {
            InfrastructureNamespace,
            PersistenceNamespace,
            ApiNamespace
        };

        var result = Types.InAssembly(applicationAssembly)
            .ShouldNot()
            .HaveDependencyOnAny(forbiddenLayers)
            .GetResult();

        result.IsSuccessful.Should().BeTrue("Application katmanı sadece Domain'e bağımlı olabilir; altyapı detaylarına veya Api katmanına bağımlı olamaz.");
    }

    [Fact]
    public void Controllers_Should_Not_Directly_Depend_On_DbContext_And_Must_Inherit_ApiControllerBase()
    {
        var apiAssembly = typeof(ApiControllerBase).Assembly;

        var directDbResult = Types.InAssembly(apiAssembly)
            .That()
            .Inherit(typeof(Microsoft.AspNetCore.Mvc.ControllerBase))
            .ShouldNot()
            .HaveDependencyOn(typeof(NexoraDbContext).FullName)
            .GetResult();

        directDbResult.IsSuccessful.Should().BeTrue("Controller sınıfları doğrudan DbContext kullanamaz; MediatR Sender üzerinden iletişim kurmalıdır.");

        var inheritanceResult = Types.InAssembly(apiAssembly)
            .That()
            .ResideInNamespace(ApiNamespace + ".Controllers")
            .And()
            .DoNotHaveName(nameof(ApiControllerBase))
            .Should()
            .Inherit(typeof(ApiControllerBase))
            .GetResult();

        inheritanceResult.IsSuccessful.Should().BeTrue("Tüm API Controller sınıfları ApiControllerBase sınıfından türemelidir.");
    }

    [Fact]
    public void Command_And_Query_Handlers_Should_Be_Sealed()
    {
        var applicationAssembly = typeof(Result<>).Assembly;

        var result = Types.InAssembly(applicationAssembly)
            .That()
            .ImplementInterface(typeof(MediatR.IRequestHandler<,>))
            .Should()
            .BeSealed()
            .GetResult();

        result.IsSuccessful.Should().BeTrue("Performans ve immutability için MediatR handler sınıfları sealed (mühürlü) olmalıdır.");
    }

    [Fact]
    public void Command_Classes_Should_End_With_Command()
    {
        var applicationAssembly = typeof(Result<>).Assembly;

        var result = Types.InAssembly(applicationAssembly)
            .That()
            .ImplementInterface(typeof(MediatR.IRequest))
            .Or()
            .ImplementInterface(typeof(MediatR.IRequest<>))
            .And()
            .DoNotHaveNameEndingWith("Query")
            .Should()
            .HaveNameEndingWith("Command")
            .GetResult();

        result.IsSuccessful.Should().BeTrue("CQRS standardı uyarınca tüm veri değiştirme istekleri 'Command' ekiyle bitmelidir.");
    }
}
