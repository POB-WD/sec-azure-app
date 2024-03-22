using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace func_openapp {
    public class GetHello {
        private readonly ILogger<GetHello> _logger;

        public GetHello(ILogger<GetHello> logger) {
            _logger = logger;
        }

        [Function("GetHello")]
        public IActionResult Run([HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequest req) {
            _logger.LogInformation("C# HTTP trigger function: 'open-app' processed a request.");
            // Get the Authorization header from the incoming HTTP request
            if (!req.Headers.TryGetValue("Authorization", out var authorizationHeaders)) {
                return new BadRequestObjectResult("Authorization header not found");
            }

            _logger.LogInformation("auth header: {authorizationHeaders}", authorizationHeaders.ToString());
            
            return new OkObjectResult("Hello from func-openapp");
        }
    }
}
