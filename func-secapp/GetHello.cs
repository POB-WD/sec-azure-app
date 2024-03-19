using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace func_secapp
{
    public class GetHello
    {
        private readonly ILogger<GetHello> _logger;

        public GetHello(ILogger<GetHello> logger)
        {
            _logger = logger;
        }

        [Function("GetHello")]
        public IActionResult Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", "post")] HttpRequest req)
        {
            _logger.LogInformation("C# HTTP trigger function: 'sec-app' processed a request.");
            return new OkObjectResult("Hello from func-secapp");
        }
    }
}
