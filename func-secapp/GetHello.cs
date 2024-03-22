using System.Net.Http.Headers;
using System.Security.Claims;
using Azure.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using Azure.Identity;
using Microsoft.Extensions.Primitives;

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
        public async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequest req,
            ClaimsPrincipal principal) {


            // log principal stuff
            // Get the Authorization header from the incoming HTTP request
            if (!req.Headers.TryGetValue("Authorization", out var authorizationHeaders)) {
                return new BadRequestObjectResult("Authorization header not found");
            }
            
            _logger.LogInformation("auth header: {authorizationHeaders}", authorizationHeaders.ToString());

            //var claimValues = string.Join(",", principal.Claims.Select(x => x.Value).ToList());
            //var identity = principal.Identity?.Name;
            //var isAuth = principal.Identity?.IsAuthenticated;

            //_logger.LogInformation("claimValues: {claimValues}, identity: {identity}, isAuth: {isAuth}", claimValues, identity, isAuth);
            

            var clientId = "3d14b644-fee0-4f1f-af2e-0343c86148c0";
            var clientSecret = Environment.GetEnvironmentVariable("ClientSecret");
            var tenantId = "3ea78af3-094b-492f-9237-8077bc4f31ab";

            var functionUrl = "https://apim-secapp-westeurope-001.azure-api.net/pobfuncopen/GetHello";
            var scope = "api://3d14b644-fee0-4f1f-af2e-0343c86148c0/.default";

            var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

            var tokenRequestContext = new TokenRequestContext(new[] { scope });
            var accessToken = await credential.GetTokenAsync(tokenRequestContext);

            // reuse incoming token
            var incomingToken = req.Headers["Authorization"];
            _logger.LogInformation("extracted auth header: {token}", incomingToken.ToString());
            if (StringValues.IsNullOrEmpty(incomingToken)) {
                return new BadRequestObjectResult("Bearer token not provided.");
            }
            
            using var httpClient = new HttpClient();
            //httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken.Token);
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(incomingToken.ToString());

            var response = await httpClient.GetAsync(functionUrl);

            if (!response.IsSuccessStatusCode) {
                _logger.LogInformation("HTTP call to Azure Function (open) through API Management failed! {response}", response.StatusCode);
                return new OkObjectResult("boo!");
            }
            _logger.LogInformation("HTTP call to Azure Function through API Management succeeded!");
            return new OkObjectResult("yay!");
        }
    }
}
