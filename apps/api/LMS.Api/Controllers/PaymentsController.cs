using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private static readonly IReadOnlyDictionary<string, PlanSeed> PlanSeeds = new Dictionary<string, PlanSeed>(StringComparer.OrdinalIgnoreCase)
    {
        ["starter"] = new("starter", "Starter", 19m, 349m, "/mo", "Start quickly", new[] { "Single academy workspace", "Core course delivery", "Certificates and evidence packs" }),
        ["growth"] = new("growth", "Growth", 49m, 899m, "/mo", "Most popular", new[] { "Team academy workspace", "Cohorts, dashboards, and exports", "MADCloud tutor and admin assist" }),
        ["scale"] = new("scale", "Scale", 149m, 2799m, "/mo", "For growing teams", new[] { "Multi-tenant training operations", "Manager portals and intervention queues", "MADProspects universe integration events" })
    };

    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(IConfiguration configuration, IHttpClientFactory httpClientFactory, ILogger<PaymentsController> logger)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    [HttpGet("plans")]
    public ActionResult<IReadOnlyList<PayfastPlanDto>> GetPlans()
    {
        var currency = ResolveCurrency();
        return Ok(PlanSeeds.Values.Select(plan => ToDto(plan, currency)).ToList());
    }

    [HttpPost("payfast/onsite")]
    public async Task<ActionResult<PayfastOnsiteSessionDto>> CreateOnsiteSession([FromBody] CreatePayfastSessionDto dto)
    {
        var settings = PayfastSettings.From(_configuration);
        var currency = ResolveCurrency();
        var plan = PlanSeeds.TryGetValue(dto.PlanCode ?? string.Empty, out var selected)
            ? selected
            : PlanSeeds["growth"];

        if (!settings.IsConfigured)
        {
            return BadRequest(new PayfastOnsiteSessionDto(
                null,
                settings.EngineUrl,
                false,
                "Payfast.io is selected as the only payment provider, but merchant credentials are not configured."));
        }

        var amount = currency == "ZAR" ? plan.ZarAmount : plan.UsdAmount;
        var paymentId = $"MADLEARN-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..34];
        var returnUrl = ChooseUrl(dto.ReturnUrl, settings.ReturnUrl);
        var cancelUrl = ChooseUrl(dto.CancelUrl, settings.CancelUrl);
        var notifyUrl = settings.NotifyUrl;

        var payload = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["merchant_id"] = settings.MerchantId,
            ["merchant_key"] = settings.MerchantKey,
            ["return_url"] = returnUrl,
            ["cancel_url"] = cancelUrl,
            ["notify_url"] = notifyUrl,
            ["m_payment_id"] = paymentId,
            ["amount"] = amount.ToString("0.00", CultureInfo.InvariantCulture),
            ["item_name"] = $"{settings.ProductName} {plan.Name}",
            ["item_description"] = $"{plan.Name} subscription billed in {currency}",
            ["custom_str1"] = plan.Code,
            ["custom_str2"] = currency,
            ["email_address"] = string.IsNullOrWhiteSpace(dto.Email) ? settings.FallbackEmail : dto.Email.Trim(),
            ["subscription_type"] = "1",
            ["billing_date"] = DateTime.UtcNow.Date.AddDays(1).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            ["recurring_amount"] = amount.ToString("0.00", CultureInfo.InvariantCulture),
            ["frequency"] = "3",
            ["cycles"] = "0"
        };
        payload["signature"] = BuildSignature(payload, settings.Passphrase);

        try
        {
            var client = _httpClientFactory.CreateClient();
            using var response = await client.PostAsync(settings.OnsiteProcessUrl, new FormUrlEncodedContent(payload));
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Payfast onsite session failed with {Status}: {Body}", response.StatusCode, body);
                return StatusCode((int)HttpStatusCode.BadGateway, new PayfastOnsiteSessionDto(
                    null,
                    settings.EngineUrl,
                    true,
                    "Payfast.io did not create a checkout session. Please verify merchant credentials and onsite permissions."));
            }

            var uuid = ExtractUuid(body);
            if (string.IsNullOrWhiteSpace(uuid))
            {
                _logger.LogWarning("Payfast onsite session response did not include UUID: {Body}", body);
                return StatusCode((int)HttpStatusCode.BadGateway, new PayfastOnsiteSessionDto(
                    null,
                    settings.EngineUrl,
                    true,
                    "Payfast.io returned an unexpected checkout response."));
            }

            return Ok(new PayfastOnsiteSessionDto(uuid, settings.EngineUrl, true, "Payfast.io checkout session created."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Payfast onsite session failed.");
            return StatusCode((int)HttpStatusCode.BadGateway, new PayfastOnsiteSessionDto(
                null,
                settings.EngineUrl,
                true,
                "Payfast.io checkout is temporarily unavailable."));
        }
    }

    [HttpPost("payfast/notify")]
    public async Task<IActionResult> Notify()
    {
        var form = Request.HasFormContentType
            ? Request.Form.ToDictionary(item => item.Key, item => item.Value.ToString(), StringComparer.Ordinal)
            : new Dictionary<string, string>(StringComparer.Ordinal);

        var signature = form.TryGetValue("signature", out var value) ? value : string.Empty;
        form.Remove("signature");
        var expected = BuildSignature(new SortedDictionary<string, string>(form, StringComparer.Ordinal), PayfastSettings.From(_configuration).Passphrase);

        if (!string.IsNullOrWhiteSpace(signature) && !signature.Equals(expected, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Rejected Payfast notify callback with invalid signature.");
            return BadRequest("Invalid Payfast signature.");
        }

        await Task.CompletedTask;
        return Ok("Payfast notify accepted.");
    }

    private PayfastPlanDto ToDto(PlanSeed plan, string currency) =>
        new(plan.Code, plan.Name, currency, currency == "ZAR" ? plan.ZarAmount : plan.UsdAmount, plan.Cadence, plan.Badge, plan.Features);

    private string ResolveCurrency()
    {
        var forced = _configuration["Payfast:Currency"];
        if (forced is "USD" or "ZAR")
        {
            return forced;
        }

        var country = Request.Headers["CF-IPCountry"].FirstOrDefault()
            ?? Request.Headers["X-Country-Code"].FirstOrDefault()
            ?? Request.Headers["X-Geo-Country"].FirstOrDefault();
        return string.Equals(country, "ZA", StringComparison.OrdinalIgnoreCase) ? "ZAR" : "USD";
    }

    private static string ChooseUrl(string? requested, string configured) =>
        Uri.TryCreate(requested, UriKind.Absolute, out var uri) && uri.Scheme.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? uri.ToString()
            : configured;

    private static string BuildSignature(SortedDictionary<string, string> fields, string? passphrase)
    {
        var pairs = fields
            .Where(item => !string.IsNullOrWhiteSpace(item.Value))
            .Select(item => $"{item.Key}={WebUtility.UrlEncode(item.Value).Replace("%20", "+")}");
        var source = string.Join("&", pairs);
        if (!string.IsNullOrWhiteSpace(passphrase))
        {
            source += $"&passphrase={WebUtility.UrlEncode(passphrase).Replace("%20", "+")}";
        }

        return Convert.ToHexString(MD5.HashData(Encoding.UTF8.GetBytes(source))).ToLowerInvariant();
    }

    private static string? ExtractUuid(string body)
    {
        var trimmed = body.Trim();
        if (Guid.TryParse(trimmed.Trim('"'), out var direct))
        {
            return direct.ToString();
        }

        try
        {
            using var document = System.Text.Json.JsonDocument.Parse(trimmed);
            if (document.RootElement.TryGetProperty("uuid", out var uuid))
            {
                return uuid.GetString();
            }
        }
        catch
        {
            return null;
        }

        return null;
    }

    private sealed record PlanSeed(string Code, string Name, decimal UsdAmount, decimal ZarAmount, string Cadence, string Badge, string[] Features);

    private sealed record PayfastSettings(
        string ProductName,
        string MerchantId,
        string MerchantKey,
        string Passphrase,
        bool Sandbox,
        string ReturnUrl,
        string CancelUrl,
        string NotifyUrl,
        string FallbackEmail)
    {
        public bool IsConfigured => !string.IsNullOrWhiteSpace(MerchantId) && !string.IsNullOrWhiteSpace(MerchantKey);
        public string EngineUrl => Sandbox ? "https://sandbox.payfast.co.za/onsite/engine.js" : "https://www.payfast.co.za/onsite/engine.js";
        public string OnsiteProcessUrl => Sandbox ? "https://sandbox.payfast.co.za/onsite/process" : "https://www.payfast.co.za/onsite/process";

        public static PayfastSettings From(IConfiguration configuration) => new(
            configuration["Payfast:ProductName"] ?? "MADLearn",
            configuration["Payfast:MerchantId"] ?? string.Empty,
            configuration["Payfast:MerchantKey"] ?? string.Empty,
            configuration["Payfast:Passphrase"] ?? string.Empty,
            configuration.GetValue("Payfast:Sandbox", true),
            configuration["Payfast:ReturnUrl"] ?? "https://madlearn.madprospects.com/billing/success",
            configuration["Payfast:CancelUrl"] ?? "https://madlearn.madprospects.com/billing/cancelled",
            configuration["Payfast:NotifyUrl"] ?? "https://madlearnapi.madprospects.com/api/payments/payfast/notify",
            configuration["Payfast:FallbackEmail"] ?? "billing@madprospects.com");
    }
}

public record PayfastPlanDto(string Code, string Name, string Currency, decimal Amount, string Cadence, string Badge, string[] Features);
public record CreatePayfastSessionDto(string? PlanCode, string? Email, string? ReturnUrl, string? CancelUrl);
public record PayfastOnsiteSessionDto(string? Uuid, string EngineUrl, bool Configured, string Message);
